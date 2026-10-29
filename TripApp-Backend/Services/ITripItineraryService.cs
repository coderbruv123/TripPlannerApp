using TripApp_Backend.Models;

using TripApp_Backend.Dtos;

namespace TripApp_Backend.Services;

/// <summary>
/// Account-scoped itinerary CRUD for a single saved trip.
/// Every operation is scoped by <paramref name="userId"/> and the route
/// <paramref name="savedTripId"/>; no endpoint ever touches another user's
/// itinerary stops.
/// </summary>
public interface ITripItineraryService
{
    /// <summary>All stops for a trip, day-indexed and ordered.</summary>
    Task<List<ItineraryStop>> LoadAsync(Guid userId, Guid savedTripId);

    /// <summary>Insert, or update an existing stop id into the same trip.</summary>
    Task UpsertAsync(ItineraryStopUpsertDto dto, Guid userId, Guid savedTripId);

    /// <summary>Create a brand-new stop.</summary>
    Task<ItineraryStop> AddAsync(ItineraryStopUpsertDto dto, Guid userId, Guid savedTripId);

    /// <summary>Delete one stop.</summary>
    Task RemoveAsync(string id, Guid userId, Guid savedTripId);

    /// <summary>Reorder stops within a day by position.</summary>
    Task ReorderAsync(Guid userId, Guid savedTripId, string[] orderedIds);

    /// <summary>Remove every stop for a trip.</summary>
    Task ClearAllAsync(Guid userId, Guid savedTripId);
}
