namespace TripApp_Backend.Models;

public class TripRequest
{
    public double OriginLat { get; set; }
    public double OriginLng { get; set; }

    public double DestinationLat { get; set; }
    public double DestinationLng { get; set; }

    /// <summary>Optional display label for the segment start; omitted by older clients.</summary>
    public string? OriginName { get; set; }

    /// <summary>Optional display label for the segment end; omitted by older clients.</summary>
    public string? DestinationName { get; set; }
}