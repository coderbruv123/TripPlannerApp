namespace TripApp_Backend.Models;

public class Journey
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string Mode { get; set; } = "";

    public List<JourneyLeg> Legs { get; set; } = new();

    public double TotalDistanceKm { get; set; }

    public double TotalDurationMinutes { get; set; }

    public decimal? EstimatedPrice { get; set; }

    public bool Available { get; set; } = true;

    public string? Message { get; set; }
}
