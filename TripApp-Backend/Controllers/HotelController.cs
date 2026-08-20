using Microsoft.AspNetCore.Authorization;
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

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var hotels = await _hotelService.ListAllAsync();
        return Ok(hotels);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Add([FromBody] Hotel hotel)
    {
        if (string.IsNullOrWhiteSpace(hotel.Name))
            return BadRequest("Hotel name is required.");

        if (string.IsNullOrWhiteSpace(hotel.City))
            return BadRequest("City is required.");

        var created = await _hotelService.AddAsync(hotel);
        return Ok(created);
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(long id)
    {
        var deleted = await _hotelService.DeleteAsync(id);

        if (!deleted)
            return NotFound();

        return NoContent();
    }

    [HttpGet("near")]
    public async Task<IActionResult> Near(
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        [FromQuery] double radiusKm = 50,
        [FromQuery] int limit = 20)
    {
        if (latitude < -90 || latitude > 90 ||
            longitude < -180 || longitude > 180)
        {
            return BadRequest("Valid latitude and longitude are required.");
        }

        var hotels = await _hotelService.NearAsync(
            latitude,
            longitude,
            radiusKm,
            limit);

        return Ok(hotels);
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