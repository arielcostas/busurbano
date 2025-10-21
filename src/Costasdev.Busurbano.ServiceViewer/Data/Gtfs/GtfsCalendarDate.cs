using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Costasdev.ServiceViewer.Data.Gtfs.Enums;
using Microsoft.EntityFrameworkCore;

namespace Costasdev.ServiceViewer.Data.Gtfs;

[Table("calendar_dates")]
[PrimaryKey(nameof(ServiceId), nameof(Date))]
public class GtfsCalendarDate
{
    [Column("service_id")]
    [MaxLength(32)]
    public required string ServiceId { get; set; }

    [Column("date")]
    public required DateTime Date { get; set; }

    [Column("exception_type")]
    public required ExceptionType ExceptionType { get; set; }
}
