using TripApp_Backend.Models;

namespace TripApp_Backend.Services;

public interface INotificationService
{
    Task<List<Notification>> ListByUserAsync(
        Guid userId,
        int limit = 10);

    Task<int> CountUnreadAsync(Guid userId);

    Task<Notification> CreateAsync(
        Guid userId,
        string title,
        string message);

    Task MarkAllReadAsync(Guid userId);
}
