using Microsoft.AspNetCore.Mvc;
using TripApp_Backend.Services;
using TripApp_Backend.Dtos;
using TripApp_Backend.Services.Auth;
using TripApp_Backend.Services.Admin;
namespace TripApp_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
     private readonly AdminService _adminService;
     public AdminController(
        AdminService adminService
     )
    {
      _adminService=  adminService ;
    }

   [HttpGet("GetUsers")]
   public async Task<IActionResult> GetUsers()
    {
        var result = _adminService.AllUsersAsnc();
        return Ok( result);
    }

    [HttpGet("GetUser")]
    public async Task<IActionResult>GetUser([FromBody]string name)
    {
        var result = _adminService.SearchUser(name);
        return Ok(result);
    }

}