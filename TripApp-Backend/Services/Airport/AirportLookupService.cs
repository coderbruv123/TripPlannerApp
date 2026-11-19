using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Text.Json;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

/// <summary>
/// Free airport lookup using the open mwgg/Airports dataset (public JSON, no API key).
/// Loaded lazily and cached in memory for nearest-airport searches.
/// </summary>
public class AirportLookupService : IAirportLookupService
{
    private static readonly string[] DatasetUrls =
    [
        "https://cdn.jsdelivr.net/gh/mwgg/Airports@master/airports.json",
        "https://raw.githubusercontent.com/mwgg/Airports/master/airports.json"
    ];

    private static readonly ConcurrentDictionary<string, (DateTime At, Airport? Value)> Cache = new();
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(30);

    private static readonly SemaphoreSlim LoadLock = new(1, 1);
    private static IReadOnlyList<AirportRecord>? _dataset;

    private readonly HttpClient _httpClient;

    public AirportLookupService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
        _httpClient.DefaultRequestHeaders.UserAgent.Clear();
        _httpClient.DefaultRequestHeaders.UserAgent.Add(
            new ProductInfoHeaderValue("TripPlanner", "1.0"));
    }

    public async Task<Airport?> FindNearestAsync(double latitude, double longitude, int radiusKm = 120, CancellationToken cancellationToken = default)
    {
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
            return null;

        var key = $"{Math.Round(latitude, 2)}:{Math.Round(longitude, 2)}:{radiusKm}";
        if (Cache.TryGetValue(key, out var cached) && DateTime.UtcNow - cached.At < CacheTtl)
            return cached.Value;

        var dataset = await EnsureDatasetAsync(cancellationToken);
        if (dataset == null || dataset.Count == 0)
        {
            Cache[key] = (DateTime.UtcNow, null);
            return null;
        }

        Airport? best = null;
        var bestScore = double.MaxValue;
        var maxKm = Math.Clamp(radiusKm, 10, 300);

        foreach (var a in dataset)
        {
            var dist = HaversineKm(latitude, longitude, a.Latitude, a.Longitude);
            if (dist > maxKm) continue;

            // Prefer airports with IATA codes, then closer ones.
            var score = dist - (a.HasIata ? 15.0 : 0.0);
            if (score < bestScore)
            {
                bestScore = score;
                best = ToAirport(a, dist);
            }
        }

        Cache[key] = (DateTime.UtcNow, best);
        return best;
    }

    public async Task<IReadOnlyList<Airport>> SearchAsync(string query, int limit = 8, CancellationToken cancellationToken = default)
    {
        query = (query ?? string.Empty).Trim();
        if (query.Length == 0)
            return Array.Empty<Airport>();

        var dataset = await EnsureDatasetAsync(cancellationToken);
        if (dataset == null || dataset.Count == 0)
            return Array.Empty<Airport>();

        var q = query.ToUpperInvariant();
        limit = Math.Clamp(limit, 1, 20);

        var matches = new List<(int Score, bool HasIata, AirportRecord Record)>();

        foreach (var a in dataset)
        {
            var score = MatchScore(a, query, q);
            if (score < int.MaxValue)
                matches.Add((score, a.HasIata, a));
        }

        return matches
            .OrderBy(m => m.Score)
            .ThenByDescending(m => m.HasIata)
            .ThenBy(m => m.Record.Name, StringComparer.OrdinalIgnoreCase)
            .Take(limit)
            .Select(m => ToAirport(m.Record, 0))
            .ToList();
    }

    private async Task<IReadOnlyList<AirportRecord>?> EnsureDatasetAsync(CancellationToken cancellationToken)
    {
        if (_dataset != null) return _dataset;

        await LoadLock.WaitAsync(cancellationToken);
        try
        {
            if (_dataset != null) return _dataset;

            foreach (var url in DatasetUrls)
            {
                try
                {
                    using var response = await _httpClient.GetAsync(url, cancellationToken);
                    if (!response.IsSuccessStatusCode) continue;

                    await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                    using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

                    var list = new List<AirportRecord>(4096);
                    foreach (var prop in document.RootElement.EnumerateObject())
                    {
                        var v = prop.Value;
                        if (!v.TryGetProperty("lat", out var latEl) || !v.TryGetProperty("lon", out var lonEl))
                            continue;

                        var lat = latEl.GetDouble();
                        var lon = lonEl.GetDouble();
                        var name = GetString(v, "name");
                        var iata = NormalizeCode(GetString(v, "iata"));
                        var icao = NormalizeCode(GetString(v, "icao"));
                        var city = GetString(v, "city");
                        var country = GetString(v, "country");

                        if (string.IsNullOrWhiteSpace(name) && iata == null)
                            continue;

                        list.Add(new AirportRecord(name ?? iata ?? "Airport", iata, icao, city, country, lat, lon));
                    }

                    if (list.Count > 0)
                    {
                        _dataset = list;
                        return _dataset;
                    }
                }
                catch
                {
                    // try next source
                }
            }

            _dataset = Array.Empty<AirportRecord>();
            return _dataset;
        }
        finally
        {
            LoadLock.Release();
        }
    }

    private static string? GetString(JsonElement el, string key)
    {
        if (!el.TryGetProperty(key, out var v)) return null;
        var s = v.GetString();
        return string.IsNullOrWhiteSpace(s) ? null : s.Trim();
    }

    private static string? NormalizeCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        code = code.Trim().ToUpperInvariant();
        // dataset uses empty string; ignore placeholders like "0" or "\\N"
        if (code.Length is < 3 or > 4) return null;
        if (code == "\\N" || code == "0") return null;
        return code;
    }

    private static Airport ToAirport(AirportRecord record, double distanceKm) => new()
    {
        Name = record.Name,
        Iata = record.Iata,
        Icao = record.Icao,
        Latitude = record.Latitude,
        Longitude = record.Longitude,
        DistanceKm = distanceKm,
        City = record.City,
        Country = record.Country
    };

    private static int MatchScore(AirportRecord airport, string query, string qUpper)
    {
        var iata = airport.Iata;
        var icao = airport.Icao;
        var name = airport.Name ?? string.Empty;
        var city = airport.City ?? string.Empty;

        if (!string.IsNullOrEmpty(iata))
        {
            if (string.Equals(iata, qUpper, StringComparison.Ordinal)) return 0; // exact IATA
            if (iata.StartsWith(qUpper, StringComparison.Ordinal)) return 1;    // IATA prefix
        }

        if (!string.IsNullOrEmpty(icao))
        {
            if (string.Equals(icao, qUpper, StringComparison.Ordinal)) return 2; // exact ICAO
            if (icao.StartsWith(qUpper, StringComparison.Ordinal)) return 3;    // ICAO prefix
        }

        if (name.StartsWith(query, StringComparison.OrdinalIgnoreCase)) return 4;
        if (city.StartsWith(query, StringComparison.OrdinalIgnoreCase)) return 5;
        if (name.Contains(query, StringComparison.OrdinalIgnoreCase)) return 6;
        if (city.Contains(query, StringComparison.OrdinalIgnoreCase)) return 7;

        return int.MaxValue;
    }

    private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371.0;
        static double ToRad(double d) => d * Math.PI / 180.0;
        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private sealed record AirportRecord(string Name, string? Iata, string? Icao, string? City, string? Country, double Latitude, double Longitude)
    {
        public bool HasIata => !string.IsNullOrWhiteSpace(Iata);
    }
}
