namespace TripApp_Backend.Models;

/// <summary>
/// A trip a signed-in user chose to keep. Server-owned and user-scoped:
/// one user owns many saved trips, and a trip always belongs to one user.
/// Stored in the DB so it survives browser wipes and works across devices.
/// </summary>
public class SavedTrip
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public string Title { get; set; } = "";

    public string Country { get; set; } = "";

    public string OriginLabel { get; set; } = "";

    public string DestinationName { get; set; } = "";

    public string DestinationCountry { get; set; } = "";

    public string? From { get; set; }

    public string? To { get; set; }

    public int Travelers { get; set; }

    public string? Budget { get; set; }

    public string Url { get; set; } = string.Empty;

    public string[] Interests { get; set; } = [];

    public ICollection<ItineraryStop> ItineraryStops { get; set; } = new List<ItineraryStop>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
