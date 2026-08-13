using Microsoft.EntityFrameworkCore;
using TripApp_Backend.Models;

namespace TripApp_Backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<SavedJourney> SavedJourneys => Set<SavedJourney>();

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

        modelBuilder.Entity<SavedJourney>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.JourneyJson)
                .IsRequired();

            entity.Property(x => x.EstimatedPrice)
                .HasPrecision(18, 2);

            entity.Property(x => x.SavedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}