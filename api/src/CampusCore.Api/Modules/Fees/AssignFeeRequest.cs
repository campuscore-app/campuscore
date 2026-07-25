namespace CampusCore.Api.Modules.Fees;

/// <summary>The student is a real reference (StudentId), never a
/// free-typed name; StudentName/ClassName are looked up server-side from
/// that id rather than trusted from the client. Mirrors AddFeeForm.tsx.</summary>
public class AssignFeeRequest
{
    public int StudentId { get; set; }
    public decimal AmountDue { get; set; }
    public DateOnly DueDate { get; set; }
}
