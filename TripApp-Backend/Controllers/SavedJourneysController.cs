using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TripApp_Backend.Models;
using TripApp_Backend.Services;

namespace TripApp_Backend.Controllers;

[ApiController]
[Route("api/journeys")]
[Authorize]
public class SavedJourneysController : ControllerBase
{
    private readonly ISavedJourneyService _savedJourneyService;

    public SavedJourneysController(ISavedJourneyService savedJourneyService)
    {
        _savedJourneyService = savedJourneyService;
    }

    [HttpPost("saved")]
    public async Task<IActionResult> Save([FromBody] Journey journey)
    {
        var userId = GetUserId();

        if (userId == null)
            return Unauthorized();

        var saved = await _savedJourneyService.SaveAsync(userId.Value, journey);

        return Ok(new
        {
            saved.Id,
            saved.Mode,
            saved.TotalDistanceKm,
            saved.TotalDurationMinutes,
            saved.EstimatedPrice,
            saved.SavedAt,
            Journey = journey
        });
    }

    [HttpGet("saved")]
    public async Task<IActionResult> List()
    {
        var userId = GetUserId();

        if (userId == null)
            return Unauthorized();

        var saved = await _savedJourneyService.ListByUserAsync(userId.Value);

        var items = saved.Select(s => new
        {
            s.Id,
            s.Mode,
            s.TotalDistanceKm,
            s.TotalDurationMinutes,
            s.EstimatedPrice,
            s.SavedAt,
            Journey = Deserialize(s.JourneyJson)
        });

        return Ok(items);
    }

    [HttpDelete("saved/{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();

        if (userId == null)
            return Unauthorized();

        var deleted = await _savedJourneyService.DeleteAsync(userId.Value, id);

        if (!deleted)
            return NotFound();

        return NoContent();
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (string.IsNullOrWhiteSpace(sub))
            sub = User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private static Journey? Deserialize(string json)
    {
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<Journey>(
                json,
                new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
        }
        catch
        {
            return null;
        }
    }
}
