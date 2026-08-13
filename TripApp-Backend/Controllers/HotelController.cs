using Microsoft.AspNetCore.Mvc;
using TripApp_Backend.Models;
using TripApp_Backend.Services;

namespace TripApp_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HotelsController : ControllerBase
{
    private readonly IHotelService _hotelService;

    public HotelsController(IHotelService hotelService)
    {
        _hotelService = hotelService;
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] HotelSearchRequest request)
    {
        if (request.Latitude == 0 &&
            request.Longitude == 0)
        {
            return BadRequest(
                "Valid latitude and longitude are required."
            );
        }

        try
        {
            var hotels =
                await _hotelService.SearchHotelsAsync(request);

            return Ok(hotels);
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(503, new
            {
                message = "Hotel service unavailable.",
                error = ex.Message
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Unable to search hotels.",
                error = ex.Message
            });
        }
    }
}