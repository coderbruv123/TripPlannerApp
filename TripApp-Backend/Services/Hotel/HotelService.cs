using System.Net.Http.Headers;
using System.Text.Json;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class HotelService : IHotelService
{
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

    public async Task<List<Hotel>> SearchHotelsAsync(
        HotelSearchRequest request)
    {
        if (request.Latitude < -90 || request.Latitude > 90)
            throw new ArgumentException("Invalid latitude.");

        if (request.Longitude < -180 || request.Longitude > 180)
            throw new ArgumentException("Invalid longitude.");

        var radiusKm = Math.Clamp(request.RadiusKm, 1, 10);
        var limit = Math.Clamp(request.Limit, 1, 20);

        var radiusMeters = radiusKm * 1000;

        var query = $"""
        [out:json][timeout:15];

        node["tourism"="hotel"]
        (around:{radiusMeters},{request.Latitude},{request.Longitude});

        out tags;
        """;

        using var content = new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                ["data"] = query
            });

        HttpResponseMessage response;

        try
        {
            response = await _httpClient.PostAsync(
                "https://overpass.kumi.systems/api/interpreter",
                content
            );
        }
        catch (TaskCanceledException)
        {
            throw new HttpRequestException(
                "Hotel search timed out."
            );
        }

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();

            throw new HttpRequestException(
                $"Hotel API returned {(int)response.StatusCode}: {error}"
            );
        }

        var json = await response.Content.ReadAsStringAsync();

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

            var latitude = latElement.GetDouble();
            var longitude = lonElement.GetDouble();

            var tags = element.TryGetProperty(
                "tags",
                out var tagElement)
                ? tagElement
                : default;

            var name = GetTag(tags, "name");

            if (string.IsNullOrWhiteSpace(name))
                continue;

            var distance = CalculateDistanceKm(
                request.Latitude,
                request.Longitude,
                latitude,
                longitude
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