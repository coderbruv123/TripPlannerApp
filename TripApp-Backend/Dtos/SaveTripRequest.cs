using TripApp_Backend.Models;

namespace TripApp_Backend.Dtos;

public class DestinationPoint
{
    public string Name { get; set; } = "";
    public string Country { get; set; } = "";
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class OriginPoint
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class SaveTripRequest
{
    public Journey? Selected { get; set; }

    public List<Journey>? Journeys { get; set; }

    public DestinationPoint? Destination { get; set; }

    public OriginPoint? Origin { get; set; }

    public Hotel? Hotel { get; set; }
}

public class SavedTripPayload
{
    public List<Journey> Journeys { get; set; } = new();

    public DestinationPoint? Destination { get; set; }

    public OriginPoint? Origin { get; set; }

    public Hotel? Hotel { get; set; }
}
