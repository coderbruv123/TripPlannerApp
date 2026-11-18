namespace TripApp_Backend.Models;

public class Airport
{
    public string Name { get; set; } = "";

    public string? Iata { get; set; }

    public string? Icao { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    /// <summary>Distance from the queried point, in km.</summary>
    public double DistanceKm { get; set; }
}
