using TripApp_Backend.Dtos;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public interface ISavedJourneyService
{
    Task<SavedJourney> SaveAsync(Guid userId, SaveTripRequest request);
    Task<List<SavedJourney>> ListByUserAsync(Guid userId);
    Task<bool> DeleteAsync(Guid userId, Guid savedJourneyId);
}
