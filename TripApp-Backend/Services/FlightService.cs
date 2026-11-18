using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class FlightService : IFlightService
{
    private readonly IAirportLookupService _airportLookup;

    public FlightService(IAirportLookupService airportLookup)
    {
        _airportLookup = airportLookup;
    }

    public async Task<FlightOption> SearchFlightAsync(FlightSearchRequest request)
    {
        // Resolve nearest airports (free Overpass/OSM lookup). Enables short-distance
        // flight options when distinct airports exist and provides real airport labels.
        var originAirport = await _airportLookup.FindNearestAsync(request.OriginLat, request.OriginLng);
        var destAirport = await _airportLookup.FindNearestAsync(request.DestinationLat, request.DestinationLng);

        var pointDistanceKm = HaversineKm(
            request.OriginLat, request.OriginLng,
            request.DestinationLat, request.DestinationLng);

        var airports = ResolveAirportPair(originAirport, destAirport, pointDistanceKm);

        double flightDistanceKm;
        if (airports.usable)
        {
            flightDistanceKm = HaversineKm(
                airports.origin!.Latitude, airports.origin.Longitude,
                airports.dest!.Latitude, airports.dest.Longitude);
        }
        else
        {
            // No usable airport pair: only offer an indicative flight for longer hops.
            if (pointDistanceKm < 150)
            {
                return new FlightOption
                {
                    Available = false,
                    Airline = "",
                    Duration = null,
                    DurationMinutes = null,
                    EstimatedPrice = null,
                    Estimated = false,
                    Message = "No suitable airports found for a short-distance flight."
                };
            }
            flightDistanceKm = pointDistanceKm;
        }

        // Heuristic: ~850 km/h cruise + 45m taxi/takeoff/landing/boarding buffer.
        var durationMinutes = Math.Round(flightDistanceKm / 850.0 * 60.0 + 45.0, 0);
        var estimatedPrice = EstimatePrice(flightDistanceKm);

        var from = string.IsNullOrWhiteSpace(request.OriginName) ? "origin" : request.OriginName;
        var to = string.IsNullOrWhiteSpace(request.DestinationName) ? "destination" : request.DestinationName;

        return new FlightOption
        {
            Available = true,
            Airline = "Estimated",
            Duration = null,
            DurationMinutes = durationMinutes,
            EstimatedPrice = estimatedPrice,
            Estimated = true,
            Message = airports.usable
                ? $"Indicative estimate {from} → {to} via {AirportLabel(airports.origin!)}–{AirportLabel(airports.dest!)} (no live schedules or fares)."
                : $"Indicative estimate for {from} → {to} (no live schedules or fares)."
        };
    }

    // Cache resolved airports for the current request scope via BuildRouteOptions args path:
    // controller passes request/flight; we resolve again (cached by lookup service) — cheap and simple.

    private static (bool usable, Airport? origin, Airport? dest) ResolveAirportPair(
        Airport? origin, Airport? dest, double pointDistanceKm)
    {
        if (origin == null || dest == null) return (false, origin, dest);

        // Same airport (or effectively same) — not a meaningful flight.
        var sameCode = !string.IsNullOrWhiteSpace(origin.Iata) &&
                       string.Equals(origin.Iata, dest.Iata, StringComparison.OrdinalIgnoreCase);
        var airportSeparationKm = HaversineKm(origin.Latitude, origin.Longitude, dest.Latitude, dest.Longitude);
        if (sameCode || airportSeparationKm < 30)
            return (false, origin, dest);

        // For very short point-to-point trips, require reasonably close airports.
        if (pointDistanceKm < 150 && (origin.DistanceKm > 80 || dest.DistanceKm > 80))
            return (false, origin, dest);

        return (true, origin, dest);
    }

    /// <summary>
    /// Build Rome2Rio-like route options for flights with location->airport->airport->location
    /// segments. Uses nearest airports from a free public API (Overpass/OSM) when available.
    /// </summary>
    public IReadOnlyList<TravelOption> BuildRouteOptions(FlightSearchRequest request, FlightOption flight)
    {
        if (!flight.Available) return Array.Empty<TravelOption>();

        // Best-effort resolve (cached in lookup service). Done synchronously via GetAwaiter
        // to keep interface stable; lookup is cached after SearchFlightAsync in same request.
        var originFound = _airportLookup.FindNearestAsync(request.OriginLat, request.OriginLng).GetAwaiter().GetResult();
        var destFound = _airportLookup.FindNearestAsync(request.DestinationLat, request.DestinationLng).GetAwaiter().GetResult();

        var pointDistanceKm = HaversineKm(
            request.OriginLat, request.OriginLng,
            request.DestinationLat, request.DestinationLng);

        var airports = ResolveAirportPair(originFound, destFound, pointDistanceKm);

        var fromCity = string.IsNullOrWhiteSpace(request.OriginName) ? "Origin" : request.OriginName!;
        var toCity = string.IsNullOrWhiteSpace(request.DestinationName) ? "Destination" : request.DestinationName!;

        string originAirportLabel, destAirportLabel;
        double flightDistanceKm;
        double originTransferKm, destTransferKm;

        if (airports.usable)
        {
            originAirportLabel = AirportLabel(airports.origin!);
            destAirportLabel = AirportLabel(airports.dest!);
            flightDistanceKm = HaversineKm(
                airports.origin!.Latitude, airports.origin.Longitude,
                airports.dest!.Latitude, airports.dest.Longitude);
            originTransferKm = Math.Round(airports.origin!.DistanceKm, 1);
            destTransferKm = Math.Round(airports.dest!.DistanceKm, 1);
        }
        else
        {
            originAirportLabel = $"{fromCity} (area airport)";
            destAirportLabel = $"{toCity} (area airport)";
            flightDistanceKm = pointDistanceKm;
            originTransferKm = 20;
            destTransferKm = 20;
        }

        var geometry = airports.usable
            ? BuildGreatCircleGeometry(airports.origin!.Latitude, airports.origin.Longitude,
                                       airports.dest!.Latitude, airports.dest.Longitude)
            : BuildGreatCircleGeometry(request.OriginLat, request.OriginLng,
                                       request.DestinationLat, request.DestinationLng);

        var baseFlightDuration = flight.DurationMinutes ?? Math.Round(flightDistanceKm / 850.0 * 60.0 + 45.0, 0);
        var basePrice = flight.EstimatedPrice ?? EstimatePrice(flightDistanceKm);

        // Transfer time heuristic: ~2 min/km with a minimum buffer.
        static double TransferMinutes(double km) => Math.Max(20, Math.Round(km / 0.5 + 10, 0));
        var originTransferMin = TransferMinutes(originTransferKm);
        var destTransferMin = TransferMinutes(destTransferKm);

        var viaText = airports.usable
            ? $" via {originAirportLabel}–{destAirportLabel}"
            : "";

        var options = new List<TravelOption>
        {
            BuildFlightOption(
                name: "Fly (best estimate)",
                fromCity: fromCity,
                toCity: toCity,
                originAirport: originAirportLabel,
                destAirport: destAirportLabel,
                flightDistanceKm: flightDistanceKm,
                flightDurationMinutes: baseFlightDuration,
                price: basePrice,
                geometry: geometry,
                originTransferMinutes: originTransferMin,
                destTransferMinutes: destTransferMin,
                originTransferKm: originTransferKm,
                destTransferKm: destTransferKm,
                flightNote: "Direct flight estimate",
                message: $"Door-to-door estimate · {fromCity} → {toCity}{viaText}. Indicative, no live schedules or fares."),
        };

        if (flightDistanceKm >= 400)
        {
            var cheaperPrice = Math.Max(40m, Math.Round(basePrice * 0.82m, 0));
            var slowerFlightDuration = Math.Round(baseFlightDuration * 1.28 + 30, 0);
            options.Add(BuildFlightOption(
                name: "Fly (cheaper estimate)",
                fromCity: fromCity,
                toCity: toCity,
                originAirport: originAirportLabel,
                destAirport: destAirportLabel,
                flightDistanceKm: flightDistanceKm,
                flightDurationMinutes: slowerFlightDuration,
                price: cheaperPrice,
                geometry: geometry,
                originTransferMinutes: originTransferMin,
                destTransferMinutes: destTransferMin,
                originTransferKm: originTransferKm,
                destTransferKm: destTransferKm,
                flightNote: "May involve a stop/longer routing",
                message: $"Door-to-door estimate · {fromCity} → {toCity}{viaText}. Indicative, no live schedules or fares."));
        }

        return options;
    }

    private static string AirportLabel(Airport a)
    {
        // Prefer "Name (IATA)" when available.
        if (!string.IsNullOrWhiteSpace(a.Iata))
            return $"{a.Name} ({a.Iata})";
        if (!string.IsNullOrWhiteSpace(a.Icao))
            return $"{a.Name} ({a.Icao})";
        return a.Name;
    }

    private static TravelOption BuildFlightOption(
        string name,
        string fromCity,
        string toCity,
        string originAirport,
        string destAirport,
        double flightDistanceKm,
        double flightDurationMinutes,
        decimal price,
        string geometry,
        double originTransferMinutes,
        double destTransferMinutes,
        double originTransferKm,
        double destTransferKm,
        string flightNote,
        string message)
    {
        var totalDuration = Math.Round(flightDurationMinutes + originTransferMinutes + destTransferMinutes, 0);
        var totalDistance = Math.Round(flightDistanceKm + originTransferKm + destTransferKm, 1);
        var flightDistanceRounded = Math.Round(flightDistanceKm, 1);

        return new TravelOption
        {
            Type = "Flight",
            Name = name,
            Available = true,
            DistanceKm = totalDistance,
            DurationMinutes = totalDuration,
            EstimatedPrice = price,
            Provider = "indicative estimate",
            Geometry = geometry,
            Message = message,
            Segments =
            [
                new TravelSegment
                {
                    Type = "Transfer",
                    Name = "Travel to airport",
                    From = fromCity,
                    To = originAirport,
                    DistanceKm = Math.Round(originTransferKm, 1),
                    DurationMinutes = originTransferMinutes,
                    Geometry = null
                },
                new TravelSegment
                {
                    Type = "Flight",
                    Name = flightNote,
                    From = originAirport,
                    To = destAirport,
                    DistanceKm = flightDistanceRounded,
                    DurationMinutes = flightDurationMinutes,
                    Geometry = geometry
                },
                new TravelSegment
                {
                    Type = "Transfer",
                    Name = "Travel from airport",
                    From = destAirport,
                    To = toCity,
                    DistanceKm = Math.Round(destTransferKm, 1),
                    DurationMinutes = destTransferMinutes,
                    Geometry = null
                }
            ]
        };
    }

    private static decimal EstimatePrice(double distanceKm)
    {
        // Simple bands to avoid absurd numbers; rough indicative USD.
        decimal price = distanceKm switch
        {
            <= 500 => 90m,
            <= 1500 => 150m,
            <= 3000 => 280m,
            <= 6000 => 550m,
            <= 10000 => 800m,
            _ => 1100m
        };
        return price;
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

    /// <summary>Approximate great-circle path as a GeoJSON LineString.</summary>
    private static string BuildGreatCircleGeometry(double lat1, double lon1, double lat2, double lon2)
    {
        // Interpolate along the great circle for a smoother arc on the map.
        const int steps = 64;
        static double ToRad(double d) => d * Math.PI / 180.0;
        static double ToDeg(double r) => r * 180.0 / Math.PI;

        var φ1 = ToRad(lat1);
        var λ1 = ToRad(lon1);
        var φ2 = ToRad(lat2);
        var λ2 = ToRad(lon2);

        var sinφ1 = Math.Sin(φ1); var cosφ1 = Math.Cos(φ1);
        var sinφ2 = Math.Sin(φ2); var cosφ2 = Math.Cos(φ2);
        var dλ = λ2 - λ1;

        var cosΔ = Math.Clamp(sinφ1 * sinφ2 + cosφ1 * cosφ2 * Math.Cos(dλ), -1.0, 1.0);
        var Δ = Math.Acos(cosΔ);

        var coords = new System.Text.StringBuilder();
        coords.Append("{\"type\":\"LineString\",\"coordinates\":[");
        for (int i = 0; i <= steps; i++)
        {
            double lat, lon;
            if (Δ < 1e-9)
            {
                lat = lat1; lon = lon1;
            }
            else
            {
                var f = (double)i / steps;
                var A = Math.Sin((1 - f) * Δ) / Math.Sin(Δ);
                var B = Math.Sin(f * Δ) / Math.Sin(Δ);
                var x = A * cosφ1 * Math.Cos(λ1) + B * cosφ2 * Math.Cos(λ2);
                var y = A * cosφ1 * Math.Sin(λ1) + B * cosφ2 * Math.Sin(λ2);
                var z = A * sinφ1 + B * sinφ2;
                lat = ToDeg(Math.Atan2(z, Math.Sqrt(x * x + y * y)));
                lon = ToDeg(Math.Atan2(y, x));
            }
            if (i > 0) coords.Append(',');
            coords.Append('[').Append(lon.ToString(System.Globalization.CultureInfo.InvariantCulture))
                  .Append(',').Append(lat.ToString(System.Globalization.CultureInfo.InvariantCulture)).Append(']');
        }
        coords.Append("]}");
        return coords.ToString();
    }
}