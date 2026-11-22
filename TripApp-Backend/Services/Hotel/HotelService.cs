using System.Net.Http.Headers;
using System.Text.Json;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class HotelService : IHotelService
{
    private static readonly string[] OverpassEndpoints =
    [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.private.coffee/api/interpreter"
    ];

    private static readonly string[] LodgingTypes =
    [
        "hotel", "guest_house", "hostel", "motel", "apartment", "chalet"
    ];

    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan StaleOnErrorTtl = TimeSpan.FromHours(2);
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, CacheEntry> Cache = new();
    private const int CacheLimit = 300;

    private readonly HttpClient _httpClient;

    public HotelService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(30);

        _httpClient.DefaultRequestHeaders.UserAgent.Clear();
        _httpClient.DefaultRequestHeaders.UserAgent.Add(
            new ProductInfoHeaderValue("TripPlanner", "1.0")
        );
    }

    private sealed record CacheEntry(DateTime At, List<Hotel> Hotels);

    private static string BuildCacheKey(double latitude, double longitude, int radiusKm, int limit) =>
        $"hotel:{Math.Round(latitude, 3).ToString(System.Globalization.CultureInfo.InvariantCulture)}:{Math.Round(longitude, 3).ToString(System.Globalization.CultureInfo.InvariantCulture)}:{radiusKm}:{limit}";

    private static bool TryGetFreshCache(string key, out List<Hotel> hotels)
    {
        if (Cache.TryGetValue(key, out var entry) && DateTime.UtcNow - entry.At < CacheTtl)
        {
            hotels = entry.Hotels;
            return true;
        }

        hotels = [];
        return false;
    }

    private static bool TryGetStaleCache(string key, out List<Hotel> hotels)
    {
        if (Cache.TryGetValue(key, out var entry) && DateTime.UtcNow - entry.At < StaleOnErrorTtl)
        {
            hotels = entry.Hotels;
            return true;
        }

        hotels = [];
        return false;
    }

    private static void PruneCache()
    {
        if (Cache.Count <= CacheLimit) return;

        var stale = Cache
            .OrderBy(kv => kv.Value.At)
            .Take(Cache.Count - CacheLimit)
            .Select(kv => kv.Key)
            .ToList();

        foreach (var key in stale)
            Cache.TryRemove(key, out _);
    }

    public async Task<List<Hotel>> SearchHotelsAsync(
        HotelSearchRequest request)
    {
        if (request.Latitude < -90 || request.Latitude > 90)
            throw new ArgumentException("Invalid latitude.");

        if (request.Longitude < -180 || request.Longitude > 180)
            throw new ArgumentException("Invalid longitude.");

        var requestedRadiusKm = (int)Math.Clamp(request.RadiusKm, 1, 10);
        var limit = Math.Clamp(request.Limit, 1, 20);
        var cacheKey = BuildCacheKey(request.Latitude, request.Longitude, requestedRadiusKm, limit);

        if (TryGetFreshCache(cacheKey, out var cached))
            return cached;

        var deadlineUtc = DateTime.UtcNow.AddSeconds(22);
        using var overallDeadline = new CancellationTokenSource(TimeSpan.FromSeconds(22));
        var deadlineToken = overallDeadline.Token;

        var radii = BuildRadiusFallback(requestedRadiusKm);
        Exception? lastError = null;
        List<Hotel>? emptyCandidate = null;

        foreach (var radiusKm in radii)
        {
            if (deadlineToken.IsCancellationRequested) break;

            try
            {
                var (hotels, foundAny, error) = await TrySearchRadiusAsync(
                    request, radiusKm, limit, deadlineUtc, deadlineToken);

                lastError = error ?? lastError;

                if (hotels.Count > 0)
                {
                    Cache[cacheKey] = new CacheEntry(DateTime.UtcNow, hotels);
                    PruneCache();
                    return hotels;
                }

                if (foundAny)
                    emptyCandidate ??= hotels;
            }
            catch (OperationCanceledException) when (deadlineToken.IsCancellationRequested)
            {
                break;
            }
        }

        if (emptyCandidate != null)
        {
            Cache[cacheKey] = new CacheEntry(DateTime.UtcNow, emptyCandidate);
            PruneCache();
            return emptyCandidate;
        }

        if (TryGetStaleCache(cacheKey, out var stale))
            return stale;

        throw new HotelSearchUnavailableException(
            "Open stay data is temporarily unavailable. Please retry in a moment.",
            lastError);
    }

    private static IReadOnlyList<int> BuildRadiusFallback(int requestedRadiusKm)
    {
        var radii = new List<int> { requestedRadiusKm };
        foreach (var fallback in new[] { 5, 3 })
        {
            if (fallback < requestedRadiusKm && !radii.Contains(fallback))
                radii.Add(fallback);
        }
        return radii;
    }

    private async Task<(List<Hotel> Hotels, bool FoundAny, Exception? Error)> TrySearchRadiusAsync(
        HotelSearchRequest request,
        int radiusKm,
        int limit,
        DateTime deadlineUtc,
        CancellationToken deadlineToken)
    {
        var radiusMeters = radiusKm * 1000;
        var lat = request.Latitude.ToString(System.Globalization.CultureInfo.InvariantCulture);
        var lon = request.Longitude.ToString(System.Globalization.CultureInfo.InvariantCulture);
        var typeRegex = string.Join("|", LodgingTypes);

        var lightQuery = $"""
        [out:json][timeout:8];
        (
          node["tourism"~"^({typeRegex})$"](around:{radiusMeters},{lat},{lon});
        );
        out tags;
        """;

        var fullQuery = $"""
        [out:json][timeout:10];
        (
          nwr["tourism"~"^({typeRegex})$"](around:{radiusMeters},{lat},{lon});
        );
        out center tags;
        """;

        Exception? lastError = null;
        List<Hotel>? emptyCandidate = null;

        // Fast path: node-only on first mirror, then other mirrors.
        var (lightHotels, lightFound, lightErr) = await TryQueryAcrossMirrorsAsync(
            lightQuery, request, limit, deadlineUtc, deadlineToken, firstMirrorOnly: true);
        lastError = lightErr ?? lastError;
        if (lightHotels.Count > 0) return (lightHotels, true, lastError);
        if (lightFound) emptyCandidate ??= lightHotels;

        var (lightAllHotels, lightAllFound, lightAllErr) = await TryQueryAcrossMirrorsAsync(
            lightQuery, request, limit, deadlineUtc, deadlineToken, firstMirrorOnly: false, skipFirstMirror: true);
        lastError = lightAllErr ?? lastError;
        if (lightAllHotels.Count > 0) return (lightAllHotels, true, lastError);
        if (lightAllFound) emptyCandidate ??= lightAllHotels;

        // Heavier nwr only when time remains and light pass returned too few/no results.
        var remainingMs = (deadlineUtc - DateTime.UtcNow).TotalMilliseconds;
        if (remainingMs > 2500 && !deadlineToken.IsCancellationRequested)
        {
            var (fullHotels, fullFound, fullErr) = await TryQueryAcrossMirrorsAsync(
                fullQuery, request, limit, deadlineUtc, deadlineToken, firstMirrorOnly: false);
            lastError = fullErr ?? lastError;
            if (fullHotels.Count > 0) return (fullHotels, true, lastError);
            if (fullFound) emptyCandidate ??= fullHotels;
        }

        return (emptyCandidate ?? [], emptyCandidate != null, lastError);
    }

    private async Task<(List<Hotel> Hotels, bool FoundAny, Exception? Error)> TryQueryAcrossMirrorsAsync(
        string query,
        HotelSearchRequest request,
        int limit,
        DateTime deadlineUtc,
        CancellationToken deadlineToken,
        bool firstMirrorOnly,
        bool skipFirstMirror = false)
    {
        Exception? lastError = null;
        List<Hotel>? emptyCandidate = null;
        var endpoints = OverpassEndpoints.AsEnumerable();
        if (skipFirstMirror) endpoints = endpoints.Skip(1);
        if (firstMirrorOnly) endpoints = endpoints.Take(1);

        foreach (var endpoint in endpoints)
        {
            if (deadlineToken.IsCancellationRequested) break;

            try
            {
                var json = await ExecuteAsync(endpoint, query, deadlineUtc, deadlineToken);
                var hotels = ParseHotels(json, request, limit);
                if (hotels.Count > 0)
                    return (hotels, true, lastError);
                emptyCandidate ??= hotels;
            }
            catch (OperationCanceledException) when (deadlineToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or OperationCanceledException)
            {
                lastError = ex;
            }
        }

        return (emptyCandidate ?? [], emptyCandidate != null, lastError);
    }

    private async Task<string> ExecuteAsync(string endpoint, string query, DateTime deadlineUtc, CancellationToken deadlineToken)
    {
        if (deadlineToken.IsCancellationRequested)
            throw new OperationCanceledException(deadlineToken);

        var remaining = deadlineUtc - DateTime.UtcNow;
        if (remaining <= TimeSpan.FromMilliseconds(500))
            throw new OperationCanceledException(deadlineToken);

        using var perRequestTimeout = CancellationTokenSource.CreateLinkedTokenSource(deadlineToken);
        perRequestTimeout.CancelAfter(remaining < TimeSpan.FromSeconds(8) ? remaining : TimeSpan.FromSeconds(8));

        using var content = new FormUrlEncodedContent(
            new Dictionary<string, string> { ["data"] = query });

        using var response = await _httpClient.PostAsync(endpoint, content, perRequestTimeout.Token);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(perRequestTimeout.Token);
            throw new HttpRequestException(
                $"Hotel API returned {(int)response.StatusCode}: {error}");
        }

        return await response.Content.ReadAsStringAsync(perRequestTimeout.Token);
    }

    private static List<Hotel> ParseHotels(string json, HotelSearchRequest request, int limit)
    {
        using var document = JsonDocument.Parse(json);
        var hotels = new List<Hotel>();

        if (!document.RootElement.TryGetProperty("elements", out var elements))
            return hotels;

        var seenIds = new HashSet<string>(StringComparer.Ordinal);
        var seenNameCoords = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var element in elements.EnumerateArray())
        {
            if (!TryGetCoordinates(element, out var latitude, out var longitude))
                continue;

            var tags = element.TryGetProperty("tags", out var tagElement)
                ? tagElement
                : default;

            var name = GetTag(tags, "name");
            if (string.IsNullOrWhiteSpace(name))
                continue;

            var osmType = element.TryGetProperty("type", out var typeEl)
                ? typeEl.GetString() ?? "node"
                : "node";
            var osmId = element.TryGetProperty("id", out var idEl)
                ? idEl.GetInt64()
                : 0L;

            var idKey = $"{osmType}:{osmId}";
            if (!seenIds.Add(idKey))
                continue;

            var proximityKey = $"{NormalizeName(name)}:{Math.Round(latitude, 3)}:{Math.Round(longitude, 3)}";
            if (!seenNameCoords.Add(proximityKey))
                continue;

            var distance = CalculateDistanceKm(
                request.Latitude, request.Longitude, latitude, longitude);

            int? stars = null;
            if (int.TryParse(GetTag(tags, "stars"), out var parsedStars))
                stars = parsedStars;

            hotels.Add(new Hotel
            {
                Id = osmId,
                Name = name,
                Address = BuildAddress(tags),
                Latitude = latitude,
                Longitude = longitude,
                DistanceKm = Math.Round(distance, 2),
                Stars = stars,
                Website = GetTag(tags, "website"),
                Phone = GetTag(tags, "phone"),
                Type = GetTag(tags, "tourism"),
                EstimatedPricePerNight = null
            });
        }

        return hotels
            .OrderBy(x => x.DistanceKm)
            .Take(limit)
            .ToList();
    }

    private static bool TryGetCoordinates(JsonElement element, out double latitude, out double longitude)
    {
        // Nodes have lat/lon; ways/relations with out center have center.lat/lon.
        if (element.TryGetProperty("lat", out var latEl) &&
            element.TryGetProperty("lon", out var lonEl))
        {
            latitude = latEl.GetDouble();
            longitude = lonEl.GetDouble();
            return true;
        }

        if (element.TryGetProperty("center", out var center) &&
            center.TryGetProperty("lat", out latEl) &&
            center.TryGetProperty("lon", out lonEl))
        {
            latitude = latEl.GetDouble();
            longitude = lonEl.GetDouble();
            return true;
        }

        latitude = 0;
        longitude = 0;
        return false;
    }

    private static string NormalizeName(string name) =>
        new string((name ?? string.Empty)
            .Trim()
            .ToLowerInvariant()
            .Where(char.IsLetterOrDigit)
            .ToArray());

    private static string? GetTag(JsonElement tags, string key)
    {
        if (tags.ValueKind != JsonValueKind.Object)
            return null;

        return tags.TryGetProperty(key, out var value)
            ? value.GetString()
            : null;
    }

    private static string? BuildAddress(JsonElement tags)
    {
        var parts = new List<string>();

        var houseNumber = GetTag(tags, "addr:housenumber");
        var street = GetTag(tags, "addr:street");
        var city = GetTag(tags, "addr:city");
        var postcode = GetTag(tags, "addr:postcode");

        if (!string.IsNullOrWhiteSpace(houseNumber))
            parts.Add(houseNumber);

        if (!string.IsNullOrWhiteSpace(street))
            parts.Add(street);

        if (!string.IsNullOrWhiteSpace(city))
            parts.Add(city);

        if (!string.IsNullOrWhiteSpace(postcode))
            parts.Add(postcode);

        return parts.Count == 0
            ? null
            : string.Join(", ", parts);
    }

    private static double CalculateDistanceKm(
        double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadius = 6371;

        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a =
            Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos(DegreesToRadians(lat1)) *
            Math.Cos(DegreesToRadians(lat2)) *
            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return earthRadius * c;
    }

    private static double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180;
    }
}

public class HotelSearchUnavailableException : Exception
{
    public HotelSearchUnavailableException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}