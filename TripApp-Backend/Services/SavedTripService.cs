using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using TripApp_Backend.Data;
using TripApp_Backend.Dtos;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class SavedTripService : ISavedTripService
{
    private readonly ApplicationDbContext _db;

    public SavedTripService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<SavedTrip> CreateAsync(
        SavedTripUpsertDto dto,
        Guid userId,
        CancellationToken ct = default)
    {
        var trip = MapDto(dto);
        trip.UserId = userId;
        trip.CreatedAt = DateTime.UtcNow;
        trip.UpdatedAt = DateTime.UtcNow;

        _db.SavedTrips.Add(trip);
        await _db.SaveChangesAsync(ct);

        return trip;
    }

    public async Task<IReadOnlyList<SavedTrip>> ListByUserAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        return await _db.SavedTrips
            .Where(trip => trip.UserId == userId)
            .OrderByDescending(trip => trip.UpdatedAt)
            .ToListAsync(ct);
    }

    public async Task<SavedTrip?> GetByIdAsync(
        Guid id,
        CancellationToken ct = default)
    {
        return await _db.SavedTrips.FindAsync(new object?[] { id }, ct);
    }

    public async Task<SavedTrip?> GetByIdAndUserAsync(
        Guid id,
        Guid userId,
        CancellationToken ct = default)
    {
        return await _db.SavedTrips
            .FirstOrDefaultAsync(trip => trip.Id == id && trip.UserId == userId, ct);
    }

    public async Task<SavedTrip?> UpdateAsync(
        Guid id,
        SavedTripUpsertDto dto,
        Guid userId,
        CancellationToken ct = default)
    {
        var trip = await GetByIdAndUserAsync(id, userId, ct);

        if (trip is null)
            return null;

        MapDto(dto, trip);
        trip.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return trip;
    }

    public async Task<bool> DeleteAsync(
        Guid id,
        Guid userId,
        CancellationToken ct = default)
    {
        var trip = await GetByIdAndUserAsync(id, userId, ct);

        if (trip is null)
            return false;

        _db.SavedTrips.Remove(trip);
        await _db.SaveChangesAsync(ct);

        return true;
    }

    public async Task<SavedTrip> DuplicateAsync(
        Guid id,
        Guid userId,
        SavedTripCopyDto? dto,
        CancellationToken ct = default)
    {
        var original = await _db.SavedTrips.FindAsync(new object?[] { id }, ct);

        if (original is null)
            throw new KeyNotFoundException($"Saved trip '{id}' was not found.");

        if (original.UserId != userId)
            throw new UnauthorizedAccessException("You can only work with your own trips.");

        var copy = new SavedTrip
        {
            Title = original.Title,
            Country = original.Country,
            OriginLabel = original.OriginLabel,
            DestinationName = original.DestinationName,
            DestinationCountry = original.DestinationCountry,
            From = dto?.From ?? original.From,
            To = dto?.To ?? original.To,
            Travelers = dto?.Travelers ?? original.Travelers,
            Budget = dto?.Budget ?? original.Budget,
            Url = original.Url,
            Interests = (string[])(dto?.From is null ? original.Interests : []),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.SavedTrips.Add(copy);
        await _db.SaveChangesAsync(ct);

        return copy;

    }

    private static string BuildDuplicateUrl(string originalUrl, Guid newId)
    {
        // Give the copy its own URL so "Open trip" and itinerary scoping stay
        // unique to each saved-trip row.
        var separator = originalUrl.IndexOf('?');
        var basePath = separator >= 0 ? originalUrl[..separator] : originalUrl;
        var query = separator >= 0 ? originalUrl[separator..] : string.Empty;

        return $"{basePath}-copy-{newId}{query}";
    }

    public async Task ClearAllAsync(Guid userId, CancellationToken ct = default)
    {
        var trips = await _db.SavedTrips
            .Where(trip => trip.UserId == userId)
            .ToListAsync(ct);

        _db.SavedTrips.RemoveRange(trips);
        await _db.SaveChangesAsync(ct);
    }

    private static SavedTrip MapDto(SavedTripUpsertDto dto)
    {
        return new SavedTrip
        {
            Title = dto.Title,
            Country = dto.Country,
            OriginLabel = dto.OriginLabel,
            OriginLat = dto.OriginLat,
            OriginLng = dto.OriginLng,
            DestinationName = dto.DestinationName,
            DestinationCountry = dto.DestinationCountry,
            DestinationLat = dto.DestinationLat,
            DestinationLng = dto.DestinationLng,
            From = dto.From,
            To = dto.To,
            Travelers = dto.Travelers,
            Budget = dto.Budget,
            Url = dto.Url,
            Interests = dto.Interests
        };
    }

    private static void MapDto(SavedTripUpsertDto dto, SavedTrip trip)
    {
        trip.Title = dto.Title;
        trip.Country = dto.Country;
        trip.OriginLabel = dto.OriginLabel;
        trip.DestinationName = dto.DestinationName;
        trip.DestinationCountry = dto.DestinationCountry;
        trip.From = dto.From;
        trip.To = dto.To;
        trip.Travelers = dto.Travelers;
        trip.Budget = dto.Budget;
        trip.Url = dto.Url;
        trip.OriginLat = dto.OriginLat;
        trip.OriginLng = dto.OriginLng;
        trip.DestinationLat = dto.DestinationLat;
        trip.DestinationLng = dto.DestinationLng;
        trip.Interests = dto.Interests;
    }
}
