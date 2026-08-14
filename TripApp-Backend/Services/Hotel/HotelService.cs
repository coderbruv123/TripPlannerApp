using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TripApp_Backend.Data;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class HotelService : IHotelService
{
    private readonly HttpClient _httpClient;

    private readonly ApplicationDbContext _context;

    public HotelService(
        HttpClient httpClient,
        ApplicationDbContext context)
    {
        _httpClient = httpClient;
        _context = context;
        _httpClient.Timeout = TimeSpan.FromSeconds(12);

        _httpClient.DefaultRequestHeaders.UserAgent.Clear();
        _httpClient.DefaultRequestHeaders.UserAgent.Add(
            new ProductInfoHeaderValue("TripPlanner", "1.0")
        );
    }

    public async Task<List<Hotel>> ListAllAsync()
    {
        return await _context.Hotels
            .OrderBy(x => x.City)
            .ThenBy(x => x.Name)
            .ToListAsync();
    }

    public async Task<Hotel> AddAsync(Hotel hotel)
    {
        hotel.Id = 0;
        _context.Hotels.Add(hotel);
        await _context.SaveChangesAsync();
        return hotel;
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var hotel = await _context.Hotels
            .FirstOrDefaultAsync(x => x.Id == id);

        if (hotel == null)
            return false;

        _context.Hotels.Remove(hotel);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<Hotel>> NearAsync(
        double latitude,
        double longitude,
        double radiusKm,
        int limit)
    {
        var radius = Math.Clamp(radiusKm, 1, 100);
        var take = Math.Clamp(limit, 1, 30);

        // Prefer live hotel data from OpenStreetMap via Overpass.
        try
        {
            var live = await QueryOverpassAsync(
                latitude, longitude, radius, take);

            if (live.Count > 0)
                return live;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Overpass hotel search failed: {ex.Message}");
        }

        // Fall back to the seeded catalog when the API is unavailable.
        return await DbNearAsync(latitude, longitude, radius, take);
    }

    private async Task<List<Hotel>> DbNearAsync(
        double latitude,
        double longitude,
        double radiusKm,
        int limit)
    {
        var all = await _context.Hotels.ToListAsync();

        return all
            .Select(h => new
            {
                Hotel = h,
                Distance = CalculateDistanceKm(
                    latitude,
                    longitude,
                    h.Latitude,
                    h.Longitude)
            })
            .Where(x => x.Distance <= radiusKm)
            .OrderBy(x => x.Distance)
            .Take(limit)
            .Select(x =>
            {
                x.Hotel.DistanceKm = Math.Round(x.Distance, 2);
                return x.Hotel;
            })
            .ToList();
    }

    public async Task<List<Hotel>> SearchHotelsAsync(
        HotelSearchRequest request)
    {
        if (request.Latitude < -90 || request.Latitude > 90)
            throw new ArgumentException("Invalid latitude.");

        if (request.Longitude < -180 || request.Longitude > 180)
            throw new ArgumentException("Invalid longitude.");

        var radiusKm = Math.Clamp(request.RadiusKm, 1, 50);
        var limit = Math.Clamp(request.Limit, 1, 20);

        return await QueryOverpassAsync(
            request.Latitude,
            request.Longitude,
            radiusKm,
            limit);
    }

    private static readonly string[] OverpassMirrors =
    {
        "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass-api.de/api/interpreter",
        "https://overpass.openstreetmap.ru/api/interpreter"
    };

    private static readonly TimeSpan OverpassOverallTimeout =
        TimeSpan.FromSeconds(6);

    private static readonly TimeSpan OverpassCacheTtl =
        TimeSpan.FromHours(6);

    private static readonly ConcurrentDictionary<string, (DateTime ExpiresAt, List<Hotel> Hotels)>
        OverpassCache = new();

    private async Task<List<Hotel>> QueryOverpassAsync(
        double latitude,
        double longitude,
        double radiusKm,
        int limit)
    {
        var cacheKey =
            $"{latitude:0.0},{longitude:0.0},{radiusKm:0.0}";

        if (OverpassCache.TryGetValue(
                cacheKey,
                out var cached))
        {
            if (cached.ExpiresAt > DateTime.UtcNow)
                return cached.Hotels;

            OverpassCache.TryRemove(cacheKey, out _);
        }

        var radiusMeters = (int)(radiusKm * 1000);

        var query = $"""
        [out:json][timeout:5];

        node["tourism"="hotel"]
        (around:{radiusMeters},{latitude.ToString(System.Globalization.CultureInfo.InvariantCulture)},{longitude.ToString(System.Globalization.CultureInfo.InvariantCulture)});

        out tags;
        """;

        using var content = new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                ["data"] = query
            });

        using var cts = new CancellationTokenSource(
            OverpassOverallTimeout);

        foreach (var mirror in OverpassMirrors)
        {
            if (cts.IsCancellationRequested)
                break;

            HttpResponseMessage response;

            try
            {
                response = await _httpClient.PostAsync(
                    mirror,
                    content,
                    cts.Token
                );
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception)
            {
                continue;
            }

            if (!response.IsSuccessStatusCode)
                continue;

            var hotels = ParseHotels(
                await response.Content.ReadAsStringAsync(cts.Token),
                latitude,
                longitude,
                limit);

            if (hotels.Count == 0)
                continue;

            OverpassCache[cacheKey] = (
                DateTime.UtcNow.Add(OverpassCacheTtl),
                hotels);

            return hotels;
        }

        return new List<Hotel>();
    }

    private static List<Hotel> ParseHotels(
        string json,
        double latitude,
        double longitude,
        int limit)
    {
        using var document = JsonDocument.Parse(json);

        var hotels = new List<Hotel>();

        if (!document.RootElement.TryGetProperty(
                "elements",
                out var elements))
        {
            return hotels;
        }

        foreach (var element in elements.EnumerateArray())
        {
            if (!element.TryGetProperty("lat", out var latElement) ||
                !element.TryGetProperty("lon", out var lonElement))
            {
                continue;
            }

            var hotelLatitude = latElement.GetDouble();
            var hotelLongitude = lonElement.GetDouble();

            var tags = element.TryGetProperty(
                "tags",
                out var tagElement)
                ? tagElement
                : default;

            var name = GetTag(tags, "name");

            if (string.IsNullOrWhiteSpace(name))
                continue;

            var distance = CalculateDistanceKm(
                latitude,
                longitude,
                hotelLatitude,
                hotelLongitude
            );

            int? stars = null;

            if (int.TryParse(
                    GetTag(tags, "stars"),
                    out var parsedStars))
            {
                stars = parsedStars;
            }

            hotels.Add(new Hotel
            {
                Id = element.GetProperty("id").GetInt64(),

                Name = name,

                Address = BuildAddress(tags),

                Latitude = hotelLatitude,

                Longitude = hotelLongitude,

                DistanceKm = Math.Round(distance, 2),

                Stars = stars,

                Website = GetTag(tags, "website"),

                Phone = GetTag(tags, "phone"),

                Type = GetTag(tags, "tourism"),

                City = GetTag(tags, "addr:city") ?? "",

                EstimatedPricePerNight = null
            });
        }

        return hotels
            .OrderBy(x => x.DistanceKm)
            .Take(limit)
            .ToList();
    }

    private static string? GetTag(
        JsonElement tags,
        string key)
    {
        if (tags.ValueKind != JsonValueKind.Object)
            return null;

        return tags.TryGetProperty(key, out var value)
            ? value.GetString()
            : null;
    }

    private static string? BuildAddress(
        JsonElement tags)
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
        double lat1,
        double lon1,
        double lat2,
        double lon2)
    {
        const double earthRadius = 6371;

        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a =
            Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos(DegreesToRadians(lat1)) *
            Math.Cos(DegreesToRadians(lat2)) *
            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(
            Math.Sqrt(a),
            Math.Sqrt(1 - a)
        );

        return earthRadius * c;
    }

    private static double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180;
    }
}