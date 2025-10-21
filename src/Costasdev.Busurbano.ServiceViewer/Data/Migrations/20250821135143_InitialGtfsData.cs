using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Costasdev.Busurbano.Database.Migrations
{
    /// <inheritdoc />
    public partial class InitialGtfsData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "agencies",
                columns: table => new
                {
                    agency_id = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false),
                    agency_name = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false),
                    agency_url = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false),
                    agency_timezone = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    agency_lang = table.Column<string>(type: "varchar(5)", maxLength: 5, nullable: false),
                    agency_phone = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: true),
                    agency_email = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true),
                    agency_fare_url = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agencies", x => x.agency_id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "calendar",
                columns: table => new
                {
                    service_id = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false),
                    monday = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    tuesday = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    wednesday = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    thursday = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    friday = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    saturday = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    sunday = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_calendar", x => x.service_id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "calendar_dates",
                columns: table => new
                {
                    service_id = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false),
                    date = table.Column<DateOnly>(type: "date", nullable: false),
                    exception_type = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_calendar_dates", x => new { x.service_id, x.date });
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "stops",
                columns: table => new
                {
                    stop_id = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false),
                    stop_code = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false),
                    stop_name = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false),
                    stop_desc = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true),
                    stop_lat = table.Column<double>(type: "double", nullable: false),
                    stop_lon = table.Column<double>(type: "double", nullable: false),
                    stop_url = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true),
                    stop_timezone = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true),
                    wheelchair_boarding = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stops", x => x.stop_id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "routes",
                columns: table => new
                {
                    route_id = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false),
                    agency_id = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false),
                    route_short_name = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false),
                    route_long_name = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false),
                    route_desc = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true),
                    route_type = table.Column<int>(type: "int", nullable: false),
                    route_url = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true),
                    route_color = table.Column<string>(type: "varchar(7)", maxLength: 7, nullable: true),
                    route_text_color = table.Column<string>(type: "varchar(7)", maxLength: 7, nullable: true),
                    route_sort_order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_routes", x => x.route_id);
                    table.ForeignKey(
                        name: "FK_routes_agencies_agency_id",
                        column: x => x.agency_id,
                        principalTable: "agencies",
                        principalColumn: "agency_id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "trips",
                columns: table => new
                {
                    trip_id = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false),
                    route_id = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false),
                    service_id = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false),
                    trip_headsign = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true),
                    trip_short_name = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true),
                    direction_id = table.Column<int>(type: "int", nullable: false),
                    block_id = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: true),
                    shape_id = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: true),
                    trip_wheelchair_accessible = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    trip_bikes_allowed = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trips", x => x.trip_id);
                    table.ForeignKey(
                        name: "FK_trips_routes_route_id",
                        column: x => x.route_id,
                        principalTable: "routes",
                        principalColumn: "route_id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "stop_times",
                columns: table => new
                {
                    trip_id = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false),
                    stop_sequence = table.Column<int>(type: "int", nullable: false),
                    arrival_time = table.Column<TimeOnly>(type: "varchar(8)", maxLength: 8, nullable: false),
                    departure_time = table.Column<TimeOnly>(type: "varchar(8)", maxLength: 8, nullable: false),
                    stop_id = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false),
                    shape_dist_traveled = table.Column<double>(type: "double", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stop_times", x => new { x.trip_id, x.stop_sequence });
                    table.ForeignKey(
                        name: "FK_stop_times_stops_stop_id",
                        column: x => x.stop_id,
                        principalTable: "stops",
                        principalColumn: "stop_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_stop_times_trips_trip_id",
                        column: x => x.trip_id,
                        principalTable: "trips",
                        principalColumn: "trip_id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_routes_agency_id",
                table: "routes",
                column: "agency_id");

            migrationBuilder.CreateIndex(
                name: "IX_stop_times_stop_id",
                table: "stop_times",
                column: "stop_id");

            migrationBuilder.CreateIndex(
                name: "IX_trips_route_id",
                table: "trips",
                column: "route_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "calendar");

            migrationBuilder.DropTable(
                name: "calendar_dates");

            migrationBuilder.DropTable(
                name: "stop_times");

            migrationBuilder.DropTable(
                name: "stops");

            migrationBuilder.DropTable(
                name: "trips");

            migrationBuilder.DropTable(
                name: "routes");

            migrationBuilder.DropTable(
                name: "agencies");
        }
    }
}
