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

/// <summary>
/// A computed travel leg between two consecutive stops in one day. Routing
/// failures are reported on the wire (available=false + reason) so the client
/// can show a graceful fallback instead of an error page.
/// </summary>
public class ItineraryLegDto
{
    public required string FromStopId { get; set; }

    public required string ToStopId { get; set; }

    /// <summary>Routed distance, or straight-line estimate when unavailable.</summary>
    public double? DistanceKm { get; set; }

    /// <summary>Null when routing is unavailable: no fabricated travel time.</summary>
    public double? DurationMinutes { get; set; }

    public string Mode { get; set; } = "walking";

    /// <summary>True when distance is a straight-line fallback, not a route.</summary>
    public bool Estimated { get; set; }

    public bool Available { get; set; }

    public string? Reason { get; set; }
}
