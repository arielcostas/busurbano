using Costasdev.ServiceViewer.Data.Gtfs;
using Costasdev.ServiceViewer.Data.Gtfs.Enums;
using Microsoft.EntityFrameworkCore;

namespace Costasdev.ServiceViewer.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Relación Trip -> StopTimes (cascade delete)
        modelBuilder.Entity<GtfsTrip>()
            .HasMany<GtfsStopTime>()
            .WithOne(st => st.GtfsTrip)
            .HasForeignKey(st => st.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relación Stop -> StopTimes (cascade delete)
        modelBuilder.Entity<GtfsStop>()
            .HasMany<GtfsStopTime>()
            .WithOne(st => st.GtfsStop)
            .HasForeignKey(st => st.StopId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relación Route -> Trips (cascade delete)
        modelBuilder.Entity<GtfsRoute>()
            .HasMany<GtfsTrip>()
            .WithOne(t => t.Route)
            .HasForeignKey(t => t.RouteId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GtfsTrip>()
            .Property(t => t.TripWheelchairAccessible)
            .HasDefaultValue(TripWheelchairAccessible.Empty);

        modelBuilder.Entity<GtfsTrip>()
            .Property(t => t.TripBikesAllowed)
            .HasDefaultValue(TripBikesAllowed.Empty);
    }

    public DbSet<GtfsAgency> Agencies { get; set; }
    public DbSet<GtfsCalendar> Calendars { get; set; }
    public DbSet<GtfsCalendarDate> CalendarDates { get; set; }
    public DbSet<GtfsRoute> Routes { get; set; }
    public DbSet<GtfsStop> Stops { get; set; }
    public DbSet<GtfsStopTime> StopTimes { get; set; }
    public DbSet<GtfsTrip> Trips { get; set; }
}
