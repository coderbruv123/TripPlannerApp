using System.Text.Json;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class TripPlannerService : ITripPlannerService
{
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

            // Temporary estimated fare.
            // This will eventually come from a real bus API/provider.
            decimal? estimatedPrice = null;

            if (distanceKm <= 50)
                estimatedPrice = 300;
            else if (distanceKm <= 150)
                estimatedPrice = 700;
            else if (distanceKm <= 250)
                estimatedPrice = 1200;
            else
                estimatedPrice = 1500;

            return new TravelOption
            {
                Type = "Bus",
                Name = "Bus",
                Available = true,

                DistanceKm = distanceKm,

                EstimatedPrice = null,

                Provider = null,


                Geometry =
                    feature
                        .GetProperty("geometry")
                        .GetRawText(),
Message =
    "Bus route and duration are estimated. Fare and provider information are not currently available."
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

            return new TravelOption
            {
                Type = type,
                Name = type,
                Available = true,

                DistanceKm =
                    summary
                        .GetProperty("distance")
                        .GetDouble() / 1000,

                DurationMinutes =
                    summary
                        .GetProperty("duration")
                        .GetDouble() / 60,

                Geometry =
                    feature
                        .GetProperty("geometry")
                        .GetRawText()
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
}

