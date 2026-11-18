using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TripApp_Backend.Dtos;
using TripApp_Backend.Services;

namespace TripApp_Backend.Controllers;

/// <summary>
/// Budget allocation for one account-owned saved trip. The route trip id is
/// always checked against the authenticated user before any data is returned
/// or written, so a foreign or unknown trip is indistinguishable from 404.
/// </summary>
[ApiController]
[Route("api/trips")]
[Authorize]
public class BudgetController : ControllerBase
{
    private readonly IBudgetService _service;

    public BudgetController(IBudgetService service)
    {
        _service = service;
    }

    // GET /api/trips/{tripId}/budget
    [HttpGet("{tripId:guid}/budget")]
    public async Task<ActionResult<BudgetResponseDto>> Get(
        Guid tripId,
        CancellationToken ct)
    {
        var budget = await _service.GetAsync(tripId, GetUserId(), ct);

        return budget is null ? NotFound("Saved trip not found.") : Ok(budget);
    }

    // POST /api/trips/{tripId}/budget
    [HttpPost("{tripId:guid}/budget")]
    public async Task<ActionResult<BudgetResponseDto>> Post(
        Guid tripId,
        [FromBody] BudgetUpdateDto? dto,
        CancellationToken ct)
    {
        if (dto is null)
            return BadRequest("Request body is required.");

        if (dto.TripId != Guid.Empty && dto.TripId != tripId)
            return BadRequest("Body tripId must match the route tripId.");

        var budget = await _service.UpdateAsync(tripId, GetUserId(), dto, ct);

        return budget is null ? NotFound("Saved trip not found.") : Ok(budget);
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (Guid.TryParse(sub, out var id))
            return id;

        throw new UnauthorizedAccessException("Cannot determine the current user.");
    }
}
