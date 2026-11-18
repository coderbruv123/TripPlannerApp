namespace TripApp_Backend.Models;

public class FlightSearchRequest
{
    public double OriginLat { get; set; }

    public double OriginLng { get; set; }

    public double DestinationLat { get; set; }

    public double DestinationLng { get; set; }

    /// <summary>Optional labels for user-facing messages.</summary>
    public string? OriginName { get; set; }

    public string? DestinationName { get; set; }
}