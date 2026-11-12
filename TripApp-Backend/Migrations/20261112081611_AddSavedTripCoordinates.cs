using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TripApp_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSavedTripCoordinates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "DestinationLat",
                table: "SavedTrips",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "DestinationLng",
                table: "SavedTrips",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "OriginLat",
                table: "SavedTrips",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "OriginLng",
                table: "SavedTrips",
                type: "REAL",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DestinationLat",
                table: "SavedTrips");

            migrationBuilder.DropColumn(
                name: "DestinationLng",
                table: "SavedTrips");

            migrationBuilder.DropColumn(
                name: "OriginLat",
                table: "SavedTrips");

            migrationBuilder.DropColumn(
                name: "OriginLng",
                table: "SavedTrips");
        }
    }
}
