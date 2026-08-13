namespace TripApp_Backend.Dtos;
public class SignupDto
{
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public class SignupResultDto
{
    public bool Success { get; set; }
    public string? ErrorCode { get; set; }
    public string? Message { get; set; }

    public AuthResponseDto? Data { get; set; }
}