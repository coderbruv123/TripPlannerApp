namespace TripApp_Backend.Models;

public class Airport
{
    public string Name { get; set; } = "";

    public string? Iata { get; set; }

    public string? Icao { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    /// <summary>Distance from the queried point, in km (0 when not applicable).</summary>
    public double DistanceKm { get; set; }

    /// <summary>City/locality from the airport dataset, when available.</summary>
    public string? City { get; set; }

    /// <summary>Country (or country code) from the airport dataset, when available.</summary>
    public string? Country { get; set; }
}
