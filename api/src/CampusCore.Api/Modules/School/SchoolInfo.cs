namespace CampusCore.Api.Modules.School;

/// <summary>The one school this installation serves. Kept as its own
/// entity rather than a field on User: multi-role logins (Teacher /
/// Accountant / Front Office — a planned paid-tier feature) will mean
/// multiple User rows per install, and school-level data shouldn't live
/// on any one of them. Named SchoolInfo, not School, so the type name
/// doesn't collide with the Modules.School namespace segment.</summary>
public class SchoolInfo
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
