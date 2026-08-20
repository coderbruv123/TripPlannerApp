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

        if (!user.IsActive)
            return new LoginResultDto
            {
                Success = false,
                ErrorCode = "ACCOUNT_SUSPENDED",
                Message = "This account has been suspended. Contact support for help."
            };

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

    public async Task<UserDto?> GetUserByIdAsync(Guid userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == userId);

        return user == null ? null : ToUserDto(user);
    }

    public async Task<ProfileResultDto> ChangePasswordAsync(
        Guid userId,
        ChangePasswordDto request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Id == userId);

        if (user == null)
            return Error("USER_NOT_FOUND", "User not found.");

        var verify = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            request.CurrentPassword
        );

        if (verify == PasswordVerificationResult.Failed)
            return Error("INVALID_CURRENT_PASSWORD", "Current password is incorrect.");

        if (string.IsNullOrWhiteSpace(request.NewPassword) ||
            request.NewPassword.Length < 6)
            return Error("WEAK_PASSWORD", "New password must be at least 6 characters.");

        if (request.NewPassword != request.ConfirmNewPassword)
            return Error("PASSWORD_MISMATCH", "New passwords do not match.");

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ProfileResultDto
        {
            Success = true,
            Message = "Password updated successfully."
        };
    }

    public async Task<ProfileResultDto> UpdateProfileAsync(
        Guid userId,
        UpdateProfileDto request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Id == userId);

        if (user == null)
            return Error("USER_NOT_FOUND", "User not found.");

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            var taken = await _context.Users
                .AnyAsync(x => x.Email == normalizedEmail && x.Id != userId);

            if (taken)
                return Error("EMAIL_EXISTS", "This email is already in use.");

            user.Email = normalizedEmail;
        }

        if (!string.IsNullOrWhiteSpace(request.Username))
        {
            var normalizedUsername = request.Username.Trim();

            var taken = await _context.Users
                .AnyAsync(x => x.Username == normalizedUsername && x.Id != userId);

            if (taken)
                return Error("USERNAME_EXISTS", "This username is already taken.");

            user.Username = normalizedUsername;
        }

        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ProfileResultDto
        {
            Success = true,
            Message = "Profile updated successfully.",
            Data = ToUserDto(user)
        };
    }

    private static ProfileResultDto Error(string code, string message) =>
        new ProfileResultDto
        {
            Success = false,
            ErrorCode = code,
            Message = message
        };

    private static UserDto ToUserDto(User user) =>
        new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
}