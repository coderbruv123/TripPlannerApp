using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TripApp_Backend.Dtos;
using TripApp_Backend.Models;
using TripApp_Backend.Services;

namespace TripApp_Backend.Controllers;

/// <summary>
/// Account-scoped day-by-day itinerary for a single saved trip.
/// Stops ride the same user scoping as <see cref="SavedTripsController"/>:
/// every write is scoped to the authenticated user, and no endpoint ever
/// exposes another user's stops.
/// </summary>
[ApiController]
[Route("api/trips/saved/{savedTripId:guid}/itinerary")]
[Authorize]
public class ItineraryController : ControllerBase
{
    private readonly ITripItineraryService _service;

    public ItineraryController(ITripItineraryService service)
    {
        _service = service;
    }

    // GET /api/trips/saved/{savedTripId}/itinerary
    [HttpGet]
    public async Task<ActionResult<List<ItineraryStopListDto>>> Get(
        Guid savedTripId,
        CancellationToken ct)
    {
        var userId = GetUserId();
        var stops = await _service.LoadAsync(userId, savedTripId);

        return Ok(stops.Select(Map).ToList());
    }

    // GET /api/trips/saved/{savedTripId:guid}/itinerary/day/{dayIndex}
    [HttpGet("day/{dayIndex}")]
    public async Task<ActionResult<List<ItineraryStopListDto>>> GetDay(
        Guid savedTripId,
        int dayIndex,
        CancellationToken ct)
    {
        var userId = GetUserId();
        var stops = await _service.LoadAsync(userId, savedTripId);

        var day = stops
            .Where(s => s.DayIndex == dayIndex)
            .OrderBy(s => s.Order)
            .Select(Map)
            .ToList();

        return Ok(day);
    }

    // POST /api/trips/saved/{savedTripId}/itinerary
    [HttpPost]
    public async Task<ActionResult<ItineraryStop>> Post(
        Guid savedTripId,
        [FromBody] ItineraryStopUpsertDto dto,
        CancellationToken ct)
    {
        var userId = GetUserId();

        if (dto is null)
            return BadRequest("Request body is required.");

        var stop = await _service.AddAsync(dto, userId, savedTripId);

        return CreatedAtAction(
            nameof(Get),
            new { savedTripId },
            Map(stop));
    }

    // PUT /api/trips/saved/{savedTripId}/itinerary/{stopId}
    [HttpPut("{stopId}")]
    public async Task<ActionResult<ItineraryStop>> Put(
        Guid savedTripId,
        string stopId,
        [FromBody] ItineraryStopUpsertDto dto,
        CancellationToken ct)
    {
        var userId = GetUserId();

        if (dto is null)
            return BadRequest("Request body is required.");

        await _service.UpsertAsync(dto, userId, savedTripId);

        // Return the current state so the client can re-render with the
        // latest DayIndex / Order / timestamps.
        var stops = await _service.LoadAsync(userId, savedTripId);
        var updated = stops.FirstOrDefault(s => s.Id == stopId);

        return updated is null ? NotFound("Stop not found.") : Ok(Map(updated));
    }

    // DELETE /api/trips/saved/{savedTripId}/itinerary/{stopId}
    [HttpDelete("{stopId}")]
    public async Task<ActionResult> Delete(
        Guid savedTripId,
        string stopId,
        CancellationToken ct)
    {
        var userId = GetUserId();

        await _service.RemoveAsync(stopId, userId, savedTripId);

        return NoContent();
    }

    // PUT /api/trips/saved/{savedTripId}/itinerary/reorder
    [HttpPut("reorder")]
    public async Task<ActionResult> Reorder(
        Guid savedTripId,
        [FromBody] ItineraryReorderDto dto,
        CancellationToken ct)
    {
        var userId = GetUserId();

        if (dto is null || dto.OrderedIds == null || dto.OrderedIds.Length == 0)
            return BadRequest("OrderedIds are required.");

        await _service.ReorderAsync(userId, savedTripId, dto.OrderedIds);

        return NoContent();
    }

    // DELETE /api/trips/saved/{savedTripId}/itinerary
    [HttpDelete]
    public async Task<ActionResult> ClearAll(
        Guid savedTripId,
        CancellationToken ct)
    {
        var userId = GetUserId();

        await _service.ClearAllAsync(userId, savedTripId);

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

    private static ItineraryStopListDto Map(ItineraryStop stop) => new()
    {
        Id = stop.Id,
        DayIndex = stop.DayIndex,
        Order = stop.Order,
        Name = stop.Name,
        Country = stop.Country,
        Latitude = stop.Latitude,
        Longitude = stop.Longitude,
        Kind = stop.Kind,
        PlannedStart = stop.PlannedStart,
        PlannedEnd = stop.PlannedEnd,
        OpeningHours = stop.OpeningHours,
        Notes = stop.Notes
    };
}
