using Microsoft.AspNetCore.Mvc;
using TripApp_Backend.Models;
using TripApp_Backend.Services;

namespace TripApp_Backend.Controllers;

[ApiController]
[Route("api/trips")]
public class TripsController : ControllerBase
{
    private readonly ITripPlannerService _planner;
    private readonly IFlightService _flightService;

    public TripsController(
        ITripPlannerService planner,
        IFlightService flightService)
    {
        _planner = planner;
        _flightService = flightService;
    }

    [HttpPost("search")]
    public async Task<IActionResult> Search(
        TripRequest request)
    {
        var routes = await _planner.SearchAsync(request);

        var flight = await _flightService.SearchFlightAsync(
            new FlightSearchRequest
            {
                OriginLat = request.OriginLat,
                OriginLng = request.OriginLng,
                DestinationLat = request.DestinationLat,
                DestinationLng = request.DestinationLng
            });

        return Ok(new
        {
            Routes = routes,
            Flight = flight
        });
    }
}