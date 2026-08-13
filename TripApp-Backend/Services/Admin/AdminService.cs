using Azure;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using TripApp_Backend.Data;

namespace TripApp_Backend.Services.Admin;

public class AdminService : IAdminService
{
    private readonly ApplicationDbContext _context;

    public AdminService(ApplicationDbContext context)
    {
        _context= context;
    }
    public Task<List<User>> AllUsersAsnc(

    )
    {
        var user = _context.Users.ToListAsync();
         
         return user;
        
    }

    public Task<User?> SearchUser(string name)
    {
        var user = _context.Users.FirstOrDefaultAsync(x=>x.Username == name);
       
        return user;
    }
}