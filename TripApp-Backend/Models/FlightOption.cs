namespace TripApp_Backend.Models;

public class FlightOption
{
    public bool Available { get; set; }

    public string Airline { get; set; } = "";

    public TimeSpan? Duration { get; set; }

    public decimal? EstimatedPrice { get; set; }

    public string Message { get; set; } = "";
}