using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TripApp_Backend.Dtos;
using TripApp_Backend.Models;
using TripApp_Backend.Services;

namespace TripApp_Backend.Controllers;

/// <summary>
/// Account-scoped saved trips. Only authenticated users can call this
/// controller and every write is scoped to the authenticated user, so no
/// endpoint ever exposes another user's trips.
/// </summary>
[ApiController]
[Route("api/trips/saved")]
[Authorize]
public class SavedTripsController : ControllerBase
{
    private readonly ISavedTripService _service;

    public SavedTripsController(ISavedTripService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SavedTrip>>> GetTrips(
        CancellationToken ct)
    {
        var userId = GetUserId();
        var trips = await _service.ListByUserAsync(userId, ct);

        return Ok(trips);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SavedTrip>> GetTrip(
        Guid id,
        CancellationToken ct)
    {
        var userId = GetUserId();
        var trip = await _service.GetByIdAndUserAsync(id, userId, ct);

        if (trip is null)
            return NotFound("Saved trip not found.");

        return Ok(trip);
    }

    [HttpPost]
    public async Task<ActionResult<SavedTrip>> Create(
        [FromBody] SavedTripUpsertDto dto,
        CancellationToken ct)
    {
        var userId = GetUserId();

        var trip = await _service.CreateAsync(dto, userId, ct);

        return CreatedAtAction(nameof(GetTrip), new { id = trip.Id }, trip);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SavedTrip>> Update(
        Guid id,
        [FromBody] SavedTripUpsertDto dto,
        CancellationToken ct)
    {
        var userId = GetUserId();

        var trip = await _service.UpdateAsync(id, dto, userId, ct);

        if (trip is null)
            return NotFound("Saved trip not found.");

        return Ok(trip);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(
        Guid id,
        CancellationToken ct)
    {
        var userId = GetUserId();

        var ok = await _service.DeleteAsync(id, userId, ct);

        return ok ? NoContent() : NotFound("Saved trip not found.");
    }

    [HttpPost("{id:guid}/duplicate")]
    public async Task<ActionResult<SavedTrip>> Duplicate(
        Guid id,
        [FromBody] SavedTripCopyDto? dto,
        CancellationToken ct)
    {
        var userId = GetUserId();

        var trip = await _service.DuplicateAsync(id, userId, dto, ct);

        return CreatedAtAction(nameof(GetTrip), new { id = trip.Id }, trip);
    }

    /// <summary>
    /// Removes every saved trip belonging to the authenticated user.
    /// Intended for the "Clear all" action in the UI.
    /// </summary>
    [HttpDelete]
    public async Task<ActionResult> ClearAll(CancellationToken ct)
    {
        var userId = GetUserId();

        await _service.ClearAllAsync(userId, ct);

        return NoContent();
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
