using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using TripApp_Backend.Data;
using TripApp_Backend.Dtos;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class ItineraryService : ITripItineraryService
{
    private readonly ApplicationDbContext _db;

    public ItineraryService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<ItineraryStop>> LoadAsync(
        Guid userId,
        Guid savedTripId)
    {
        // Defence-in-depth: the controller already validated the trip
        // belongs to the user, but this filter is cheap and safe.
        var savedTrip = await _db.SavedTrips
            .FirstOrDefaultAsync(t => t.Id == savedTripId && t.UserId == userId);

        if (savedTrip is null)
            return [];

        return await _db.ItineraryStops
            .Where(s => s.SavedTripId == savedTripId)
            .OrderBy(s => s.DayIndex)
            .ThenBy(s => s.Order)
            .ToListAsync();
    }

    public async Task UpsertAsync(
        ItineraryStopUpsertDto dto,
        Guid userId,
        Guid savedTripId)
    {
        var savedTrip = await _db.SavedTrips
            .FirstOrDefaultAsync(t => t.Id == savedTripId && t.UserId == userId);

        if (savedTrip is null)
            throw new ArgumentException("Saved trip not found or does not belong to you.", nameof(savedTripId));

        var stop = await _db.ItineraryStops
            .FirstOrDefaultAsync(s => s.Id == dto.Id && s.SavedTripId == savedTripId);

        if (stop is null)
        {
            stop = new ItineraryStop
            {
                SavedTripId = savedTripId,
                DayIndex = dto.DayIndex,
                Order = dto.Order,
                Name = dto.Name,
                Country = dto.Country,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Kind = dto.Kind,
                PlannedStart = dto.PlannedStart,
                PlannedEnd = dto.PlannedEnd,
                OpeningHours = dto.OpeningHours,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.ItineraryStops.Add(stop);
        }
        else
        {
            stop.DayIndex = dto.DayIndex;
            stop.Order = dto.Order;
            stop.Name = dto.Name;
            stop.Country = dto.Country;
            stop.Latitude = dto.Latitude;
            stop.Longitude = dto.Longitude;
            stop.Kind = dto.Kind;
            stop.PlannedStart = dto.PlannedStart;
            stop.PlannedEnd = dto.PlannedEnd;
            stop.OpeningHours = dto.OpeningHours;
            stop.Notes = dto.Notes;
            stop.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
    }

    public async Task<ItineraryStop> AddAsync(
        ItineraryStopUpsertDto dto,
        Guid userId,
        Guid savedTripId)
    {
        var savedTrip = await _db.SavedTrips
            .FirstOrDefaultAsync(t => t.Id == savedTripId && t.UserId == userId);

        if (savedTrip is null)
            throw new ArgumentException("Saved trip not found or does not belong to you.", nameof(savedTripId));

        var maxOrder = await _db.ItineraryStops
            .Where(s => s.SavedTripId == savedTripId)
            .MaxAsync(s => (int?)s.Order) ?? -1;

        var stop = new ItineraryStop
        {
            SavedTripId = savedTripId,
            DayIndex = dto.DayIndex,
            Order = maxOrder + 1,
            Name = dto.Name,
            Country = dto.Country,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Kind = dto.Kind,
            PlannedStart = dto.PlannedStart,
            PlannedEnd = dto.PlannedEnd,
            OpeningHours = dto.OpeningHours,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.ItineraryStops.Add(stop);
        await _db.SaveChangesAsync();

        return stop;
    }

    public async Task RemoveAsync(string id, Guid userId, Guid savedTripId)
    {
        var stop = await _db.ItineraryStops
            .FirstOrDefaultAsync(s => s.Id == id && s.SavedTripId == savedTripId);

        if (stop is null)
            return;

        _db.ItineraryStops.Remove(stop);
    }

    public async Task ReorderAsync(
        Guid userId,
        Guid savedTripId,
        string[] orderedIds)
    {
        if (orderedIds == null || orderedIds.Length == 0)
            return;

        var stops = await _db.ItineraryStops
            .Where(s => s.SavedTripId == savedTripId)
            .Where(s => orderedIds.Contains(s.Id))
            .ToListAsync();

        if (stops.Count != orderedIds.Length)
            throw new ArgumentException("One or more stop ids are not owned by this trip.", nameof(orderedIds));

        // Order by the caller's requested sequence, not the DB's natural order.
        var orderedIndex = new Dictionary<string, int>();
        for (var i = 0; i < orderedIds.Length; i++)
        {
            orderedIndex[orderedIds[i]] = i;
        }

        foreach (var stop in stops)
        {
            stop.Order = orderedIndex[stop.Id];
            stop.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
    }

    public async Task ClearAllAsync(Guid userId, Guid savedTripId)
    {
        var stops = await _db.ItineraryStops
            .Where(s => s.SavedTripId == savedTripId)
            .ToListAsync();

        _db.ItineraryStops.RemoveRange(stops);

        await _db.SaveChangesAsync();
    }
}
