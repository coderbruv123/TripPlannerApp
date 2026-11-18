using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public interface IAirportLookupService
{
    /// <summary>Find the nearest airport to a point, preferring airports with an IATA code.</summary>
    Task<Airport?> FindNearestAsync(double latitude, double longitude, int radiusKm = 120, CancellationToken cancellationToken = default);
}
