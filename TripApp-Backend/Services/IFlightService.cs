using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public interface IFlightService
{
    Task<FlightOption> SearchFlightAsync(
        FlightSearchRequest request);

    /// <summary>Build Rome2Rio-like route-option representations of flight (with segments/geometry) for the unified results list.</summary>
    IReadOnlyList<TravelOption> BuildRouteOptions(FlightSearchRequest request, FlightOption flight);
}