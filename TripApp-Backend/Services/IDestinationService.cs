using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public interface IDestinationService
{
    Task<List<Destination>> SearchDestinationsAsync(string search);
}
