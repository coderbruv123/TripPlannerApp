using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public interface IHotelService
{
    Task<List<Hotel>> SearchHotelsAsync(
        HotelSearchRequest request);

    Task<List<Hotel>> ListAllAsync();

    Task<Hotel> AddAsync(Hotel hotel);

    Task<bool> DeleteAsync(long id);

    Task<List<Hotel>> NearAsync(
        double latitude,
        double longitude,
        double radiusKm,
        int limit);
}
