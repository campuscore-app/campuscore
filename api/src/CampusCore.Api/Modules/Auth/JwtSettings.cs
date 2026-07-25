namespace CampusCore.Api.Modules.Auth;

/// <summary>Bound from the "Jwt" section of appsettings.json / environment variables — see Program.cs.</summary>
public class JwtSettings
{
    public string SigningKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 60 * 12;
}
