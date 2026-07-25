namespace CampusCore.Api.Modules.Fees;

public enum FeeStatus
{
    Paid,
    Pending,
    Overdue,
}

public class FeeRecordResponse
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public decimal AmountDue { get; set; }
    public decimal AmountPaid { get; set; }
    public DateOnly DueDate { get; set; }
    public FeeStatus Status { get; set; }
}
