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

    public DbSet<Notification> Notifications => Set<Notification>();

    public DbSet<Hotel> Hotels => Set<Hotel>();

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

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Title)
                .IsRequired();

            entity.Property(x => x.Message)
                .IsRequired();

            entity.Property(x => x.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            entity.HasIndex(x => new { x.UserId, x.CreatedAt });

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Hotel>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .IsRequired();

            entity.Property(x => x.EstimatedPricePerNight)
                .HasPrecision(18, 2);

            entity.Property(x => x.City)
                .IsRequired();

            entity.HasIndex(x => new { x.City, x.IsDefault });
        });
    }
}