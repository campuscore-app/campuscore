namespace CampusCore.Api.Modules.Attendance;

/// <summary>One row of a class roster being marked in bulk — no Date
/// field, since the whole batch is marked for one date (see
/// BulkAttendanceRequest.Date), matching TakeAttendanceView.tsx on the frontend.</summary>
public class BulkAttendanceEntry
{
    public string StudentName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public AttendanceStatus Status { get; set; }
}

public class BulkAttendanceRequest
{
    public DateOnly Date { get; set; }
    public List<BulkAttendanceEntry> Entries { get; set; } = [];
}

/// <summary>Mirrors the toast message AttendancePage.tsx builds after a
/// bulk save: how many records were newly created, how many existing
/// today's-records were updated, and how many were left untouched because
/// they belong to a past date (same-day-edit-lock).</summary>
public class BulkAttendanceResult
{
    public int Created { get; set; }
    public int Updated { get; set; }
    public int Locked { get; set; }
}
