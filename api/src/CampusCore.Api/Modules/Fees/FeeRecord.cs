using CampusCore.Api.Modules.Students;

namespace CampusCore.Api.Modules.Fees;

public class FeeRecord
{
    public int Id { get; set; }

    /// <summary>References a real enrolled Student — fees are assigned to
    /// an actual student record, never a free-typed name, so this foreign
    /// key can never point at someone who doesn't exist.</summary>
    public int StudentId { get; set; }
    public Student? Student { get; set; }

    /// <summary>Denormalized copies so a fee record still reads sensibly
    /// even if the student's name/class changes later — the receipt for a
    /// payment made in March shouldn't retroactively change if the
    /// student is renamed in June.</summary>
    public string StudentName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;

    public decimal AmountDue { get; set; }
    public decimal AmountPaid { get; set; }
    public DateOnly DueDate { get; set; }

    public List<PaymentEntry> Payments { get; set; } = [];

    // Status (Paid/Pending/Overdue) is deliberately NOT a column here —
    // it's derived from AmountDue/AmountPaid/DueDate in FeeManager, the
    // same way the frontend's deriveStatus() works. Storing it as a
    // trusted column would let it silently go stale the moment a due date passes.
}
