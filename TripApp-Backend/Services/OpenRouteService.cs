using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class OpenRouteService
{
    private readonly HttpClient _client;
    private readonly IConfiguration _configuration;

    public OpenRouteService(
        HttpClient client,
        IConfiguration configuration)
    {
        _client = client;
        _configuration = configuration;
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

        return responseBody;
    }
}