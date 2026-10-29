namespace TripApp_Backend.Models;

/// <summary>
/// One stop in a saved trip's day-by-day itinerary. Stored in the DB the
/// same way as <see cref="SavedTrip"/>, so an itinerary survives browser
/// wipes and works across devices. Rides the existing account-scoped
/// persistence model instead of localStorage.
/// </summary>
public class ItineraryStop
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>Owner saved trip FK (server-owned, user-scoped).</summary>
    public Guid SavedTripId { get; set; }

    public int DayIndex { get; set; }
    public int Order { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    /// <summary>One of place, restaurant, activity, transfer.</summary>
    public string Kind { get; set; } = "place";

    public string? PlannedStart { get; set; }
    public string? PlannedEnd { get; set; }

    /// <summary>Raw JSON of opening hours / hours of operation.</summary>
    public string? OpeningHours { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
