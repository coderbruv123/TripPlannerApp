namespace TripApp_Backend.Models;

public class TravelOption
{
    public string Type { get; set; } = "";

    public string Name { get; set; } = "";

    public bool Available { get; set; }

    public double? DistanceKm { get; set; }

    public double? DurationMinutes { get; set; }

    public decimal? EstimatedPrice { get; set; }

    public string? Provider { get; set; }

    public string? Geometry { get; set; }

    public string? Message { get; set; }

    public List<TravelSegment> Segments { get; set; } = new();
}