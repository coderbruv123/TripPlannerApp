using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public sealed class HotelCachePrewarmService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<HotelCachePrewarmService> _logger;

    private static readonly (string Name, double Lat, double Lon)[] Cities =
    [
        ("Kathmandu", 27.7172, 85.3240),
        ("Tokyo", 35.6762, 139.6503),
        ("New York", 40.7128, -74.0060),
        ("London", 51.5074, -0.1278),
        ("Paris", 48.8566, 2.3522),
        ("Dubai", 25.2048, 55.2708)
    ];

    public HotelCachePrewarmService(IServiceScopeFactory scopeFactory, ILogger<HotelCachePrewarmService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Deferred: do not block startup.
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        _logger.LogInformation("hotel_prewarm start cities={CityCount}", Cities.Length);

        foreach (var city in Cities)
        {
            if (stoppingToken.IsCancellationRequested) break;

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var hotelService = scope.ServiceProvider.GetRequiredService<IHotelService>();
                var result = await hotelService.SearchHotelsAsync(new HotelSearchRequest
                {
                    Latitude = city.Lat,
                    Longitude = city.Lon,
                    RadiusKm = 5,
                    Limit = 10
                });

                _logger.LogInformation("hotel_prewarm city={City} results={ResultCount} stale={Stale} notice={Notice}",
                    city.Name, result.Hotels.Count, result.Stale, result.Notice);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "hotel_prewarm city={City} failed", city.Name);
            }

            // Respect upstream rate limits / avoid burst.
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("hotel_prewarm done");
    }
}
