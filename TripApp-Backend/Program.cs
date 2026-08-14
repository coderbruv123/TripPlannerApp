
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
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
builder.Services.AddSingleton<OpenFlightsService>();

builder.Services.AddScoped<ITripPlannerService, TripPlannerService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IFlightService, FlightService>();
builder.Services.AddScoped<ISavedJourneyService, SavedJourneyService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
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

// JWT Bearer authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            ),

            ValidateLifetime = true
        };
    });

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

SeedDefaultHotels(app.Services);

app.Run();

static void SeedDefaultHotels(IServiceProvider services)
{
    using var scope = services.CreateScope();
    var context = scope.ServiceProvider
        .GetRequiredService<TripApp_Backend.Data.ApplicationDbContext>();

    if (context.Hotels.Any())
        return;

    context.Hotels.AddRange(
        new TripApp_Backend.Models.Hotel
        {
            Name = "Le Grand Hotel Paris",
            Address = "12 Rue de Rivoli, 75004 Paris",
            City = "Paris",
            Latitude = 48.8566,
            Longitude = 2.3522,
            Stars = 5,
            Website = "https://www.legrandhotelparis.example",
            Phone = "+33 1 42 60 30 00",
            EstimatedPricePerNight = 420,
            IsDefault = true
        },
        new TripApp_Backend.Models.Hotel
        {
            Name = "Maison Lumière",
            Address = "45 Boulevard Saint-Germain, 75005 Paris",
            City = "Paris",
            Latitude = 48.8516,
            Longitude = 2.3445,
            Stars = 4,
            Website = "https://www.maisonlumiere.example",
            Phone = "+33 1 44 07 10 00",
            EstimatedPricePerNight = 245,
            IsDefault = true
        },
        new TripApp_Backend.Models.Hotel
        {
            Name = "Hotel du Nord",
            Address = "102 Quai de Jemmapes, 75010 Paris",
            City = "Paris",
            Latitude = 48.8732,
            Longitude = 2.3673,
            Stars = 3,
            Website = "https://www.hoteldunord.example",
            Phone = "+33 1 42 46 08 00",
            EstimatedPricePerNight = 130,
            IsDefault = true
        },
        new TripApp_Backend.Models.Hotel
        {
            Name = "Himalayan View Hotel",
            Address = "Thamel, Kathmandu 44600",
            City = "Kathmandu",
            Latitude = 27.7172,
            Longitude = 85.3240,
            Stars = 4,
            Website = "https://www.himalayanview.example",
            Phone = "+977 1 470 0000",
            EstimatedPricePerNight = 90,
            IsDefault = true
        },
        new TripApp_Backend.Models.Hotel
        {
            Name = "Kathmandu Boutique Inn",
            Address = "Lazimpat, Kathmandu 44600",
            City = "Kathmandu",
            Latitude = 27.7182,
            Longitude = 85.3200,
            Stars = 3,
            Website = "https://www.kathmanduboutique.example",
            Phone = "+977 1 442 5000",
            EstimatedPricePerNight = 55,
            IsDefault = true
        }
    );

    context.SaveChanges();
}

