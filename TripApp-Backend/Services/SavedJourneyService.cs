using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TripApp_Backend.Data;
using TripApp_Backend.Dtos;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class SavedJourneyService : ISavedJourneyService
{
    private readonly ApplicationDbContext _context;

    private readonly INotificationService _notificationService;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public SavedJourneyService(
        ApplicationDbContext context,
        INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<SavedJourney> SaveAsync(
        Guid userId,
        SaveTripRequest request)
    {
        var journeys = request.Journeys != null &&
                       request.Journeys.Count > 0
            ? request.Journeys
            : request.Selected != null
                ? new List<Journey> { request.Selected }
                : new List<Journey>();

        var selected = request.Selected ??
                       journeys.FirstOrDefault();

        var payload = new SavedTripPayload
        {
            Journeys = journeys,
            Destination = request.Destination,
            Origin = request.Origin
        };

        var saved = new SavedJourney
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Mode = selected?.Mode ?? "",
            TotalDistanceKm = selected?.TotalDistanceKm ?? 0,
            TotalDurationMinutes = selected?.TotalDurationMinutes ?? 0,
            EstimatedPrice = selected?.EstimatedPrice,
            JourneyJson = JsonSerializer.Serialize(payload, JsonOptions),
            SavedAt = DateTime.UtcNow
        };

        _context.SavedJourneys.Add(saved);
        await _context.SaveChangesAsync();

        await _notificationService.CreateAsync(
            userId,
            "Trip saved",
            $"Your {(selected?.Mode ?? "trip")} trip "
            + $"({selected?.TotalDistanceKm ?? 0:0} km) is saved to My Trips."
        );

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
