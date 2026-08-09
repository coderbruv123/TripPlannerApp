namespace TripApp_Backend.Models;
public class TripResponse
{
    public string Name { get; set; } = "";

    public double DistanceKm { get; set; }

    public double DurationMinutes { get; set; }

    public string Geometry { get; set; } = "";
}