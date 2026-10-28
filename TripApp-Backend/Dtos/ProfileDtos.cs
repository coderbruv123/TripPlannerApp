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
    public string? Nickname { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? Occupation { get; set; }
    public string? Location { get; set; }
}

public class ProfileResultDto
{
    public bool Success { get; set; }
    public string? ErrorCode { get; set; }
    public string? Message { get; set; }
    public UserDto? Data { get; set; }
}
