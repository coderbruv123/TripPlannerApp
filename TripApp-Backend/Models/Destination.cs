namespace TripApp_Backend.Models;

public class Destination
{
    public string Name { get; set; } = "";

    public string Country { get; set; } = "";

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    /// <summary>
    /// Place kind for disambiguation. "city" or "airport"; null is treated as
    /// "city" by existing consumers for backward compatibility.
    /// </summary>
    public string? Type { get; set; }

    /// <summary>Airport code when Type is "airport" (IATA preferred, else ICAO).</summary>
    public string? Code { get; set; }
}