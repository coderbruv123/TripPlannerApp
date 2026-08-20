using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TripApp_Backend.Services;
using TripApp_Backend.Dtos;
using TripApp_Backend.Services.Auth;
namespace TripApp_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto request)
    {
        var result = await _authService.LoginAsync(request);

        if (result == null)
            return Unauthorized();

        if (!result.Success)
            return StatusCode(403, result);

        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] SignupDto request)
    {
        var result = await _authService.SignupAsync(request);

        if (result == null || !result.Success)
            return BadRequest(result ?? new SignupResultDto
            {
                Success = false,
                Message = "User registration failed"
            });

        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = CurrentUserId();
        if (userId == null) return Unauthorized();

        var user = await _authService.GetUserByIdAsync(userId.Value);
        if (user == null) return NotFound();

        return Ok(user);
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
    {
        var userId = CurrentUserId();
        if (userId == null) return Unauthorized();

        var result = await _authService.ChangePasswordAsync(userId.Value, request);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [Authorize]
    [HttpPut("update-profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
    {
        var userId = CurrentUserId();
        if (userId == null) return Unauthorized();

        var result = await _authService.UpdateProfileAsync(userId.Value, request);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    private Guid? CurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
