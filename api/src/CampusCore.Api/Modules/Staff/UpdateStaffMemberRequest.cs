namespace CampusCore.Api.Modules.Staff;

public class UpdateStaffMemberRequest
{
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public DateOnly JoinedOn { get; set; }
}
