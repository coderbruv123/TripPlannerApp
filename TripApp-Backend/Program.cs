
using Microsoft.EntityFrameworkCore;
using TripApp_Backend.Services;
using TripApp_Backend.Data;
using TripApp_Backend.Services.Auth;
using TripApp_Backend.Services.Admin;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// OpenAPI / Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// JWT service
builder.Services.AddScoped<IJwtService, JwtService>();

// Application services
builder.Services.AddHttpClient<IDestinationService, DestinationService>();
builder.Services.AddHttpClient<OpenRouteService>();

builder.Services.AddScoped<ITripPlannerService, TripPlannerService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IFlightService, FlightService>();
builder.Services.AddScoped<IAdminService,AdminService>();
builder.Services.AddHttpClient<IHotelService, HotelService>();
// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Authorization
builder.Services.AddAuthorization();

var app = builder.Build();

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("ReactPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

