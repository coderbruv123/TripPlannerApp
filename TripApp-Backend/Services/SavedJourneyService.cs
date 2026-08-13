using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TripApp_Backend.Data;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class SavedJourneyService : ISavedJourneyService
{
    private readonly ApplicationDbContext _context;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public SavedJourneyService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SavedJourney> SaveAsync(Guid userId, Journey journey)
    {
        var saved = new SavedJourney
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Mode = journey.Mode,
            TotalDistanceKm = journey.TotalDistanceKm,
            TotalDurationMinutes = journey.TotalDurationMinutes,
            EstimatedPrice = journey.EstimatedPrice,
            JourneyJson = JsonSerializer.Serialize(journey, JsonOptions),
            SavedAt = DateTime.UtcNow
        };

        _context.SavedJourneys.Add(saved);
        await _context.SaveChangesAsync();

        return saved;
    }

    public async Task<List<SavedJourney>> ListByUserAsync(Guid userId)
    {
        return await _context.SavedJourneys
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.SavedAt)
            .ToListAsync();
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid savedJourneyId)
    {
        var saved = await _context.SavedJourneys
            .FirstOrDefaultAsync(x => x.Id == savedJourneyId && x.UserId == userId);

        if (saved == null)
            return false;

        _context.SavedJourneys.Remove(saved);
        await _context.SaveChangesAsync();

        return true;
    }
}
