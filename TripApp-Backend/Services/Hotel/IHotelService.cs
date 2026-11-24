using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public interface IHotelService
{
    Task<HotelSearchResult> SearchHotelsAsync(
        HotelSearchRequest request);
}