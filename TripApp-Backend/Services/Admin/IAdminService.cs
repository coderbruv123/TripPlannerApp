using TripApp_Backend.Dtos;

namespace TripApp_Backend.Services.Admin;

public interface IAdminService
{
   Task<List<AdminUserDto>> AllUsersAsync();
   Task<AdminUserDto?> SearchUser(string name);
   Task<AdminStatsDto> GetStatsAsync();
}
