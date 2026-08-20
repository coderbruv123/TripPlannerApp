namespace TripApp_Backend.Dtos;

public class AdminStatsDto
{
    public int TotalUsers { get; set; }

    public int AdminUsers { get; set; }

    public int NewUsersThisMonth { get; set; }

    public int TotalSavedTrips { get; set; }

    public int TotalNotifications { get; set; }

    public int Destinations { get; set; }

    public int Recommendations { get; set; }
}
