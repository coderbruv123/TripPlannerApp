namespace TripApp_Backend.Dtos;

public class UserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = UserRole.User.ToString();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateUserRoleDto
{
    public string Role { get; set; } = null!;
}

public class SetUserStatusDto
{
    public bool IsActive { get; set; }
}

public class AdminStatsDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int AdminUsers { get; set; }
    public int NewUsersThisMonth { get; set; }
}

public class AdminResultDto
{
    public bool Success { get; set; }
    public string? ErrorCode { get; set; }
    public string? Message { get; set; }
    public UserDto? Data { get; set; }
}
