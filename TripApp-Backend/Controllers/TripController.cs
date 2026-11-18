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

        var flightRequest = new FlightSearchRequest
        {
            OriginLat = request.OriginLat,
            OriginLng = request.OriginLng,
            DestinationLat = request.DestinationLat,
            DestinationLng = request.DestinationLng,
            OriginName = request.OriginName,
            DestinationName = request.DestinationName
        };

        var flight = await _flightService.SearchFlightAsync(flightRequest);

        // Present flights as first-class route options (Rome2Rio-like) so they can be
        // compared/selected and show a segment breakdown + map path.
        var flightRoutes = _flightService.BuildRouteOptions(flightRequest, flight);
        if (flightRoutes.Count > 0)
        {
            routes = routes.Concat(flightRoutes).ToList();
        }

        return Ok(new
        {
            Routes = routes,
            Flight = flight
        });
    }
}