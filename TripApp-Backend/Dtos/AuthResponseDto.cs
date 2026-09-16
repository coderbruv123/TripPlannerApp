namespace TripApp_Backend.Dtos;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;

    public string RefreshToken { get; set; } = string.Empty;

    public DateTime TokenExpiresAt { get; set; }

    public DateTime RefreshTokenExpiresAt { get; set; }

    public Guid UserId { get; set; }

    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = UserRole.User.ToString();
}