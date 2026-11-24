using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TripApp_Backend.Data;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class HotelService : IHotelService
{
    private static readonly string[] OverpassEndpoints =
    [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter"
    ];

    private static readonly string[] LodgingTypes =
    [
        "hotel", "guest_house", "hostel", "motel", "apartment", "chalet"
    ];

    private static readonly HashSet<string> LodgingTypeSet =
        new(LodgingTypes, StringComparer.OrdinalIgnoreCase);

    private static readonly TimeSpan MemoryCacheTtl = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan DbFreshTtl = TimeSpan.FromHours(12);
    private static readonly TimeSpan DbStaleOnErrorTtl = TimeSpan.FromDays(7);
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, CacheEntry> MemoryCache = new();
    private const int MemoryCacheLimit = 300;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _httpClient;
    private readonly ApplicationDbContext _db;

    public HotelService(HttpClient httpClient, ApplicationDbContext db)
    {
        _httpClient = httpClient;
        _db = db;
        _httpClient.Timeout = TimeSpan.FromSeconds(30);

        _httpClient.DefaultRequestHeaders.UserAgent.Clear();
        _httpClient.DefaultRequestHeaders.UserAgent.Add(
            new ProductInfoHeaderValue("TripPlanner", "1.0")
        );
    }

    private sealed record CacheEntry(DateTime At, HotelSearchResult Result);

    private static string BuildCacheKey(double latitude, double longitude, int radiusKm, int limit) =>
        $"hotel:{Math.Round(latitude, 3).ToString(CultureInfo.InvariantCulture)}:{Math.Round(longitude, 3).ToString(CultureInfo.InvariantCulture)}:{radiusKm}:{limit}";

    private static bool TryGetFreshMemoryCache(string key, out HotelSearchResult result)
    {
        if (MemoryCache.TryGetValue(key, out var entry) && DateTime.UtcNow - entry.At < MemoryCacheTtl)
        {
            result = entry.Result;
            return true;
        }

        result = new HotelSearchResult();
        return false;
    }

    private static void PruneMemoryCache()
    {
        if (MemoryCache.Count <= MemoryCacheLimit) return;

        var staleKeys = MemoryCache
            .OrderBy(kv => kv.Value.At)
            .Take(MemoryCache.Count - MemoryCacheLimit)
            .Select(kv => kv.Key)
            .ToList();

        foreach (var key in staleKeys)
            MemoryCache.TryRemove(key, out _);
    }

    private async Task<HotelSearchResult?> TryGetFreshDbCacheAsync(string key, CancellationToken cancellationToken)
    {
        try
        {
            var entry = await _db.HotelSearchCaches.AsNoTracking()
                .FirstOrDefaultAsync(x => x.CacheKey == key, cancellationToken);
            if (entry == null) return null;
            if (DateTime.UtcNow - entry.FetchedAtUtc > DbFreshTtl) return null;

            var result = JsonSerializer.Deserialize<HotelSearchResult>(entry.PayloadJson, JsonOptions);
            if (result == null) return null;

            result.Stale = false;
            result.Notice ??= null;
            // Fresh persistent cache hit: mark as cached for transparency while keeping contract compatible.
            if (string.IsNullOrWhiteSpace(result.Notice))
                result.Notice = null;
            return result;
        }
        catch
        {
            return null;
        }
    }

    private async Task<HotelSearchResult?> TryGetStaleDbCacheAsync(string key, CancellationToken cancellationToken)
    {
        try
        {
            var entry = await _db.HotelSearchCaches.AsNoTracking()
                .FirstOrDefaultAsync(x => x.CacheKey == key, cancellationToken);
            if (entry == null) return null;
            if (DateTime.UtcNow - entry.FetchedAtUtc > DbStaleOnErrorTtl) return null;

            var result = JsonSerializer.Deserialize<HotelSearchResult>(entry.PayloadJson, JsonOptions);
            if (result == null || result.Hotels.Count == 0) return null;

            result.Stale = true;
            result.Notice = "Showing cached stay results because live hotel data is temporarily unavailable.";
            return result;
        }
        catch
        {
            return null;
        }
    }

    private async Task SaveDbCacheAsync(string key, HotelSearchResult result, string source, CancellationToken cancellationToken)
    {
        try
        {
            var payload = JsonSerializer.Serialize(new HotelSearchResult
            {
                Hotels = result.Hotels,
                Notice = null,
                Stale = false
            }, JsonOptions);

            var existing = await _db.HotelSearchCaches.FirstOrDefaultAsync(x => x.CacheKey == key, cancellationToken);
            if (existing == null)
            {
                _db.HotelSearchCaches.Add(new HotelSearchCache
                {
                    CacheKey = key,
                    PayloadJson = payload,
                    FetchedAtUtc = DateTime.UtcNow,
                    Source = source
                });
            }
            else
            {
                existing.PayloadJson = payload;
                existing.FetchedAtUtc = DateTime.UtcNow;
                existing.Source = source;
            }

            await _db.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            // Cache persistence is best-effort; search should still succeed.
        }
    }

    public async Task<HotelSearchResult> SearchHotelsAsync(HotelSearchRequest request)
    {
        if (request.Latitude < -90 || request.Latitude > 90)
            throw new ArgumentException("Invalid latitude.");

        if (request.Longitude < -180 || request.Longitude > 180)
            throw new ArgumentException("Invalid longitude.");

        var requestedRadiusKm = (int)Math.Clamp(request.RadiusKm, 1, 10);
        var limit = Math.Clamp(request.Limit, 1, 20);
        var cacheKey = BuildCacheKey(request.Latitude, request.Longitude, requestedRadiusKm, limit);

        if (TryGetFreshMemoryCache(cacheKey, out var memoryCached))
            return memoryCached;

        var dbFresh = await TryGetFreshDbCacheAsync(cacheKey, CancellationToken.None);
        if (dbFresh != null)
        {
            MemoryCache[cacheKey] = new CacheEntry(DateTime.UtcNow, dbFresh);
            PruneMemoryCache();
            return dbFresh;
        }

        using var overallDeadline = new CancellationTokenSource(TimeSpan.FromSeconds(22));
        var deadlineToken = overallDeadline.Token;
        var overpassDeadlineUtc = DateTime.UtcNow.AddSeconds(12);

        var radii = BuildRadiusFallback(requestedRadiusKm);
        Exception? lastError = null;
        HotelSearchResult? emptyCandidate = null;

        foreach (var radiusKm in radii)
        {
            if (deadlineToken.IsCancellationRequested) break;

            try
            {
                var (hotels, foundAny, error) = await TrySearchRadiusAsync(
                    request, radiusKm, limit, overpassDeadlineUtc, deadlineToken);

                lastError = error ?? lastError;

                if (hotels.Count > 0)
                {
                    var result = new HotelSearchResult { Hotels = hotels };
                    MemoryCache[cacheKey] = new CacheEntry(DateTime.UtcNow, result);
                    PruneMemoryCache();
                    await SaveDbCacheAsync(cacheKey, result, "overpass", CancellationToken.None);
                    return result;
                }

                if (foundAny)
                    emptyCandidate ??= new HotelSearchResult { Hotels = hotels };
            }
            catch (OperationCanceledException) when (deadlineToken.IsCancellationRequested)
            {
                break;
            }
        }

        // Overpass returned a confirmed empty result (data source responded).
        if (emptyCandidate != null)
        {
            MemoryCache[cacheKey] = new CacheEntry(DateTime.UtcNow, emptyCandidate);
            PruneMemoryCache();
            await SaveDbCacheAsync(cacheKey, emptyCandidate, "overpass-empty", CancellationToken.None);
            return emptyCandidate;
        }

        // Overpass was unavailable/errored. Try lighter fallback providers before giving up.
        try
        {
            var fallbackHotels = await TryPhotonFallbackAsync(request, requestedRadiusKm, limit, deadlineToken);
            if (fallbackHotels.Count > 0)
            {
                var result = new HotelSearchResult
                {
                    Hotels = fallbackHotels,
                    Notice = "Live Overpass data was unavailable; showing fallback open stay results."
                };
                MemoryCache[cacheKey] = new CacheEntry(DateTime.UtcNow, result);
                PruneMemoryCache();
                await SaveDbCacheAsync(cacheKey, result, "photon-fallback", CancellationToken.None);
                return result;
            }
        }
        catch (Exception ex)
        {
            lastError = ex;
        }

        try
        {
            var nominatimHotels = await TryNominatimFallbackAsync(request, requestedRadiusKm, limit, deadlineToken);
            if (nominatimHotels.Count > 0)
            {
                var result = new HotelSearchResult
                {
                    Hotels = nominatimHotels,
                    Notice = "Live Overpass data was unavailable; showing fallback open stay results."
                };
                MemoryCache[cacheKey] = new CacheEntry(DateTime.UtcNow, result);
                PruneMemoryCache();
                await SaveDbCacheAsync(cacheKey, result, "nominatim-fallback", CancellationToken.None);
                return result;
            }
        }
        catch (Exception ex)
        {
            lastError = ex;
        }

        var staleDb = await TryGetStaleDbCacheAsync(cacheKey, CancellationToken.None);
        if (staleDb != null)
            return staleDb;

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
        var lat = request.Latitude.ToString(CultureInfo.InvariantCulture);
        var lon = request.Longitude.ToString(CultureInfo.InvariantCulture);
        var typeRegex = string.Join("|", LodgingTypes);

        // Fast pass: nodes only. out body includes coordinates + tags.
        var lightQuery = $"""
        [out:json][timeout:5];
        (
          node["tourism"~"^({typeRegex})$"](around:{radiusMeters},{lat},{lon});
        );
        out body;
        """;

        // Fuller pass: nodes/ways/relations. out body center includes node coords and way/relation centers.
        var fullQuery = $"""
        [out:json][timeout:7];
        (
          nwr["tourism"~"^({typeRegex})$"](around:{radiusMeters},{lat},{lon});
        );
        out body center;
        """;

        Exception? lastError = null;
        List<Hotel>? emptyCandidate = null;

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
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or OperationCanceledException or JsonException)
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
        perRequestTimeout.CancelAfter(remaining < TimeSpan.FromSeconds(5) ? remaining : TimeSpan.FromSeconds(5));

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

    private async Task<List<Hotel>> TryPhotonFallbackAsync(
        HotelSearchRequest request,
        int radiusKm,
        int limit,
        CancellationToken deadlineToken)
    {
        if (deadlineToken.IsCancellationRequested) return [];

        using var fallbackTimeout = CancellationTokenSource.CreateLinkedTokenSource(deadlineToken);
        fallbackTimeout.CancelAfter(TimeSpan.FromSeconds(6));
        var token = fallbackTimeout.Token;

        var lat = request.Latitude.ToString(CultureInfo.InvariantCulture);
        var lon = request.Longitude.ToString(CultureInfo.InvariantCulture);
        var perTypeLimit = Math.Clamp(limit, 5, 15).ToString(CultureInfo.InvariantCulture);

        var tasks = LodgingTypes.Select(async type =>
        {
            try
            {
                var url =
                    $"https://photon.komoot.io/api/?q={Uri.EscapeDataString(type)}&lat={lat}&lon={lon}&limit={perTypeLimit}&osm_tag=tourism:{Uri.EscapeDataString(type)}";
                using var response = await _httpClient.GetAsync(url, token);
                if (!response.IsSuccessStatusCode) return new List<Hotel>();
                var json = await response.Content.ReadAsStringAsync(token);
                return ParsePhotonHotels(json, request, radiusKm);
            }
            catch
            {
                return new List<Hotel>();
            }
        }).ToArray();

        var results = await Task.WhenAll(tasks);
        return MergeAndRank(results.SelectMany(x => x), request, limit);
    }

    private async Task<List<Hotel>> TryNominatimFallbackAsync(
        HotelSearchRequest request,
        int radiusKm,
        int limit,
        CancellationToken deadlineToken)
    {
        if (deadlineToken.IsCancellationRequested) return [];

        using var fallbackTimeout = CancellationTokenSource.CreateLinkedTokenSource(deadlineToken);
        fallbackTimeout.CancelAfter(TimeSpan.FromSeconds(8));
        var token = fallbackTimeout.Token;

        var deltaLat = radiusKm / 111.0;
        var deltaLon = radiusKm / (111.0 * Math.Max(Math.Cos(DegreesToRadians(request.Latitude)), 0.2));
        var left = (request.Longitude - deltaLon).ToString(CultureInfo.InvariantCulture);
        var right = (request.Longitude + deltaLon).ToString(CultureInfo.InvariantCulture);
        var top = (request.Latitude + deltaLat).ToString(CultureInfo.InvariantCulture);
        var bottom = (request.Latitude - deltaLat).ToString(CultureInfo.InvariantCulture);
        var viewbox = $"{left},{top},{right},{bottom}";

        var queries = new[] { "hotel", "hostel", "guest house motel apartment chalet" };
        var collected = new List<Hotel>();

        foreach (var q in queries)
        {
            if (token.IsCancellationRequested) break;
            if (collected.Count >= limit) break;

            try
            {
                var url =
                    $"https://nominatim.openstreetmap.org/search?format=jsonv2&limit=20&q={Uri.EscapeDataString(q)}&viewbox={Uri.EscapeDataString(viewbox)}&bounded=1&addressdetails=1&extratags=1";
                using var response = await _httpClient.GetAsync(url, token);
                if (!response.IsSuccessStatusCode) continue;
                var json = await response.Content.ReadAsStringAsync(token);
                collected.AddRange(ParseNominatimHotels(json, request, radiusKm));
            }
            catch
            {
                // best-effort fallback
            }
        }

        return MergeAndRank(collected, request, limit);
    }

    private static List<Hotel> ParseNominatimHotels(string json, HotelSearchRequest request, int radiusKm)
    {
        using var document = JsonDocument.Parse(json);
        var hotels = new List<Hotel>();
        if (document.RootElement.ValueKind != JsonValueKind.Array)
            return hotels;

        foreach (var element in document.RootElement.EnumerateArray())
        {
            if (element.ValueKind != JsonValueKind.Object) continue;

            var category = GetJsonString(element, "category") ?? GetJsonString(element, "class");
            var type = GetJsonString(element, "type");
            if (!string.Equals(category, "tourism", StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrWhiteSpace(type) ||
                !LodgingTypeSet.Contains(type))
                continue;

            var name = GetJsonString(element, "name");
            if (string.IsNullOrWhiteSpace(name))
            {
                // Some nominatim rows put name in display_name only; skip unnamed.
                continue;
            }

            if (!double.TryParse(GetJsonString(element, "lat"), NumberStyles.Float, CultureInfo.InvariantCulture, out var latitude) ||
                !double.TryParse(GetJsonString(element, "lon"), NumberStyles.Float, CultureInfo.InvariantCulture, out var longitude))
                continue;

            var distance = CalculateDistanceKm(request.Latitude, request.Longitude, latitude, longitude);
            if (distance > radiusKm + 0.25)
                continue;

            long osmId = 0;
            if (element.TryGetProperty("osm_id", out var idEl) && idEl.TryGetInt64(out var idVal))
                osmId = idVal;

            int? stars = null;
            string? website = null;
            string? phone = null;
            if (element.TryGetProperty("extratags", out var extratags) && extratags.ValueKind == JsonValueKind.Object)
            {
                if (int.TryParse(GetJsonString(extratags, "stars"), out var parsedStars))
                    stars = parsedStars;
                website = GetJsonString(extratags, "website") ?? GetJsonString(extratags, "contact:website");
                phone = GetJsonString(extratags, "phone") ?? GetJsonString(extratags, "contact:phone");
            }

            hotels.Add(new Hotel
            {
                Id = osmId,
                Name = name,
                Address = BuildNominatimAddress(element),
                Latitude = latitude,
                Longitude = longitude,
                DistanceKm = Math.Round(distance, 2),
                Stars = stars,
                Website = website,
                Phone = phone,
                Type = type,
                EstimatedPricePerNight = null
            });
        }

        return hotels;
    }

    private static string? BuildNominatimAddress(JsonElement element)
    {
        if (!element.TryGetProperty("address", out var address) || address.ValueKind != JsonValueKind.Object)
        {
            var display = GetJsonString(element, "display_name");
            return string.IsNullOrWhiteSpace(display) ? null : display;
        }

        var houseNumber = GetJsonString(address, "house_number");
        var road = GetJsonString(address, "road") ?? GetJsonString(address, "pedestrian") ?? GetJsonString(address, "footway");
        var city = GetJsonString(address, "city")
            ?? GetJsonString(address, "town")
            ?? GetJsonString(address, "village")
            ?? GetJsonString(address, "municipality");
        var postcode = GetJsonString(address, "postcode");
        var country = GetJsonString(address, "country");

        var parts = new List<string>();
        var streetPart = string.Join(" ", new[] { houseNumber, road }.Where(s => !string.IsNullOrWhiteSpace(s)));
        if (!string.IsNullOrWhiteSpace(streetPart)) parts.Add(streetPart);
        if (!string.IsNullOrWhiteSpace(city)) parts.Add(city);
        if (!string.IsNullOrWhiteSpace(postcode)) parts.Add(postcode);
        if (!string.IsNullOrWhiteSpace(country)) parts.Add(country);

        if (parts.Count > 0) return string.Join(", ", parts);
        var displayName = GetJsonString(element, "display_name");
        return string.IsNullOrWhiteSpace(displayName) ? null : displayName;
    }

    private static List<Hotel> ParsePhotonHotels(string json, HotelSearchRequest request, int radiusKm)
    {
        using var document = JsonDocument.Parse(json);
        var hotels = new List<Hotel>();

        if (!document.RootElement.TryGetProperty("features", out var features) ||
            features.ValueKind != JsonValueKind.Array)
            return hotels;

        foreach (var feature in features.EnumerateArray())
        {
            if (!feature.TryGetProperty("properties", out var props) ||
                props.ValueKind != JsonValueKind.Object)
                continue;

            var osmKey = GetJsonString(props, "osm_key");
            var osmValue = GetJsonString(props, "osm_value");
            if (!string.Equals(osmKey, "tourism", StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrWhiteSpace(osmValue) ||
                !LodgingTypeSet.Contains(osmValue))
                continue;

            var name = GetJsonString(props, "name");
            if (string.IsNullOrWhiteSpace(name))
                continue;

            if (!TryGetPhotonCoordinates(feature, out var latitude, out var longitude))
                continue;

            var distance = CalculateDistanceKm(request.Latitude, request.Longitude, latitude, longitude);
            if (distance > radiusKm + 0.25)
                continue;

            var osmId = props.TryGetProperty("osm_id", out var idEl) && idEl.TryGetInt64(out var idVal)
                ? idVal
                : 0L;
            var osmType = GetJsonString(props, "osm_type") ?? "N";

            hotels.Add(new Hotel
            {
                Id = osmId,
                Name = name,
                Address = BuildPhotonAddress(props),
                Latitude = latitude,
                Longitude = longitude,
                DistanceKm = Math.Round(distance, 2),
                Stars = null,
                Website = null,
                Phone = null,
                Type = osmValue,
                EstimatedPricePerNight = null
            });

            // avoid duplicate-key noise from repeated photon items
            _ = osmType;
        }

        return hotels;
    }

    private static bool TryGetPhotonCoordinates(JsonElement feature, out double latitude, out double longitude)
    {
        latitude = 0;
        longitude = 0;
        if (!feature.TryGetProperty("geometry", out var geometry) ||
            geometry.ValueKind != JsonValueKind.Object)
            return false;

        if (!geometry.TryGetProperty("coordinates", out var coords) ||
            coords.ValueKind != JsonValueKind.Array ||
            coords.GetArrayLength() < 2)
            return false;

        if (!coords[0].TryGetDouble(out var lon) || !coords[1].TryGetDouble(out var lat))
            return false;

        latitude = lat;
        longitude = lon;
        return true;
    }

    private static string? BuildPhotonAddress(JsonElement props)
    {
        var parts = new List<string>();
        var houseNumber = GetJsonString(props, "housenumber");
        var street = GetJsonString(props, "street");
        var city = GetJsonString(props, "city");
        var postcode = GetJsonString(props, "postcode");
        var country = GetJsonString(props, "country");

        var streetPart = string.Join(" ", new[] { houseNumber, street }.Where(s => !string.IsNullOrWhiteSpace(s)));
        if (!string.IsNullOrWhiteSpace(streetPart)) parts.Add(streetPart);
        if (!string.IsNullOrWhiteSpace(city)) parts.Add(city);
        if (!string.IsNullOrWhiteSpace(postcode)) parts.Add(postcode);
        if (!string.IsNullOrWhiteSpace(country)) parts.Add(country);

        return parts.Count == 0 ? null : string.Join(", ", parts);
    }

    private static List<Hotel> MergeAndRank(IEnumerable<Hotel> hotels, HotelSearchRequest request, int limit)
    {
        var byId = new Dictionary<string, Hotel>(StringComparer.Ordinal);
        var byNameCoords = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var hotel in hotels)
        {
            var idKey = hotel.Id > 0 ? $"{hotel.Type}:{hotel.Id}" : string.Empty;
            if (!string.IsNullOrEmpty(idKey) && byId.ContainsKey(idKey))
                continue;

            var proximityKey = $"{NormalizeName(hotel.Name)}:{Math.Round(hotel.Latitude, 3)}:{Math.Round(hotel.Longitude, 3)}";
            if (!byNameCoords.Add(proximityKey))
                continue;

            // Recompute distance in case source was imprecise.
            hotel.DistanceKm = Math.Round(
                CalculateDistanceKm(request.Latitude, request.Longitude, hotel.Latitude, hotel.Longitude), 2);

            if (!string.IsNullOrEmpty(idKey))
                byId[idKey] = hotel;
            else
                byId[$"anon:{Guid.NewGuid():N}"] = hotel;
        }

        return byId.Values
            .OrderBy(x => x.DistanceKm)
            .ThenBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
            .Take(limit)
            .ToList();
    }

    private static List<Hotel> ParseHotels(string json, HotelSearchRequest request, int limit)
    {
        using var document = JsonDocument.Parse(json);
        if (!document.RootElement.TryGetProperty("elements", out var elements) ||
            elements.ValueKind != JsonValueKind.Array)
            return [];

        var hotels = new List<Hotel>();

        foreach (var element in elements.EnumerateArray())
        {
            if (!TryGetCoordinates(element, out var latitude, out var longitude))
                continue;

            var tags = element.TryGetProperty("tags", out var tagElement) && tagElement.ValueKind == JsonValueKind.Object
                ? tagElement
                : default;

            var name = GetTag(tags, "name");
            if (string.IsNullOrWhiteSpace(name))
                continue;

            var tourism = GetTag(tags, "tourism");
            if (string.IsNullOrWhiteSpace(tourism) || !LodgingTypeSet.Contains(tourism))
                continue;

            var osmType = element.TryGetProperty("type", out var typeEl)
                ? typeEl.GetString() ?? "node"
                : "node";
            var osmId = element.TryGetProperty("id", out var idEl) && idEl.TryGetInt64(out var idVal)
                ? idVal
                : 0L;

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
                Website = GetTag(tags, "website") ?? GetTag(tags, "contact:website"),
                Phone = GetTag(tags, "phone") ?? GetTag(tags, "contact:phone"),
                Type = tourism,
                EstimatedPricePerNight = null
            });
        }

        return MergeAndRank(hotels, request, limit);
    }

    private static bool TryGetCoordinates(JsonElement element, out double latitude, out double longitude)
    {
        if (element.TryGetProperty("lat", out var latEl) &&
            element.TryGetProperty("lon", out var lonEl) &&
            latEl.TryGetDouble(out var lat) &&
            lonEl.TryGetDouble(out var lon))
        {
            latitude = lat;
            longitude = lon;
            return true;
        }

        if (element.TryGetProperty("center", out var center) &&
            center.ValueKind == JsonValueKind.Object &&
            center.TryGetProperty("lat", out latEl) &&
            center.TryGetProperty("lon", out lonEl) &&
            latEl.TryGetDouble(out lat) &&
            lonEl.TryGetDouble(out lon))
        {
            latitude = lat;
            longitude = lon;
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

        return tags.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }

    private static string? GetJsonString(JsonElement obj, string key)
    {
        if (obj.ValueKind != JsonValueKind.Object)
            return null;
        return obj.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String
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

        var streetPart = string.Join(" ", new[] { houseNumber, street }.Where(s => !string.IsNullOrWhiteSpace(s)));
        if (!string.IsNullOrWhiteSpace(streetPart))
            parts.Add(streetPart);

        if (!string.IsNullOrWhiteSpace(city))
            parts.Add(city);

        if (!string.IsNullOrWhiteSpace(postcode))
            parts.Add(postcode);

        return parts.Count == 0 ? null : string.Join(", ", parts);
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
