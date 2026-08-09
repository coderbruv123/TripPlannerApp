namespace TripApp_Backend.Models;

public class FlightSearchRequest
{
    public double OriginLat { get; set; }

    public double OriginLng { get; set; }

    public double DestinationLat { get; set; }

    public double DestinationLng { get; set; }
}