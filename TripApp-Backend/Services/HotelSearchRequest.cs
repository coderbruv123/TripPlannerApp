namespace TripApp_Backend.Models;

public class HotelSearchRequest
{
    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public double RadiusKm { get; set; } = 10;

    public int Limit { get; set; } = 10;
}