
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TripApp_Backend.Configuration;
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

// Database — local dev runs on SQLite (no server to install); set
// Database:Provider=SqlServer (or Database__Provider env var) for SQL Server.
var databaseProvider =
    builder.Configuration["Database:Provider"] ?? "Sqlite";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (databaseProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection")
        );
    }
    else
    {
        options.UseSqlite(
            builder.Configuration.GetConnectionString("Sqlite")
            ?? "Data Source=tripplanner.db"
        );
    }
});

// JWT service + settings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddScoped<IJwtService, JwtService>();

var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()
    ?? throw new InvalidOperationException("JWT settings are missing.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings.Key)
            )
        };
    });

// Application services
builder.Services
    .AddHttpClient<IDestinationService, DestinationService>(client =>
    {
        // The service gives up at 8s itself; this is the outer safety net so a
        // stalled connection can never hang the city picker.
        client.Timeout = TimeSpan.FromSeconds(15);
    });
builder.Services.AddHttpClient<OpenRouteService>(client =>
{
    client.BaseAddress = new Uri("https://router.project-osrm.org/");
    client.Timeout = TimeSpan.FromSeconds(20);
    // OSRM's public demo rejects requests with an empty User-Agent (403).
    client.DefaultRequestHeaders.UserAgent.ParseAdd("TripPlannerApp/1.0");
});

builder.Services.AddScoped<ITripPlannerService, TripPlannerService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHttpClient<IAirportLookupService, AirportLookupService>();
builder.Services.AddScoped<IFlightService, FlightService>();
builder.Services.AddScoped<IAdminService,AdminService>();
builder.Services.AddScoped<ISavedTripService, SavedTripService>();
builder.Services.AddScoped<ITripItineraryService, ItineraryService>();
builder.Services.AddScoped<IBudgetService, BudgetService>();
builder.Services.AddHttpClient<IHotelService, HotelService>();
// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        // Dev: allow any origin so Expo Go/tunnels/physical devices work without CORS friction.
        // Production should restrict origins explicitly.
        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(_ => true)
                .AllowAnyHeader()
                .AllowAnyMethod();
            return;
        }

        // Dev origins: loopback on any port (vite picks 5173/5174/4173) plus
        // the machine's own LAN address, so opening the site as 127.0.0.1 or
        // from a phone doesn't fail with an opaque "Unable to sign in".
        policy
            .SetIsOriginAllowed(origin =>
            {
                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                {
                    return false;
                }

                var host = uri.Host;

                return host is "localhost" or "127.0.0.1" or "::1"
                    || host.StartsWith("192.168.")
                    || host.StartsWith("10.")
                    || System.Net.IPAddress.TryParse(host, out var address)
                       && address.IsIPv4MappedToIPv6 == false
                       && System.Net.IPAddress.IsLoopback(address);
            })
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Authorization
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole(
            UserRole.Admin.ToString(),
            UserRole.SuperAdmin.ToString()));

    options.AddPolicy("SuperAdminOnly", policy =>
        policy.RequireRole(UserRole.SuperAdmin.ToString()));
});

var app = builder.Build();

// Create the schema (SQLite: from the models; SQL Server: from migrations)
// and make sure the seeded super admin exists.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    if (db.Database.IsSqlite())
    {
        db.Database.EnsureCreated();

        // EnsureCreated only builds the schema for a brand-new file. Older dev
        // databases already exist, so add the budget table idempotently here.
        db.Database.ExecuteSqlRaw("""
            CREATE TABLE IF NOT EXISTS "BudgetBreakdown" (
                "SavedTripId" TEXT NOT NULL,
                "Category" TEXT NOT NULL,
                "Amount" TEXT NOT NULL,
                CONSTRAINT "PK_BudgetBreakdown" PRIMARY KEY ("SavedTripId", "Category"),
                CONSTRAINT "FK_BudgetBreakdown_SavedTrips_SavedTripId"
                    FOREIGN KEY ("SavedTripId") REFERENCES "SavedTrips" ("Id") ON DELETE CASCADE
            );
            """);

        db.Database.ExecuteSqlRaw("""
            CREATE TABLE IF NOT EXISTS "HotelSearchCache" (
                "CacheKey" TEXT NOT NULL CONSTRAINT "PK_HotelSearchCache" PRIMARY KEY,
                "PayloadJson" TEXT NOT NULL,
                "FetchedAtUtc" TEXT NOT NULL,
                "Source" TEXT NULL
            );
            """);
    }
    else
    {
        db.Database.Migrate();
    }

    await DbSeeder.SeedAsync(scope.ServiceProvider, app.Logger);
}

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

