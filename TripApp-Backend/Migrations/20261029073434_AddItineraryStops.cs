using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TripApp_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddItineraryStops : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ItineraryStops",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    SavedTripId = table.Column<Guid>(type: "TEXT", nullable: false),
                    DayIndex = table.Column<int>(type: "INTEGER", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Country = table.Column<string>(type: "TEXT", nullable: false),
                    Latitude = table.Column<double>(type: "REAL", nullable: false),
                    Longitude = table.Column<double>(type: "REAL", nullable: false),
                    Kind = table.Column<string>(type: "TEXT", nullable: false),
                    PlannedStart = table.Column<string>(type: "TEXT", nullable: true),
                    PlannedEnd = table.Column<string>(type: "TEXT", nullable: true),
                    OpeningHours = table.Column<string>(type: "TEXT", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItineraryStops", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItineraryStops_SavedTrips_SavedTripId",
                        column: x => x.SavedTripId,
                        principalTable: "SavedTrips",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ItineraryStops_SavedTripId",
                table: "ItineraryStops",
                column: "SavedTripId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItineraryStops");
        }
    }
}
