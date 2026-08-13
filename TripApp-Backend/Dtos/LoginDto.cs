namespace TripApp_Backend.Dtos;

public class LoginDto
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public class LoginResultDto
{
    public bool Success { get; set; }
    public string? ErrorCode { get; set; }
    public string? Message { get; set; }

    public AuthResponseDto? Data { get; set; }
}