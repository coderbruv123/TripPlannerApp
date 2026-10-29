namespace TripApp_Backend.Dtos;

/// <summary>
/// Inbound shape for upserting / adding a single itinerary stop.
/// </summary>
public class ItineraryStopUpsertDto
{
    public string Id { get; set; } = string.Empty;

    public int DayIndex { get; set; }
    public int Order { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    public string Kind { get; set; } = "place";

    public string? PlannedStart { get; set; }
    public string? PlannedEnd { get; set; }
    public string? OpeningHours { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Outbound shape used by the controller GET endpoints (trimmed to the
/// frontend's needs). <see cref="ItineraryStop"/> itself is returned for the
/// upsert paths so the controller can map cleanly.
/// </summary>
public class ItineraryStopListDto
{
    public required string Id { get; set; }
    public int DayIndex { get; set; }
    public int Order { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Kind { get; set; } = "place";
    public string? PlannedStart { get; set; }
    public string? PlannedEnd { get; set; }
    public string? OpeningHours { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Request body for reordering stops within a day.
/// </summary>
public class ItineraryReorderDto
{
    public required string[] OrderedIds { get; set; } = [];
}
