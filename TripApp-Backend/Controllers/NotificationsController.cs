using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TripApp_Backend.Services;

namespace TripApp_Backend.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var userId = GetUserId();

        if (userId == null)
            return Unauthorized();

        var notifications =
            await _notificationService.ListByUserAsync(userId.Value);

        var unread =
            await _notificationService.CountUnreadAsync(userId.Value);

        var items = notifications.Select(n => new
        {
            n.Id,
            n.Title,
            n.Message,
            n.IsRead,
            n.CreatedAt
        });

        return Ok(new { unread, items });
    }

    [HttpPost("read")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = GetUserId();

        if (userId == null)
            return Unauthorized();

        await _notificationService.MarkAllReadAsync(userId.Value);

        return NoContent();
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (string.IsNullOrWhiteSpace(sub))
            sub = User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
