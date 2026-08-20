namespace TripApp_Backend.Models;

public class JourneyLeg
{
    public string Mode { get; set; } = "";

    public string Name { get; set; } = "";

    public JourneyPoint Origin { get; set; } = new();

    public JourneyPoint Destination { get; set; } = new();

    public double DistanceKm { get; set; }

    public double DurationMinutes { get; set; }

    public string? Geometry { get; set; }

    public string? Carrier { get; set; }

    public decimal? EstimatedPrice { get; set; }
}

public class JourneyPoint
{
    public string Name { get; set; } = "";

    public double Latitude { get; set; }

    public double Longitude { get; set; }
}
