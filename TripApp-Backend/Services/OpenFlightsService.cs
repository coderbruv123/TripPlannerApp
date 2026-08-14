using System.Globalization;
using System.IO;
using Microsoft.Extensions.Configuration;

namespace TripApp_Backend.Services;

public class AirportInfo
{
    public string Iata { get; set; } = "";
    public string Name { get; set; } = "";
    public string City { get; set; } = "";
    public string Country { get; set; } = "";
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class FlightRouteInfo
{
    public string Airline { get; set; } = "";
    public string SourceAirport { get; set; } = "";
    public string DestinationAirport { get; set; } = "";
}

public class FlightLegResult
{
    public bool Available { get; set; }
    public AirportInfo? OriginAirport { get; set; }
    public AirportInfo? DestinationAirport { get; set; }
    public string Airline { get; set; } = "";
    public string Message { get; set; } = "";
}

public class FlightSegment
{
    public AirportInfo OriginAirport { get; set; } = new();
    public AirportInfo DestinationAirport { get; set; } = new();
    public string Airline { get; set; } = "";
}

public class FlightPathResult
{
    public bool Available { get; set; }
    public List<FlightSegment> Segments { get; set; } = new();
    public string Message { get; set; } = "";
}

public class OpenFlightsService
{
    private readonly List<AirportInfo> _airports = new();
    private readonly Dictionary<string, List<FlightRouteInfo>> _routes = new(StringComparer.OrdinalIgnoreCase);
    private readonly HashSet<string> _servicedAirports = new(StringComparer.OrdinalIgnoreCase);
    private readonly double _hubRadiusKm;

    private readonly int _maxConnections;

    private readonly Dictionary<string, AirportInfo> _airportByIata =
        new(StringComparer.OrdinalIgnoreCase);

    public OpenFlightsService(IConfiguration configuration)
    {
        var basePath = AppContext.BaseDirectory;

        var airportsPath = Path.Combine(basePath, "Data", "OpenFlights", "airports.dat");
        var routesPath = Path.Combine(basePath, "Data", "OpenFlights", "routes.dat");

        if (!File.Exists(airportsPath))
            airportsPath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "OpenFlights", "airports.dat");

        if (!File.Exists(routesPath))
            routesPath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "OpenFlights", "routes.dat");

        if (File.Exists(airportsPath))
            LoadAirports(airportsPath);

        if (File.Exists(routesPath))
            LoadRoutes(routesPath);

        var radius = configuration["OpenFlights:HubRadiusKm"];
        _hubRadiusKm = double.TryParse(
            radius,
            NumberStyles.Float,
            CultureInfo.InvariantCulture,
            out var parsed)
            ? parsed
            : 150;

