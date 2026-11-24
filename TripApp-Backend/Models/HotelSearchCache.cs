namespace TripApp_Backend.Models;

public class HotelSearchCache
{
    public string CacheKey { get; set; } = string.Empty;

    public string PayloadJson { get; set; } = string.Empty;

    public DateTime FetchedAtUtc { get; set; }

    public string? Source { get; set; }
}
