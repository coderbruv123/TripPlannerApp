namespace TripApp_Backend.Models;

public class FlightOption
{
    public bool Available { get; set; }

    public string Airline { get; set; } = "";

    public TimeSpan? Duration { get; set; }

    /// <summary>Convenience for clients that expect minutes (extra, non-breaking).</summary>
    public double? DurationMinutes { get; set; }

    public decimal? EstimatedPrice { get; set; }

    public string Message { get; set; } = "";

    /// <summary>True when values are heuristic estimates, not live fares/schedules.</summary>
    public bool Estimated { get; set; }
}