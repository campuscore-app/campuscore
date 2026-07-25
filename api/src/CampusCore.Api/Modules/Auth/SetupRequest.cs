namespace CampusCore.Api.Modules.Auth;

/// <summary>Creates the very first admin account on a fresh install — see
/// AuthManager.SetupAsync, which refuses to run this a second time once
/// any user already exists. This is what replaces a hardcoded seeded
/// default password: the school picks their own credentials the first
/// time they open the app, in the browser, no config file or server log required.</summary>
public class SetupRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}
