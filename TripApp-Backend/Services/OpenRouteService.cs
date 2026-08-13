using System.Net.Http;
using System.Net.Http.Json;
using System.Collections.Concurrent;
using Microsoft.Extensions.Configuration;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class OpenRouteService
{
    private readonly HttpClient _client;
    private readonly IConfiguration _configuration;

    private readonly ConcurrentDictionary<string, (string Body, DateTime ExpiresUtc)> _cache =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly TimeSpan _cacheTtl;

    public OpenRouteService(
        HttpClient client,
        IConfiguration configuration)
    {
        _client = client;
        _configuration = configuration;

        var ttlMinutes = configuration["OpenRouteService:CacheTtlMinutes"]?.Trim();
        _cacheTtl = int.TryParse(ttlMinutes, out var minutes) && minutes > 0
            ? TimeSpan.FromMinutes(minutes)
            : TimeSpan.FromMinutes(60);
    }

    public async Task<string> GetRouteAsync(
        TripRequest request,
        string profile)
    {
        var apiKey = _configuration["OpenRouteService:ApiKey"]?.Trim();

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new Exception("OpenRouteService API Key is missing.");
        }

        var cacheKey = $"{profile}|{request.OriginLat}|{request.OriginLng}|{request.DestinationLat}|{request.DestinationLng}";

        if (_cache.TryGetValue(cacheKey, out var cached))
        {
            if (cached.ExpiresUtc > DateTime.UtcNow)
                return cached.Body;

            _cache.TryRemove(cacheKey, out _);
        }

        var body = new
        {
            coordinates = new[]
            {
                new[]
                {
                    request.OriginLng,
                    request.OriginLat
                },
                new[]
                {
                    request.DestinationLng,
                    request.DestinationLat
                }
            }
        };

        var httpRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"https://api.openrouteservice.org/v2/directions/{profile}/geojson");

        httpRequest.Headers.TryAddWithoutValidation(
            "Authorization",
            apiKey);

        httpRequest.Content = JsonContent.Create(body);

        var response = await _client.SendAsync(httpRequest);

        var responseBody =
            await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"OpenRouteService returned {(int)response.StatusCode} " +
                $"({response.StatusCode}): {responseBody}");
        }

        _cache[cacheKey] = (responseBody, DateTime.UtcNow.Add(_cacheTtl));

        return responseBody;
    }
}