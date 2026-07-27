namespace CampusCore.Api.Modules.Auth;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SchoolName { get; set; } = string.Empty;
}
