namespace CampusCore.Api.Modules.Attendance;

public class UpdateAttendanceRecordRequest
{
    public string StudentName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public AttendanceStatus Status { get; set; }
}
