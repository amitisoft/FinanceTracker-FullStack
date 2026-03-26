using System.ComponentModel.DataAnnotations;

namespace FinanceTracker.Application.Reports.Queries;

public class GetTrendsReportQuery
{
    [Required]
    public DateTime DateFrom { get; set; }

    [Required]
    public DateTime DateTo { get; set; }

    public Guid? AccountId { get; set; }
}
