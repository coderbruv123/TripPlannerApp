namespace TripApp_Backend.Services.Admin;

public interface IAdminService
{
   Task<List<User>> AllUsersAsnc();
   Task<User?> SearchUser(string name);
    
}