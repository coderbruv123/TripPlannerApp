using TripApp_Backend.Dtos;

namespace TripApp_Backend.Services;

/// <summary>
/// Account-scoped budget allocation for a single saved trip. Both operations
/// return null when the trip does not exist or is not owned by the caller.
/// </summary>
public interface IBudgetService
{
    Task<BudgetResponseDto?> GetAsync(
        Guid tripId,
        Guid userId,
        CancellationToken ct = default);

    Task<BudgetResponseDto?> UpdateAsync(
        Guid tripId,
        Guid userId,
        BudgetUpdateDto dto,
        CancellationToken ct = default);
}
