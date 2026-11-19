using System.Collections.Concurrent;
using System.Text.Json;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

/// <summary>
/// Place lookup backed by the free GeoDB endpoint (cities) augmented with
/// airport matches from the public mwgg dataset. City-service failures keep
/// their existing user-facing behavior; airport lookup failures degrade to
/// city-only results.
/// </summary>
public class DestinationService : IDestinationService
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan UpstreamTimeout = TimeSpan.FromSeconds(8);

    private const int CacheLimit = 300;
    private const int ResultLimit = 10;

    private static readonly ConcurrentDictionary<string, CachedResult> Cache =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly HttpClient _httpClient;
    private readonly IAirportLookupService _airportLookup;

    public DestinationService(HttpClient httpClient, IAirportLookupService airportLookup)
    {
        _httpClient = httpClient;
        _airportLookup = airportLookup;
    }

    public async Task<List<Destination>> SearchDestinationsAsync(string search)
    {
        var trimmed = search.Trim();
        var key = trimmed.ToLowerInvariant();

        if (Cache.TryGetValue(key, out var cached) &&
            DateTime.UtcNow - cached.At < CacheTtl &&
            cached.Items.Count > 0)
        {
            return cached.Items;
        }

        var cities = await FetchCitiesAsync(trimmed);
        var airports = await FetchAirportsAsync(trimmed);

        var merged = MergeResults(trimmed, cities, airports);

        Cache[key] = new CachedResult(DateTime.UtcNow, merged);

        if (Cache.Count > CacheLimit) Prune();

        return merged;
    }

    private async Task<List<Destination>> FetchCitiesAsync(string search)
    {
        // Sort by population so the real city outranks its districts
        // (typing "Paris" used to return arrondissements only).
        var url =
            $"https://geodb-free-service.wirefreethought.com/v1/geo/cities?namePrefix={Uri.EscapeDataString(search)}&limit=8&sort=-population";

        using var timeout = new CancellationTokenSource(UpstreamTimeout);

        try
        {
            var response = await _httpClient.GetAsync(url, timeout.Token);

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync(timeout.Token);

            using var document = JsonDocument.Parse(json);

            var destinations = new List<Destination>();

            foreach (var city in document.RootElement
                         .GetProperty("data")
                         .EnumerateArray())
            {
                destinations.Add(new Destination
                {
                    Name = city.GetProperty("city").GetString() ?? "",
                    Country = city.GetProperty("country").GetString() ?? "",
                    Latitude = city.GetProperty("latitude").GetDouble(),
                    Longitude = city.GetProperty("longitude").GetDouble(),
                    Type = "city"
                });
            }

            return destinations;
        }
        catch (OperationCanceledException)
        {
            throw new DestinationSearchException(
                "The city service is taking too long. Try a shorter search."
            );
        }
        catch (HttpRequestException)
        {
            throw new DestinationSearchException(
                "The city service is unreachable right now. Try again."
            );
        }
    }

    private async Task<List<Destination>> FetchAirportsAsync(string search)
    {
        try
        {
            var airports = await _airportLookup.SearchAsync(search, limit: 8);
            var results = new List<Destination>(airports.Count);

            foreach (var airport in airports)
            {
                var code = !string.IsNullOrWhiteSpace(airport.Iata)
                    ? airport.Iata
                    : airport.Icao;

                results.Add(new Destination
                {
                    Name = airport.Name,
                    Country = BuildAirportCountry(airport),
                    Latitude = airport.Latitude,
                    Longitude = airport.Longitude,
                    Type = "airport",
                    Code = code
                });
            }

            return results;
        }
        catch
        {
            // Airport data is best-effort: keep returning city matches.
            return new List<Destination>();
        }
    }

    private static string BuildAirportCountry(Airport airport)
    {
        var city = airport.City?.Trim();
        var country = airport.Country?.Trim();

        if (!string.IsNullOrWhiteSpace(city) && !string.IsNullOrWhiteSpace(country))
            return $"{city}, {country}";
        if (!string.IsNullOrWhiteSpace(country))
            return country!;
        if (!string.IsNullOrWhiteSpace(city))
            return city!;
        return string.Empty;
    }

    private static List<Destination> MergeResults(
        string query,
        List<Destination> cities,
        List<Destination> airports)
    {
        var q = query.Trim();
        var merged = new List<(int Score, int Order, Destination Item)>();
        var order = 0;

        foreach (var city in cities)
            merged.Add((ScorePlace(q, city), order++, city));
        foreach (var airport in airports)
            merged.Add((ScorePlace(q, airport), order++, airport));

        var deduped = new List<Destination>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var entry in merged
                     .OrderBy(x => x.Score)
                     .ThenBy(x => x.Order))
        {
            var item = entry.Item;
            var dedupeKey =
                $"{item.Type}|{Normalize(item.Name)}|{Math.Round(item.Latitude, 2)}|{Math.Round(item.Longitude, 2)}";

            if (!seen.Add(dedupeKey))
                continue;

            deduped.Add(item);
            if (deduped.Count >= ResultLimit)
                break;
        }

        return deduped;
    }

    private static int ScorePlace(string query, Destination place)
    {
        var q = query.ToUpperInvariant();
        var name = place.Name ?? string.Empty;
        var code = place.Code ?? string.Empty;
        var isAirport = string.Equals(place.Type, "airport", StringComparison.OrdinalIgnoreCase);

        // Strongest: exact airport/code match (e.g. "CDG").
        if (isAirport && string.Equals(code, q, StringComparison.Ordinal))
            return 0;
        if (isAirport && code.StartsWith(q, StringComparison.Ordinal))
            return 1;
        if (string.Equals(name, query, StringComparison.OrdinalIgnoreCase))
            return 2;
        if (name.StartsWith(query, StringComparison.OrdinalIgnoreCase))
            return 3;

        // Preserve GeoDB population ordering for cities ahead of looser airport matches.
        if (!isAirport)
            return 4;

        if (name.Contains(query, StringComparison.OrdinalIgnoreCase))
            return 5;

        return 6;
    }

    private static string Normalize(string value) =>
        new string((value ?? string.Empty)
            .Trim()
            .ToLowerInvariant()
            .Where(char.IsLetterOrDigit)
            .ToArray());

    private static void Prune()
    {
        var stale = Cache
            .OrderBy(entry => entry.Value.At)
            .Take(Cache.Count - CacheLimit)
            .Select(entry => entry.Key)
            .ToList();

        foreach (var key in stale) Cache.TryRemove(key, out _);
    }

    private sealed record CachedResult(DateTime At, List<Destination> Items);
}

public class DestinationSearchException : Exception
{
    public DestinationSearchException(string message) : base(message) { }
}
