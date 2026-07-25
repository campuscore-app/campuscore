using Microsoft.AspNetCore.Mvc;

namespace CampusCore.Api.Modules.Auth;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthManager authManager) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var response = await authManager.LoginAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    /// <summary>The frontend calls this before showing Login — if it
    /// returns true, no admin account exists yet and the user should see
    /// the setup wizard instead.</summary>
    [HttpGet("setup-required")]
    public async Task<IActionResult> IsSetupRequired(CancellationToken cancellationToken)
    {
        var response = await authManager.IsSetupRequiredAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("setup")]
    public async Task<IActionResult> Setup(SetupRequest request, CancellationToken cancellationToken)
    {
        var response = await authManager.SetupAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
