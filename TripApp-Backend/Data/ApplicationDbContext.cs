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

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<SavedTrip> SavedTrips => Set<SavedTrip>();

    public DbSet<ItineraryStop> ItineraryStops => Set<ItineraryStop>();

    public DbSet<BudgetBreakdown> BudgetBreakdowns => Set<BudgetBreakdown>();

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

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(x => x.Token)
                .IsUnique();

            entity.Property(x => x.Token)
                .HasMaxLength(256);

            entity.HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ItineraryStop>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne<SavedTrip>()
                .WithMany(trip => trip.ItineraryStops)
                .HasForeignKey(stop => stop.SavedTripId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(stop => stop.SavedTripId);
        });

        modelBuilder.Entity<BudgetBreakdown>(entity =>
        {
            entity.ToTable("BudgetBreakdown");

            // One row per fixed category per trip; upserts key off both.
            entity.HasKey(b => new { b.SavedTripId, b.Category });

            entity.HasOne(b => b.SavedTrip)
                .WithMany(trip => trip.BudgetBreakdowns)
                .HasForeignKey(b => b.SavedTripId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(b => b.Category).HasMaxLength(64);
        });
    }
}