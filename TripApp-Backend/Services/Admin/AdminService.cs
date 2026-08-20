using Microsoft.EntityFrameworkCore;
using TripApp_Backend.Data;
using TripApp_Backend.Dtos;

namespace TripApp_Backend.Services.Admin;

public class AdminService : IAdminService
{
    private readonly ApplicationDbContext _context;

    public AdminService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserDto>> AllUsersAsync()
    {
        var users = await _context.Users
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return users.Select(ToUserDto).ToList();
    }

    public async Task<List<UserDto>> SearchUsersAsync(string? query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return await AllUsersAsync();

        var term = query.Trim();

        var users = await _context.Users
            .AsNoTracking()
            .Where(x => x.Username.Contains(term) || x.Email.Contains(term))
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return users.Select(ToUserDto).ToList();
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        return user == null ? null : ToUserDto(user);
    }

    public async Task<AdminResultDto> UpdateUserRoleAsync(Guid id, string role)
    {
        if (!Enum.TryParse<UserRole>(role, true, out var parsedRole))
            return Error("INVALID_ROLE", "Invalid role. Use 'User' or 'Admin'.");

        var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (user == null)
            return Error("USER_NOT_FOUND", "User not found.");

        user.Role = parsedRole;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Success("Role updated successfully.", ToUserDto(user));
    }

    public async Task<AdminResultDto> SetUserStatusAsync(Guid id, bool isActive)
    {
        var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (user == null)
            return Error("USER_NOT_FOUND", "User not found.");

        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var message = isActive ? "User activated." : "User suspended.";
        return Success(message, ToUserDto(user));
    }

    public async Task<AdminResultDto> DeleteUserAsync(Guid id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (user == null)
            return Error("USER_NOT_FOUND", "User not found.");

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Success("User deleted successfully.", null);
    }

    public async Task<AdminStatsDto> GetStatsAsync()
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        return new AdminStatsDto
        {
            TotalUsers = await _context.Users.CountAsync(),
            ActiveUsers = await _context.Users.CountAsync(x => x.IsActive),
            AdminUsers = await _context.Users.CountAsync(x => x.Role == UserRole.Admin),
            NewUsersThisMonth = await _context.Users.CountAsync(x => x.CreatedAt >= monthStart)
        };
    }

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

    private static AdminResultDto Success(string message, UserDto? data) =>
        new AdminResultDto { Success = true, Message = message, Data = data };

    private static AdminResultDto Error(string code, string message) =>
        new AdminResultDto { Success = false, ErrorCode = code, Message = message };
}
