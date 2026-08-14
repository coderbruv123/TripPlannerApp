using System.Text.Json;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class TripPlannerService : ITripPlannerService
{
    private readonly OpenRouteService _routeService;
    private readonly OpenFlightsService _flightService;
    private readonly double _fuelPricePerKm;

    public TripPlannerService(
        OpenRouteService routeService,
        OpenFlightsService flightService,
        IConfiguration configuration)
    {
        _routeService = routeService;
        _flightService = flightService;

        _fuelPricePerKm = double.TryParse(
            configuration["Pricing:FuelPricePerKm"],
            System.Globalization.NumberStyles.Float,
            System.Globalization.CultureInfo.InvariantCulture,
            out var price)
            ? price
            : 0.08;
    }

    public async Task<List<Journey>> SearchAsync(TripRequest request)
    {
        var journeys = new List<Journey>();

        var driving = await TryGetRouteLegAsync(request, "Drive", "driving-car");
        if (driving != null)
            journeys.Add(SingleModeJourney(driving, "drive"));

        var bus = await TryGetBusAsync(request);
        if (bus != null)
            journeys.Add(bus);

        var walking = await TryGetRouteLegAsync(request, "Walking", "foot-walking");
        if (walking != null)
            journeys.Add(SingleModeJourney(walking, "walk"));

        var cycling = await TryGetRouteLegAsync(request, "Cycling", "cycling-regular");
        if (cycling != null)
            journeys.Add(SingleModeJourney(cycling, "cycle"));

        // Combined Drive → Fly → Drive
        var combined = await TryGetCombinedJourneyAsync(request);
        if (combined != null)
            journeys.Add(combined);

        // Train is not available (no free feed).
        journeys.Add(new Journey
        {
            Mode = "train",
            Available = false,
            Message = "Train routing is not available yet."
        });

        return journeys
            .OrderBy(j => j.Available ? j.TotalDurationMinutes : double.MaxValue)
            .ThenBy(j => j.EstimatedPrice)
            .ToList();
    }

    private Journey SingleModeJourney(JourneyLeg leg, string mode)
    {
        return new Journey
        {
            Mode = mode,
            Legs = new List<JourneyLeg> { leg },
            TotalDistanceKm = leg.DistanceKm,
            TotalDurationMinutes = leg.DurationMinutes,
            EstimatedPrice = leg.EstimatedPrice
        };
    }

    private async Task<Journey?> TryGetCombinedJourneyAsync(TripRequest request)
    {
        try
        {
            var path = _flightService.SearchFlightPathAsync(
                request.OriginLat, request.OriginLng,
                request.DestinationLat, request.DestinationLng);

            if (!path.Available ||
                path.Segments.Count == 0)
                return null;

            var firstAirport = path.Segments[0].OriginAirport;
            var lastAirport = path.Segments[path.Segments.Count - 1].DestinationAirport;

            var leg1 = await TryGetRouteLegAsync(
                request.OriginLat, request.OriginLng,
                firstAirport.Latitude, firstAirport.Longitude,
                "Drive",
                "driving-car");

            var flightLegs = new List<JourneyLeg>();

            for (var i = 0; i < path.Segments.Count; i++)
            {
                var segment = path.Segments[i];

                flightLegs.Add(new JourneyLeg
                {
                    Mode = "flight",
                    Name = "Flight",
                    Origin = new JourneyPoint
                    {
                        Name = $"{segment.OriginAirport.Name} ({segment.OriginAirport.Iata})",
                        Latitude = segment.OriginAirport.Latitude,
                        Longitude = segment.OriginAirport.Longitude
                    },
                    Destination = new JourneyPoint
                    {
                        Name = $"{segment.DestinationAirport.Name} ({segment.DestinationAirport.Iata})",
                        Latitude = segment.DestinationAirport.Latitude,
                        Longitude = segment.DestinationAirport.Longitude
                    },
                    Carrier = segment.Airline,
                    EstimatedPrice = null,
                    DistanceKm = Math.Round(HaversineKm(
                        segment.OriginAirport.Latitude, segment.OriginAirport.Longitude,
                        segment.DestinationAirport.Latitude, segment.DestinationAirport.Longitude), 2),
                    DurationMinutes = Math.Round(
                        HaversineKm(
                            segment.OriginAirport.Latitude, segment.OriginAirport.Longitude,
                            segment.DestinationAirport.Latitude, segment.DestinationAirport.Longitude) / 800.0 * 60.0,
                        1),
                    Geometry = BuildFlightLineString(
                        segment.OriginAirport.Longitude, segment.OriginAirport.Latitude,
                        segment.DestinationAirport.Longitude, segment.DestinationAirport.Latitude)
                });

                if (i < path.Segments.Count - 1)
                {
                    flightLegs.Add(new JourneyLeg
                    {
                        Mode = "layover",
                        Name = "Layover",
                        Origin = new JourneyPoint
                        {
                            Name = $"{segment.DestinationAirport.City} ({segment.DestinationAirport.Iata})",
                            Latitude = segment.DestinationAirport.Latitude,
                            Longitude = segment.DestinationAirport.Longitude
                        },
                        Destination = new JourneyPoint
                        {
                            Name = $"{segment.DestinationAirport.City} ({segment.DestinationAirport.Iata})",
                            Latitude = segment.DestinationAirport.Latitude,
                            Longitude = segment.DestinationAirport.Longitude
                        },
                        DurationMinutes = 90,
                        DistanceKm = 0
                    });
                }
            }

            var leg3 = await TryGetRouteLegAsync(
                lastAirport.Latitude, lastAirport.Longitude,
                request.DestinationLat, request.DestinationLng,
                "Drive",
                "driving-car");

            var legs = new List<JourneyLeg>();

            if (leg1 != null) legs.Add(leg1);
            legs.AddRange(flightLegs);
            if (leg3 != null) legs.Add(leg3);

            var totalDistance = legs.Sum(l => l.DistanceKm);
            var totalDuration = legs.Sum(l => l.DurationMinutes);

            return new Journey
            {
                Mode = "flight",
                Legs = legs,
                TotalDistanceKm = totalDistance,
                TotalDurationMinutes = totalDuration,
                EstimatedPrice = null
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Combined journey failed: {ex.Message}");
            return null;
        }
    }

    private async Task<JourneyLeg?> TryGetRouteLegAsync(
        TripRequest request,
        string name,
        string profile)
    {
        return await TryGetRouteLegAsync(
            request.OriginLat, request.OriginLng,
            request.DestinationLat, request.DestinationLng,
            name,
            profile);
    }

    private static string BuildFlightLineString(
        double fromLng, double fromLat,
        double toLng, double toLat)
    {
        return System.Text.Json.JsonSerializer.Serialize(new
        {
            type = "LineString",
            coordinates = new double[][]
            {
                new[] { fromLng, fromLat },
                new[] { toLng, toLat }
            }
        });
    }

    private static double HaversineKm(
        double lat1, double lng1,
        double lat2, double lng2)
    {
        const double earthRadiusKm = 6371;

        var dLat = ToRadians(lat2 - lat1);
        var dLng = ToRadians(lng2 - lng1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return earthRadiusKm * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;

    private async Task<JourneyLeg?> TryGetRouteLegAsync(
        double originLat, double originLng,
        double destinationLat, double destinationLng,
        string name,
        string profile)
    {
        try
        {
            var routeRequest = new TripRequest
            {
                OriginLat = originLat,
                OriginLng = originLng,
                DestinationLat = destinationLat,
                DestinationLng = destinationLng
            };

            var json = await _routeService.GetRouteAsync(routeRequest, profile);

            using var doc = JsonDocument.Parse(json);

            var features = doc.RootElement.GetProperty("features");

            if (features.GetArrayLength() == 0)
                return null;

            var feature = features[0];

            var summary = feature
                .GetProperty("properties")
                .GetProperty("summary");

            var distanceKm = summary.GetProperty("distance").GetDouble() / 1000;
            var durationMinutes = summary.GetProperty("duration").GetDouble() / 60;

            var isDriving = profile == "driving-car";

            return new JourneyLeg
            {
                Mode = isDriving ? "drive" : name.ToLower(),
                Name = name,
                Origin = new JourneyPoint
                {
                    Name = "Origin",
                    Latitude = originLat,
                    Longitude = originLng
                },
                Destination = new JourneyPoint
                {
                    Name = "Destination",
                    Latitude = destinationLat,
                    Longitude = destinationLng
                },
                DistanceKm = distanceKm,
                DurationMinutes = durationMinutes,
                EstimatedPrice = isDriving
                    ? (decimal?)(distanceKm * _fuelPricePerKm)
                    : null,
                Geometry = feature.GetProperty("geometry").GetRawText()
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"{name} route failed: {ex.Message}");
            return null;
        }
    }

    private async Task<Journey?> TryGetBusAsync(TripRequest request)
    {
        try
        {
            var driving = await TryGetRouteLegAsync(request, "Bus", "driving-car");

            if (driving == null)
                return null;

            var busMinutes = driving.DurationMinutes * 1.8;

            var busLeg = new JourneyLeg
            {
                Mode = "bus",
                Name = "Bus",
                Origin = driving.Origin,
                Destination = driving.Destination,
                DistanceKm = driving.DistanceKm,
                DurationMinutes = busMinutes,
                EstimatedPrice = null,
                Geometry = driving.Geometry
            };

            return new Journey
            {
                Mode = "bus",
                Legs = new List<JourneyLeg> { busLeg },
                TotalDistanceKm = busLeg.DistanceKm,
                TotalDurationMinutes = busLeg.DurationMinutes,
                EstimatedPrice = null,
                Message = "Bus route and duration are estimated. Fare and provider information are not currently available."
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Bus route failed: {ex.Message}");
            return null;
        }
    }
}
