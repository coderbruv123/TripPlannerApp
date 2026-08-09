namespace TripApp_Backend.Models;

public class TravelSegment
{
    public string Type { get; set; } = "";

    public string Name { get; set; } = "";

    public string? From { get; set; }

    public string? To { get; set; }

    public double? DistanceKm { get; set; }

    public double? DurationMinutes { get; set; }

    public string? Geometry { get; set; }
}