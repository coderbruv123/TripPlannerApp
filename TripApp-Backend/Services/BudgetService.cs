using Microsoft.EntityFrameworkCore;
using TripApp_Backend.Data;
using TripApp_Backend.Dtos;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public class BudgetService : IBudgetService
{
    private readonly ApplicationDbContext _db;

    public BudgetService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<BudgetResponseDto?> GetAsync(
        Guid tripId,
        Guid userId,
        CancellationToken ct = default)
    {
        if (!await OwnsTripAsync(tripId, userId, ct))
            return null;

        var rows = await LoadRowsAsync(tripId, ct);
        return BuildResponse(tripId, rows);
    }

    public async Task<BudgetResponseDto?> UpdateAsync(
        Guid tripId,
        Guid userId,
        BudgetUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!await OwnsTripAsync(tripId, userId, ct))
            return null;

        if (dto.Categories is not null)
        {
            foreach (var (key, amount) in dto.Categories)
            {
                // Only the six contract categories are stored. Matching is
                // case-insensitive so callers always get canonical keys back.
                var category = BudgetCategories.Keys.FirstOrDefault(
                    k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));

                if (category is null)
                    continue;

                var row = await _db.BudgetBreakdowns
                    .FirstOrDefaultAsync(
                        b => b.SavedTripId == tripId && b.Category == category, ct);

                if (row is null)
                {
                    _db.BudgetBreakdowns.Add(new BudgetBreakdown
                    {
                        SavedTripId = tripId,
                        Category = category,
                        Amount = amount
                    });
                }
                else
                {
                    row.Amount = amount;
                }
            }

            await _db.SaveChangesAsync(ct);
        }

        // POST answers with the same GET shape, reflecting the stored state.
        var rows = await LoadRowsAsync(tripId, ct);
        return BuildResponse(tripId, rows);
    }

    private async Task<bool> OwnsTripAsync(
        Guid tripId,
        Guid userId,
        CancellationToken ct)
    {
        return await _db.SavedTrips
            .AnyAsync(trip => trip.Id == tripId && trip.UserId == userId, ct);
    }

    private async Task<List<BudgetBreakdown>> LoadRowsAsync(
        Guid tripId,
        CancellationToken ct)
    {
        return await _db.BudgetBreakdowns
            .Where(b => b.SavedTripId == tripId)
            .ToListAsync(ct);
    }

    private static BudgetResponseDto BuildResponse(
        Guid tripId,
        IEnumerable<BudgetBreakdown> rows)
    {
        var response = new BudgetResponseDto { TripId = tripId };

        foreach (var row in rows)
        {
            if (response.Categories.ContainsKey(row.Category))
                response.Categories[row.Category] = row.Amount;
        }

        return response;
    }
}
