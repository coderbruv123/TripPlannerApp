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

        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] SignupDto request)
    {
        var result = await _authService.SignupAsync(request);

        if (result == null)
            return BadRequest("User registration failed");

        return Ok(result);
    }
    
    
}