        var connections = configuration["OpenFlights:MaxConnections"];
        _maxConnections = int.TryParse(
            connections,
            NumberStyles.Integer,
            CultureInfo.InvariantCulture,
            out var parsedConnections)
            ? Math.Max(0, parsedConnections)
            : 2;
    }

    public IReadOnlyList<AirportInfo> Airports => _airports;

    private void LoadAirports(string path)
    {
        foreach (var line in File.ReadLines(path))
        {
            if (string.IsNullOrWhiteSpace(line))
                continue;

            var fields = ParseCsvLine(line);

            if (fields.Length < 8)
                continue;

            var iata = fields[4].Trim().Trim('"').ToUpperInvariant();
            var latitudeText = fields[6].Trim();
            var longitudeText = fields[7].Trim();

            if (string.IsNullOrEmpty(iata) || iata == "\\N")
                continue;

            if (!double.TryParse(latitudeText, NumberStyles.Float, CultureInfo.InvariantCulture, out var lat))
                continue;

            if (!double.TryParse(longitudeText, NumberStyles.Float, CultureInfo.InvariantCulture, out var lng))
                continue;

            _airports.Add(new AirportInfo
            {
                Iata = iata,
                Name = fields[1].Trim().Trim('"'),
                City = fields[2].Trim().Trim('"'),
                Country = fields[3].Trim().Trim('"'),
                Latitude = lat,
                Longitude = lng
            });

            _airportByIata[iata] = _airports[_airports.Count - 1];
        }
    }

    private void LoadRoutes(string path)
    {
        foreach (var line in File.ReadLines(path))
        {
            if (string.IsNullOrWhiteSpace(line))
                continue;

            var fields = line.Split(',');

            if (fields.Length < 5)
                continue;

            var airline = fields[0].Trim().Trim('"').ToUpperInvariant();
            var src = fields[2].Trim().Trim('"').ToUpperInvariant();
            var dst = fields[4].Trim().Trim('"').ToUpperInvariant();

            if (string.IsNullOrEmpty(src) || src == "\\N" || string.IsNullOrEmpty(dst) || dst == "\\N")
                continue;

            _servicedAirports.Add(src);
            _servicedAirports.Add(dst);

            if (!_routes.TryGetValue(src, out var list))
            {
                list = new List<FlightRouteInfo>();
                _routes[src] = list;
            }

            list.Add(new FlightRouteInfo
            {
                Airline = airline,
                SourceAirport = src,
                DestinationAirport = dst
            });
        }
    }

    public FlightLegResult SearchFlightAsync(
        double originLat, double originLng,
        double destinationLat, double destinationLng)
    {
        var originCandidates = FindNearbyServicedAirports(originLat, originLng);
        var destinationCandidates = FindNearbyServicedAirports(destinationLat, destinationLng);

        if (originCandidates.Count == 0 || destinationCandidates.Count == 0)
        {
            return new FlightLegResult
            {
                Available = false,
                Message = "No airport found within the hub radius of the origin or destination."
            };
        }

        foreach (var originAirport in originCandidates)
        {
            if (!_routes.TryGetValue(originAirport.Iata, out var options))
                continue;

            foreach (var destinationAirport in destinationCandidates)
            {
                var match = options.FirstOrDefault(r =>
                    string.Equals(r.DestinationAirport, destinationAirport.Iata, StringComparison.OrdinalIgnoreCase));

                if (match != null)
                {
                    return new FlightLegResult
                    {
                        Available = true,
                        OriginAirport = originAirport,
                        DestinationAirport = destinationAirport,
                        Airline = match.Airline
                    };
                }
            }
        }

        return new FlightLegResult
        {
            Available = false,
            OriginAirport = originCandidates[0],
            DestinationAirport = destinationCandidates[0],
            Message = $"No direct flight route found from {originCandidates[0].Iata} to {destinationCandidates[0].Iata}."
        };
    }

    public FlightPathResult SearchFlightPathAsync(
        double originLat, double originLng,
        double destinationLat, double destinationLng)
    {
        var originCandidates = FindNearbyServicedAirports(originLat, originLng);
        var destinationCandidates = FindNearbyServicedAirports(destinationLat, destinationLng);

        if (originCandidates.Count == 0 || destinationCandidates.Count == 0)
        {
            return new FlightPathResult
            {
                Available = false,
                Message = "No airport found within the hub radius of the origin or destination."
            };
        }

        var destinationSet = destinationCandidates
            .Select(d => d.Iata)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var maxSegments = _maxConnections + 1;

        var queue = new Queue<(string Iata, List<FlightSegment> Segments)>();
        var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var origin in originCandidates)
        {
            if (destinationSet.Contains(origin.Iata))
                continue;

            visited.Add(origin.Iata);
            queue.Enqueue((origin.Iata, new List<FlightSegment>()));
        }

        while (queue.Count > 0)
        {
            var (iata, segments) = queue.Dequeue();

            if (destinationSet.Contains(iata) && segments.Count > 0)
            {
                return new FlightPathResult
                {
                    Available = true,
                    Segments = segments
                };
            }

            if (segments.Count >= maxSegments)
                continue;

            if (!_routes.TryGetValue(iata, out var options))
                continue;

            foreach (var route in options)
            {
                if (!_airportByIata.TryGetValue(route.DestinationAirport, out var destinationAirport))
                    continue;

                if (visited.Contains(route.DestinationAirport))
                    continue;

                var nextSegments = new List<FlightSegment>(segments)
                {
                    new FlightSegment
                    {
                        OriginAirport = _airportByIata[iata],
                        DestinationAirport = destinationAirport,
                        Airline = route.Airline
                    }
                };

                visited.Add(route.DestinationAirport);
                queue.Enqueue((route.DestinationAirport, nextSegments));
            }
        }

        var originIata = originCandidates[0].Iata;
        var destinationIata = destinationCandidates[0].Iata;

        return new FlightPathResult
        {
            Available = false,
            Message = $"No flight route found from {originIata} to {destinationIata}."
        };
    }

    public List<AirportInfo> FindNearbyServicedAirports(double lat, double lng)
    {
        const int maxCandidates = 4;

        var candidates = _airports
            .Where(a => _servicedAirports.Contains(a.Iata))
            .Select(a => new { Airport = a, Distance = HaversineKm(lat, lng, a.Latitude, a.Longitude) })
            .Where(x => x.Distance <= _hubRadiusKm)
            .OrderBy(x => x.Distance)
            .Take(maxCandidates)
            .Select(x => x.Airport)
            .ToList();

        return candidates;
    }

    private static double HaversineKm(double lat1, double lng1, double lat2, double lng2)
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

    private static string[] ParseCsvLine(string line)
    {
        var result = new List<string>();
        var current = new System.Text.StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];

            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }

        result.Add(current.ToString());

        return result.ToArray();
    }
}
