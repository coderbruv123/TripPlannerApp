using Microsoft.EntityFrameworkCore;
using TripApp_Backend.Services;
using TripApp_Backend.Data;
using TripApp_Backend.Services.Auth;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddHttpClient<IDestinationService, DestinationService>();
builder.Services.AddHttpClient<OpenRouteService>();
builder.Services.AddScoped<ITripPlannerService,
    TripPlannerService>();
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IFlightService, FlightService>();
// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173", // Vite
                "http://localhost:3000"  // Create React App
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
            // .AllowCredentials(); // Uncomment if using cookies/authentication
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Use CORS BEFORE Authorization and MapControllers
app.UseCors("ReactPolicy");

app.UseAuthorization();

app.MapControllers();

app.Run();