namespace TripApp_Backend.Models;

public class SavedJourney
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public string Mode { get; set; } = "";

    public double TotalDistanceKm { get; set; }

    public double TotalDurationMinutes { get; set; }

    public decimal? EstimatedPrice { get; set; }

    public string JourneyJson { get; set; } = "";

    public DateTime SavedAt { get; set; } = DateTime.UtcNow;
}
