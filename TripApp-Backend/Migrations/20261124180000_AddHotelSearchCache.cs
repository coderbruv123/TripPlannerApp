using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TripApp_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddHotelSearchCache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HotelSearchCache",
                columns: table => new
                {
                    CacheKey = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    PayloadJson = table.Column<string>(type: "TEXT", nullable: false),
                    FetchedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Source = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HotelSearchCache", x => x.CacheKey);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HotelSearchCache");
        }
    }
}
