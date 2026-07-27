using CampusCore.Api.Common;
using CampusCore.Api.Common.Utility;
using CampusCore.Api.Modules.School;
using FluentValidation;

namespace CampusCore.Api.Modules.Auth;

public interface IAuthManager
{
    Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> IsSetupRequiredAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<LoginResponse>> SetupAsync(SetupRequest request, CancellationToken cancellationToken = default);
}

public class AuthManager(
    IUserRepository userRepository,
    ISchoolInfoRepository schoolInfoRepository,
    IJwtTokenService tokenService,
    IValidator<LoginRequest> loginValidator,
    IValidator<SetupRequest> setupValidator,
    IApiResponseBuilder response
) : IAuthManager
{
    public async Task<ApiResponse<LoginResponse>> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var validation = await loginValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return response.BadRequest<LoginResponse>(
                null,
                validation.Errors.First().ErrorMessage,
                validation.Errors.Select(e => e.ErrorMessage).ToList()
            );
        }

        var user = await userRepository.GetByEmailAsync(request.Email.ToLower(), cancellationToken);

        // Deliberately the same message whether the email doesn't exist or
        // the password is wrong — telling an attacker "that email isn't
        // registered" is an account-enumeration leak.
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return response.BadRequest<LoginResponse>(null, "Invalid email or password.");
        }

        // Fetched fresh on every login (rather than cached in the token)
        // so a school name change is reflected immediately without
        // forcing every signed-in user to log out and back in.
        var school = await schoolInfoRepository.GetAsync(cancellationToken);

        var token = tokenService.GenerateToken(user);
        return response.Ok(new LoginResponse { Token = token, Email = user.Email, SchoolName = school?.Name ?? string.Empty });
    }

    /// <summary>True until the very first admin account is created. The
    /// frontend uses this to decide whether to show the setup wizard or
    /// the normal login form.</summary>
    public async Task<ApiResponse<bool>> IsSetupRequiredAsync(CancellationToken cancellationToken = default)
    {
        var anyUsersExist = await userRepository.AnyAsync(cancellationToken);
        return response.Ok(!anyUsersExist);
    }

    public async Task<ApiResponse<LoginResponse>> SetupAsync(
        SetupRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var validation = await setupValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return response.BadRequest<LoginResponse>(
                null,
                validation.Errors.First().ErrorMessage,
                validation.Errors.Select(e => e.ErrorMessage).ToList()
            );
        }

        // The whole point of this endpoint is "create the one and only
        // first admin" — refuse outright once that's already happened,
        // rather than letting it be called again to add more accounts.
        // That's what a real (future, paid-tier) multi-user invite flow is for.
        if (await userRepository.AnyAsync(cancellationToken))
        {
            return response.Conflict<LoginResponse>("Setup has already been completed for this installation.");
        }

        var user = await userRepository.CreateAsync(
            new User
            {
                Email = request.Email.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            },
            cancellationToken
        );

        var school = await schoolInfoRepository.CreateAsync(
            new SchoolInfo { Name = request.SchoolName },
            cancellationToken
        );

        // Log the school straight in after setup — asking them to fill out
        // the same email/password a second time on the login screen would
        // be a pointless extra step right after they just typed it.
        var token = tokenService.GenerateToken(user);
        return response.Created(
            new LoginResponse { Token = token, Email = user.Email, SchoolName = school.Name },
            "Admin account created"
        );
    }
}
