using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public interface ITripPlannerService
{
    Task<List<Journey>> SearchAsync(TripRequest request);
}
