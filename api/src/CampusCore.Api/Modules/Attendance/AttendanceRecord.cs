namespace CampusCore.Api.Modules.Attendance;

public enum AttendanceStatus
{
    Present,
    Absent,
    Late,
}

public class AttendanceRecord
{
    public int Id { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public AttendanceStatus Status { get; set; }
}
