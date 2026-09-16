using TripApp_Backend.Dtos;

namespace TripApp_Backend.Services.Admin;

public interface IAdminService
{
   Task<List<UserDto>> AllUsersAsync();
   Task<List<UserDto>> SearchUsersAsync(string? query);
   Task<UserDto?> GetUserByIdAsync(Guid id);
   Task<AdminResultDto> UpdateUserRoleAsync(Guid id, string role, Guid? actorId);
   Task<AdminResultDto> SetUserStatusAsync(Guid id, bool isActive, Guid? actorId);
   Task<AdminResultDto> DeleteUserAsync(Guid id, Guid? actorId);
   Task<AdminStatsDto> GetStatsAsync();
}
