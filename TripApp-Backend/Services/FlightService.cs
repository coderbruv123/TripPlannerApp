using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class FlightService : IFlightService
{
    public async Task<FlightOption> SearchFlightAsync(
        FlightSearchRequest request)
    {
        // TODO:
        // Replace this with a real flight API later
        // (Amadeus, Aviationstack, AeroDataBox, etc.)

        await Task.CompletedTask;

        return new FlightOption
        {
            Available = false,
            Airline = "",
            Duration = null,
            EstimatedPrice = null,
            Message = "Flight search is not implemented yet."
        };
    }
}