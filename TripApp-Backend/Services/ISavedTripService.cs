using TripApp_Backend.Dtos;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

/// <summary>
/// Persistence for account-scoped saved trips. Every query filters by the
/// caller's user id, so a user can never read or write another user's trips.
/// </summary>
public interface ISavedTripService
{
    Task<SavedTrip> CreateAsync(
        SavedTripUpsertDto dto,
        Guid userId,
        CancellationToken ct = default);

    Task<IReadOnlyList<SavedTrip>> ListByUserAsync(
        Guid userId,
        CancellationToken ct = default);

    Task<SavedTrip?> GetByIdAsync(
        Guid id,
        CancellationToken ct = default);

    Task<SavedTrip?> GetByIdAndUserAsync(
        Guid id,
        Guid userId,
        CancellationToken ct = default);

    Task<SavedTrip?> UpdateAsync(
        Guid id,
        SavedTripUpsertDto dto,
        Guid userId,
        CancellationToken ct = default);

    Task<bool> DeleteAsync(
        Guid id,
        Guid userId,
        CancellationToken ct = default);

    Task<SavedTrip> DuplicateAsync(
        Guid id,
        Guid userId,
        SavedTripCopyDto? dto,
        CancellationToken ct = default);

    Task ClearAllAsync(Guid userId, CancellationToken ct = default);
}
