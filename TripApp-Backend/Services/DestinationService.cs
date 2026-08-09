using System.Text.Json;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class DestinationService : IDestinationService
{
    private readonly HttpClient _httpClient;

    public DestinationService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<Destination>> SearchDestinationsAsync(string search)
    {
        var url =
            $"https://geodb-free-service.wirefreethought.com/v1/geo/cities?namePrefix={Uri.EscapeDataString(search)}&limit=5";

        var response = await _httpClient.GetAsync(url);

        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();

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

        return destinations;
    }
}