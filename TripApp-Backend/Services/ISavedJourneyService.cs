using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public interface ISavedJourneyService
{
    Task<SavedJourney> SaveAsync(Guid userId, Journey journey);
    Task<List<SavedJourney>> ListByUserAsync(Guid userId);
    Task<bool> DeleteAsync(Guid userId, Guid savedJourneyId);
}
