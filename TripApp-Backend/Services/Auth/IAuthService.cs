using TripApp_Backend.Dtos;

public interface IAuthService
{
    Task<SignupResultDto> SignupAsync(SignupDto request);
    Task<LoginResultDto?> LoginAsync(LoginDto request);
}