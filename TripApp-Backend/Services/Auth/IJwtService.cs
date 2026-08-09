namespace TripApp_Backend.Services.Auth;

public interface IJwtService
{
    string GenerateToken(User user);
}