using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public interface IFlightService
{
    Task<FlightOption> SearchFlightAsync(
        FlightSearchRequest request);
}