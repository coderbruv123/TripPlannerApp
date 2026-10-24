using System.Collections.Concurrent;
using System.Text.Json;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

/// <summary>
/// City lookup backed by the free geodb endpoint. Two things matter for the
/// UI: answers arrive fast, and a slow upstream never leaves the city picker
/// spinning forever.
/// </summary>
public class DestinationService : IDestinationService
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan UpstreamTimeout = TimeSpan.FromSeconds(8);

    private const int CacheLimit = 300;

    private static readonly ConcurrentDictionary<string, CachedResult> Cache =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly HttpClient _httpClient;

    public DestinationService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<Destination>> SearchDestinationsAsync(string search)
    {
        var key = search.Trim().ToLowerInvariant();

        if (Cache.TryGetValue(key, out var cached) &&
            DateTime.UtcNow - cached.At < CacheTtl &&
            cached.Items.Count > 0)
        {
            return cached.Items;
        }

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
                    Longitude = city.GetProperty("longitude").GetDouble()
                });
            }

            Cache[key] = new CachedResult(DateTime.UtcNow, destinations);

            if (Cache.Count > CacheLimit) Prune();

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
