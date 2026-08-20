namespace TripApp_Backend.Dtos;

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
    public string ConfirmNewPassword { get; set; } = null!;
}

public class UpdateProfileDto
{
    public string? Username { get; set; }
    public string? Email { get; set; }
}

public class ProfileResultDto
{
    public bool Success { get; set; }
    public string? ErrorCode { get; set; }
    public string? Message { get; set; }
    public UserDto? Data { get; set; }
}
