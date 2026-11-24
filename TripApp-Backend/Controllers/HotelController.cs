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
            return BadRequest(new
            {
                hotels = Array.Empty<Hotel>(),
                notice = "Valid latitude and longitude are required.",
                stale = false
            });
        }

        try
        {
            var result = await _hotelService.SearchHotelsAsync(request);
            return Ok(result);
        }
        catch (HotelSearchUnavailableException ex)
        {
            return Ok(new HotelSearchResult
            {
                Hotels = [],
                Notice = ex.Message,
                Stale = false
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new HotelSearchResult
            {
                Hotels = [],
                Notice = $"Unable to search hotels: {ex.Message}",
                Stale = false
            });
        }
    }
}