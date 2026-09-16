namespace TripApp_Backend.Services.Auth;

public interface IJwtService
{
    string GenerateToken(User user);
    string GenerateRefreshToken();
    int RefreshTokenLifetimeDays { get; }
    int AccessTokenLifetimeMinutes { get; }
}