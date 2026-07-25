namespace CampusCore.Api.Exceptions;

/// <summary>Safety-net exceptions only. The normal "not found"/"conflict"/
/// "bad request" paths are handled directly in Managers, which return an
/// ApiResponse with the right status code — they don't throw. These exist
/// for genuinely exceptional situations that should still map to a clean
/// HTTP status instead of a raw 500, caught by ExceptionMiddleware.</summary>
public class AppException : Exception
{
    public int StatusCode { get; }
    public List<string> Errors { get; }

    public AppException(string message, int statusCode = 500, List<string>? errors = null)
        : base(message)
    {
        StatusCode = statusCode;
        Errors = errors ?? [];
    }
}

public class NotFoundException(string message) : AppException(message, 404);

public class ConflictException(string message) : AppException(message, 409);

public class AppValidationException(string message, List<string>? errors = null)
    : AppException(message, 400, errors);
