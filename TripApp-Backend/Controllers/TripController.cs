using Microsoft.AspNetCore.Mvc;
using TripApp_Backend.Models;
using TripApp_Backend.Services;

namespace TripApp_Backend.Controllers;

[ApiController]
[Route("api/trips")]
public class TripsController : ControllerBase
{
    private readonly ITripPlannerService _planner;

    public TripsController(ITripPlannerService planner)
    {
        _planner = planner;
    }

    [HttpPost("search")]
    public async Task<IActionResult> Search(
        TripRequest request)
    {
        var journeys = await _planner.SearchAsync(request);

        return Ok(new
        {
            Journeys = journeys
        });
    }
}
