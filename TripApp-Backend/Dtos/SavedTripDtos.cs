using TripApp_Backend.Models;

namespace TripApp_Backend.Dtos;

/// <summary>
/// Payload for saving or updating a saved trip. Mirrors the fields the
/// frontend <c>SavedTrip</c> carries, with <c>UserId</c> supplied by the
/// server for scoping.
/// </summary>
public class SavedTripUpsertDto
{
    public string Title { get; set; } = "";

    public string Country { get; set; } = "";

    public string OriginLabel { get; set; } = "";

    public string DestinationName { get; set; } = "";

    public string DestinationCountry { get; set; } = "";

    public string? From { get; set; }

    public string? To { get; set; }

    public int Travelers { get; set; }

    public string? Budget { get; set; }

    public string Url { get; set; } = "";

    public string[] Interests { get; set; } = [];
}

/// <summary>
/// Payload for duplicating a saved trip. Only the fields the caller wants to
/// carry over are sent; the server keeps the identity (id/url/savedAt) of the
/// new row.
/// </summary>
public class SavedTripCopyDto
{
    public string? From { get; set; }

    public string? To { get; set; }

    public int Travelers { get; set; }

    public string? Budget { get; set; }
}
