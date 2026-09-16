using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TripApp_Backend.Dtos;
using TripApp_Backend.Services.Admin;
namespace TripApp_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var result = await _adminService.AllUsersAsync();
        return Ok(result);
    }

    [HttpGet("users/search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string? query)
    {
        var result = await _adminService.SearchUsersAsync(query);
        return Ok(result);
    }

    [HttpGet("users/{id:guid}")]
    public async Task<IActionResult> GetUser(Guid id)
    {
        var result = await _adminService.GetUserByIdAsync(id);
        if (result == null) return NotFound("User not found.");

        return Ok(result);
    }

    [Authorize(Policy = "SuperAdminOnly")]
    [HttpPut("users/{id:guid}/role")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateUserRoleDto request)
    {
        var result = await _adminService.UpdateUserRoleAsync(id, request.Role, CurrentUserId());

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPut("users/{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] SetUserStatusDto request)
    {
        var result = await _adminService.SetUserStatusAsync(id, request.IsActive, CurrentUserId());

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var result = await _adminService.DeleteUserAsync(id, CurrentUserId());

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var result = await _adminService.GetStatsAsync();
        return Ok(result);
    }

    private Guid? CurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
