using System.Text.Json;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class TripPlannerService : ITripPlannerService
{
    // A complete road route should start/end very near the requested points.
    // OSRM can return "Ok" with a path that stops at the road-network edge
    // (e.g. across a sea), so we reject routes that don't actually arrive.
    private const double RouteEndpointToleranceKm = 5.0;

    private readonly OpenRouteService _routeService;

    public TripPlannerService(OpenRouteService routeService)
    {
        _routeService = routeService;
    }

    public async Task<List<TravelOption>> SearchAsync(
        TripRequest request)
    {
        var options = new List<TravelOption>();

        // 🚗 Car
        var driving = await TryGetRouteAsync(
            request,
            "Car",
            "driving-car");

        if (driving != null)
        {
            driving.Name = "Drive";
            options.Add(driving);
        }

        // 🚌 Bus
        // For now, use the road route as the visual bus route.
        // Later this can be replaced with real bus-provider data.
        var bus = await TryGetBusAsync(request);

        if (bus != null)
            options.Add(bus);

        // 🚶 Walking
        var walking = await TryGetRouteAsync(
            request,
            "Walking",
            "foot-walking");

        if (walking != null)
            options.Add(walking);

        // 🚲 Cycling
        var cycling = await TryGetRouteAsync(
            request,
            "Cycling",
            "cycling-regular");

        if (cycling != null)
            options.Add(cycling);

        // 🚆 Train
        options.Add(new TravelOption
        {
            Type = "Train",
            Name = "Train",
            Available = false,
            Message = "Train routing is not available yet."
        });

        return options;
    }

    private async Task<TravelOption?> TryGetBusAsync(
        TripRequest request)
    {
        try
        {
            // Get the road geometry that the bus would follow.
            var json = await _routeService.GetRouteAsync(
                request,
                "driving-car");

            using var doc = JsonDocument.Parse(json);

            var features = doc.RootElement
                .GetProperty("features");

            if (features.GetArrayLength() == 0)
                return null;

            var feature = features[0];

            var summary = feature
                .GetProperty("properties")
                .GetProperty("summary");

            var distanceKm =
                summary
                    .GetProperty("distance")
                    .GetDouble() / 1000;

            var drivingMinutes =
                summary
                    .GetProperty("duration")
                    .GetDouble() / 60;

            // Temporary estimate.
            // Bus normally takes longer than a private car.
            var busMinutes = drivingMinutes * 1.8;

            var geometryElement = feature.GetProperty("geometry");
            if (!RouteReachesDestination(request, geometryElement))
            {
                return new TravelOption
                {
                    Type = "Bus",
                    Name = "Bus",
                    Available = false,
                    Message = "No bus route found to this destination. Try another mode."
                };
            }

            var geometry = geometryElement.GetRawText();

            return new TravelOption
            {
                Type = "Bus",
                Name = "Bus",
                Available = true,

                DistanceKm = distanceKm,

                DurationMinutes = busMinutes,

                EstimatedPrice = null,

                Provider = null,

                Geometry = geometry,

                Message =
                    "Bus route and duration are estimated. Fare and provider information are not currently available.",

                // Single road-following segment so the UI can render a breakdown
                // without fabricated schedule/operator data.
                Segments =
                [
                    new TravelSegment
                    {
                        Type = "Bus",
                        Name = "Bus",
                        From = SegmentEndpoint(request.OriginName, "Origin"),
                        To = SegmentEndpoint(request.DestinationName, "Destination"),
                        DistanceKm = distanceKm,
                        DurationMinutes = busMinutes,
                        Geometry = geometry
                    }
                ]
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Bus route failed: {ex.Message}");

            return new TravelOption
            {
                Type = "Bus",
                Name = "Bus",
                Available = false,
                Message = "Unable to calculate bus route."
            };
        }
    }

    private async Task<TravelOption?> TryGetRouteAsync(
        TripRequest request,
        string type,
        string profile)
    {
        try
        {
            var json = await _routeService.GetRouteAsync(
                request,
                profile);

            using var doc = JsonDocument.Parse(json);

            var features = doc.RootElement
                .GetProperty("features");

            if (features.GetArrayLength() == 0)
                return null;

            var feature = features[0];

            var summary = feature
                .GetProperty("properties")
                .GetProperty("summary");

            var distanceKm = summary
                .GetProperty("distance")
                .GetDouble() / 1000;

            var durationMinutes = summary
                .GetProperty("duration")
                .GetDouble() / 60;

            var geometryElement = feature.GetProperty("geometry");
            if (!RouteReachesDestination(request, geometryElement))
            {
                return new TravelOption
                {
                    Type = type,
                    Name = type,
                    Available = false,
                    Message =
                        $"No {type.ToLower()} route found to this destination. Try another mode."
                };
            }

            var geometry = geometryElement.GetRawText();

            return new TravelOption
            {
                Type = type,
                Name = type,
                Available = true,

                DistanceKm = distanceKm,

                DurationMinutes = durationMinutes,

                Geometry = geometry,

                Segments =
                [
                    new TravelSegment
                    {
                        Type = type,
                        Name = type,
                        From = SegmentEndpoint(request.OriginName, "Origin"),
                        To = SegmentEndpoint(request.DestinationName, "Destination"),
                        DistanceKm = distanceKm,
                        DurationMinutes = durationMinutes,
                        Geometry = geometry
                    }
                ]
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"{type} route failed: {ex.Message}");

            return new TravelOption
            {
                Type = type,
                Name = type,
                Available = false,
                Message =
                    $"Unable to calculate {type.ToLower()} route."
            };
        }
    }

    private static string SegmentEndpoint(string? provided, string fallback)
    {
        return string.IsNullOrWhiteSpace(provided) ? fallback : provided;
    }

    /// <summary>
    /// Returns false when the routed line does not actually reach the requested
    /// origin/destination (OSRM can stop at the road-network edge, e.g. across a sea).
    /// </summary>
    private static bool RouteReachesDestination(TripRequest request, JsonElement geometryElement)
    {
        if (!geometryElement.TryGetProperty("coordinates", out var coords) ||
            coords.ValueKind != JsonValueKind.Array)
        {
            return false;
        }

        var len = coords.GetArrayLength();
        if (len < 2) return false;

        var first = coords[0];
        var last = coords[len - 1];

        var startKm = HaversineKm(
            request.OriginLat, request.OriginLng,
            first.GetArrayLength() > 1 ? first[1].GetDouble() : double.NaN,
            first.GetArrayLength() > 0 ? first[0].GetDouble() : double.NaN);

        var endKm = HaversineKm(
            request.DestinationLat, request.DestinationLng,
            last.GetArrayLength() > 1 ? last[1].GetDouble() : double.NaN,
            last.GetArrayLength() > 0 ? last[0].GetDouble() : double.NaN);

        return startKm <= RouteEndpointToleranceKm && endKm <= RouteEndpointToleranceKm;
    }

    private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        if (double.IsNaN(lat1) || double.IsNaN(lon1) || double.IsNaN(lat2) || double.IsNaN(lon2))
            return double.PositiveInfinity;

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
}

