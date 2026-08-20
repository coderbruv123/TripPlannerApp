using TripApp_Backend.Dtos;

public interface IAuthService
{
    Task<SignupResultDto> SignupAsync(SignupDto request);
    Task<LoginResultDto?> LoginAsync(LoginDto request);
    Task<UserDto?> GetUserByIdAsync(Guid userId);
    Task<ProfileResultDto> ChangePasswordAsync(Guid userId, ChangePasswordDto request);
    Task<ProfileResultDto> UpdateProfileAsync(Guid userId, UpdateProfileDto request);
}