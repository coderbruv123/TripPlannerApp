using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TripApp_Backend.Dtos;
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
    public async Task<IActionResult> Save([FromBody] SaveTripRequest request)
    {
        var userId = GetUserId();

        if (userId == null)
            return Unauthorized();

        if (request == null ||
            ((request.Journeys == null || request.Journeys.Count == 0) &&
             request.Selected == null))
        {
            return BadRequest("No journey to save.");
        }

        var saved = await _savedJourneyService.SaveAsync(userId.Value, request);

        return Ok(new
        {
            saved.Id,
            saved.Mode,
            saved.TotalDistanceKm,
            saved.TotalDurationMinutes,
            saved.EstimatedPrice,
            saved.SavedAt,
            Trip = DeserializeTrip(saved.JourneyJson)
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
            Trip = DeserializeTrip(s.JourneyJson)
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

    private static SavedTripPayload? DeserializeTrip(string json)
    {
        try
        {
            var options = new System.Text.Json.JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var payload = System.Text.Json.JsonSerializer
                .Deserialize<SavedTripPayload>(json, options);

            if (payload != null && payload.Journeys.Count > 0)
                return payload;

            var legacy = System.Text.Json.JsonSerializer
                .Deserialize<Journey>(json, options);

            if (legacy != null)
            {
                return new SavedTripPayload
                {
                    Journeys = new List<Journey> { legacy }
                };
            }

            return payload;
        }
        catch
        {
            return null;
        }
    }
}
