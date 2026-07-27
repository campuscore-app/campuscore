namespace CampusCore.Api.Modules.Classes;

/// <summary>One valid (class, section) combination a student can be
/// enrolled into — e.g. "10" / "A". Kept as master data instead of
/// free-typed on each Student record so "10-A" vs "10 A" vs "Class 10 A"
/// can't drift inconsistent across the register.</summary>
public class SchoolClass
{
    public int Id { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
}
