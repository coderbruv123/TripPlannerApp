using Microsoft.EntityFrameworkCore;

namespace TripApp_Backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(x => x.Role)
                .HasConversion<int>()
                .HasDefaultValue(UserRole.User);

            entity.HasIndex(x => x.Email)
                .IsUnique();

            entity.HasIndex(x => x.Username)
                .IsUnique();
        });
    }
}