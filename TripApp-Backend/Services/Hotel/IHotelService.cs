using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public interface IHotelService
{
    Task<List<Hotel>> SearchHotelsAsync(
        HotelSearchRequest request);
}