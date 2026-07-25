namespace CampusCore.Api.Modules.Students;

public class Student
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string GuardianName { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
}
