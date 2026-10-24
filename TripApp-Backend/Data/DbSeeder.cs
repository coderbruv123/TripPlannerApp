using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TripApp_Backend.Models;

namespace TripApp_Backend.Data;

/// <summary>
/// Seeds the account the app needs before anyone can log in as an
/// administrator. Runs on every start; it only writes when something
/// is missing, so it is safe to leave enabled.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services, ILogger logger)
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        var config = services.GetRequiredService<IConfiguration>();

        var username = config["Seed:SuperAdmin:Username"] ?? "Super Admin";
        var email = (config["Seed:SuperAdmin:Email"] ?? "superadmin@tripplanner.local")
            .Trim()
            .ToLowerInvariant();
        var password = config["Seed:SuperAdmin:Password"] ?? "SuperAdmin123!";

        var existing = await db.Users.FirstOrDefaultAsync(user => user.Email == email);

        if (existing is null)
        {
            var hasher = new PasswordHasher<User>();

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = username,
                Email = email,
                Role = UserRole.SuperAdmin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            user.PasswordHash = hasher.HashPassword(user, password);

            db.Users.Add(user);
            await db.SaveChangesAsync();

            logger.LogInformation(
                "Seeded super admin {Email} (role {Role})",
                email,
                UserRole.SuperAdmin
            );

            return;
        }

        var changed = false;

        if (existing.Role != UserRole.SuperAdmin)
        {
            existing.Role = UserRole.SuperAdmin;
            changed = true;
        }

        if (!existing.IsActive)
        {
            existing.IsActive = true;
            changed = true;
        }

        if (existing.Username != username)
        {
            existing.Username = username;
            changed = true;
        }

        if (changed)
        {
            existing.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            logger.LogInformation("Updated {Email} to an active super admin", email);
        }
    }
}
