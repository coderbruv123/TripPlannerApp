using Microsoft.AspNetCore.Mvc;
using TripApp_Backend.Services;

namespace TripApp_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DestinationsController : ControllerBase
{
    private readonly IDestinationService _destinationService;

    public DestinationsController(IDestinationService destinationService)
    {
        _destinationService = destinationService;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string search)
    {
        if (string.IsNullOrWhiteSpace(search))
        {
            return BadRequest("Search term is required");
        }

        try
        {
            var destinations =
                await _destinationService.SearchDestinationsAsync(search);

            return Ok(destinations);
        }
        catch (DestinationSearchException exception)
        {
            // 503 + a sentence the picker can show under the input.
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { message = exception.Message }
            );
        }
    }
}