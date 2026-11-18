using System.Net.Http;
using System.Text.Json;

using TripApp_Backend.Models;

/// <summary>
/// Keyless route provider. The app originally shipped with a placeholder
/// OpenRouteService API key, so every route came back "unavailable". Instead of
/// depending on a paid key this service uses OSRM's public, free demo server
/// (router.project-osrm.org) for driving / walking / cycling geometry. The
/// response is normalized back to the OpenRouteService shape so the planner
/// layer (TripPlannerService) is untouched. Bus still reuses the road route.
/// </summary>
public class OpenRouteService
{
    private readonly HttpClient _client;

    public OpenRouteService(HttpClient client)
    {
        _client = client;
    }

    public async Task<string> GetRouteAsync(TripRequest request, string profile)
    {
        var osrmProfile = MapProfile(profile);
        var coords =
            $"{request.OriginLng},{request.OriginLat};{request.DestinationLng},{request.DestinationLat}";
        var url = $"route/v1/{osrmProfile}/{coords}?overview=full&geometries=geojson";

        using var httpRequest = new HttpRequestMessage(HttpMethod.Get, url);
        var response = await _client.SendAsync(httpRequest);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"OSRM returned {(int)response.StatusCode} ({response.StatusCode})");
        }

        var json = await response.Content.ReadAsStringAsync();
        return NormalizeToOpenRouteServiceShape(json);
    }

    private static string MapProfile(string profile)
    {
        return profile.ToLowerInvariant() switch
        {
            "driving-car" or "driving" or "car" => "driving",
            "foot-walking" or "foot" or "walking" => "foot",
            "cycling-regular" or "cycling" or "bike" => "cycling",
            _ => "driving"
        };
    }

    private static string NormalizeToOpenRouteServiceShape(string osrmJson)
    {
        using var doc = JsonDocument.Parse(osrmJson);

        if (!doc.RootElement.TryGetProperty("code", out var code) ||
            code.GetString() != "Ok" ||
            !doc.RootElement.TryGetProperty("routes", out var routes) ||
            routes.GetArrayLength() == 0)
        {
            return "{}";
        }

        var route = routes[0];
        var distance = route.GetProperty("distance").GetDouble();
        var duration = route.GetProperty("duration").GetDouble();
        var geometryElement = route.GetProperty("geometry");

        // The frontend feeds this straight to MapLibre, so it must stay a GeoJSON
        // object ([lng, lat] coordinate pairs) rather than an encoded polyline string.
        if (geometryElement.ValueKind != JsonValueKind.Object ||
            !geometryElement.TryGetProperty("coordinates", out _))
        {
            return "{}";
        }

        var geometry = geometryElement.Clone();

        var feature = new
        {
            type = "Feature",
            properties = new
            {
                summary = new
                {
                    distance,
                    duration
                }
            },
            geometry = geometry
        };

        var result = new
        {
            type = "FeatureCollection",
            features = new[] { feature }
        };

        return JsonSerializer.Serialize(result);
    }
}
