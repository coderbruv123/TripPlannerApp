using Microsoft.EntityFrameworkCore;
using TripApp_Backend.Data;
using TripApp_Backend.Dtos;
using TripApp_Backend.Models;

namespace TripApp_Backend.Services.Admin;

public class AdminService : IAdminService
{
    private readonly ApplicationDbContext _context;

    public AdminService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AdminUserDto>> AllUsersAsync()
    {
        return await _context.Users
            .OrderByDescending(x => x.CreatedAt)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role.ToString(),
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<AdminUserDto?> SearchUser(string name)
    {
        return await _context.Users
            .Where(x => x.Username == name)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role.ToString(),
                CreatedAt = u.CreatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<AdminStatsDto> GetStatsAsync()
    {
        var startOfMonth = new DateTime(
            DateTime.UtcNow.Year,
            DateTime.UtcNow.Month,
            1,
            0,
            0,
            0,
            DateTimeKind.Utc
        );

        var totalUsers = await _context.Users.CountAsync();
        var adminUsers = await _context.Users
            .CountAsync(x => x.Role == UserRole.Admin);
        var newUsersThisMonth = await _context.Users
            .CountAsync(x => x.CreatedAt >= startOfMonth);

        var totalSavedTrips =
            await _context.SavedJourneys.CountAsync();
        var totalNotifications =
            await _context.Notifications.CountAsync();

        return new AdminStatsDto
        {
            TotalUsers = totalUsers,
            AdminUsers = adminUsers,
            NewUsersThisMonth = newUsersThisMonth,
            TotalSavedTrips = totalSavedTrips,
            TotalNotifications = totalNotifications,
            Destinations = 0,
            Recommendations = 0
        };
    }
}
