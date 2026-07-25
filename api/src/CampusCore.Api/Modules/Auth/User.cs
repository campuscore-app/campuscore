namespace CampusCore.Api.Modules.Auth;

/// <summary>A login account. Free tier only ever has one of these (the
/// single admin login) — multi-role support is a paid-tier feature that
/// will extend this later, not something to build speculatively now.</summary>
public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
}
