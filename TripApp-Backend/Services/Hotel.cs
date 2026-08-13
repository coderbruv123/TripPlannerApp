namespace TripApp_Backend.Models;

public class Hotel
{
    public long Id { get; set; }

    public string Name { get; set; } = "";

    public string? Address { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public double DistanceKm { get; set; }

    public int? Stars { get; set; }

    public string? Website { get; set; }

    public string? Phone { get; set; }

    public string? Type { get; set; }

    public string? ImageUrl { get; set; }

    public decimal? EstimatedPricePerNight { get; set; }
}