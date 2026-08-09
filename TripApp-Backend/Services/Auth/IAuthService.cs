using TripApp_Backend.Dtos;

public interface IAuthService
{
    Task<AuthResponseDto?> SignupAsync(SignupDto request);
    Task<AuthResponseDto?> LoginAsync(LoginDto request);
}