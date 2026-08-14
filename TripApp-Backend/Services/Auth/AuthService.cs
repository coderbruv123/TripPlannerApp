using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TripApp_Backend.Data;
using TripApp_Backend.Dtos;

namespace TripApp_Backend.Services.Auth;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly PasswordHasher<User> _passwordHasher;
    private readonly IJwtService _jwtService;

    public AuthService(
        ApplicationDbContext context,
        IJwtService jwtService)
    {
        _context = context;
        _passwordHasher = new PasswordHasher<User>();
        _jwtService = jwtService;
    }

public async Task<SignupResultDto> SignupAsync(SignupDto request)
{
    var email = request.Email.Trim().ToLowerInvariant();
    var username = request.Username.Trim();

    // Check email
    var emailExists = await _context.Users
        .AnyAsync(x => x.Email == email);

    // Check username
    var usernameExists = await _context.Users
        .AnyAsync(x => x.Username == username);

    // Both exist
    if (emailExists && usernameExists)
    {
        return new SignupResultDto
        {
            Success = false,
            ErrorCode = "EMAIL_AND_USERNAME_EXISTS",
            Message = "The email and username are already in use."
        };
    }

    // Email exists
    if (emailExists)
    {
        return new SignupResultDto
        {
            Success = false,
            ErrorCode = "EMAIL_EXISTS",
            Message = "An account with this email already exists."
        };
    }

    // Username exists
    if (usernameExists)
    {
        return new SignupResultDto
        {
            Success = false,
            ErrorCode = "USERNAME_EXISTS",
            Message = "This username is already taken."
        };
    }

    var user = new User
    {
        Id = Guid.NewGuid(),
        Username = username,
        Email = email,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    user.PasswordHash = _passwordHasher.HashPassword(
        user,
        request.Password
    );

    await _context.Users.AddAsync(user);
    await _context.SaveChangesAsync();

    var token = _jwtService.GenerateToken(user);

    return new SignupResultDto
    {
        Success = true,
        Message = "Registration successful.",
        Data = new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role.ToString()
        }
    };

    }

    public async Task<LoginResultDto?> LoginAsync(LoginDto request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Email == email);

        if (user == null)
            return null;

        var result = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            request.Password
        );

        if (result == PasswordVerificationResult.Failed)
            return null;

        var token = _jwtService.GenerateToken(user);


         return new LoginResultDto
    {
        Success = true,
        Message = "Login successful.",
        Data = new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role.ToString()
        }
    };
    }
}