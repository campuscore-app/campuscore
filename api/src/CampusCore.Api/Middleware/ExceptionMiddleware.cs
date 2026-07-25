using System.Text.Json;
using CampusCore.Api.Exceptions;

namespace CampusCore.Api.Middleware;

/// <summary>Catches anything a Manager didn't already turn into a proper
/// ApiResponse (unexpected exceptions — the normal "not found"/"bad
/// request" paths are handled directly by Managers, which return an
/// ApiResponse without throwing) and turns it into the same ApiResponse
/// shape so every response — success or failure — looks the same to the frontend.</summary>
public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    // Reused across every error response instead of allocating a new
    // JsonSerializerOptions per request — the options never change.
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message, errors) = exception switch
        {
            AppValidationException ex => (400, ex.Message, ex.Errors),
            NotFoundException ex => (404, ex.Message, ex.Errors),
            ConflictException ex => (409, ex.Message, ex.Errors),
            AppException ex => (ex.StatusCode, ex.Message, ex.Errors),
            OperationCanceledException => (499, "Request was cancelled", []),
            _ => (500, "Something went wrong. Please try again later.", new List<string>()),
        };

        logger.LogError(
            exception,
            "Exception caught by middleware: {StatusCode} - {ExceptionMessage}",
            statusCode,
            exception.Message
        );

        var response = new Common.ApiResponse<object>
        {
            StatusCode = statusCode,
            Message = message,
            Errors = errors.Count > 0 ? errors : null,
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var json = JsonSerializer.Serialize(response, SerializerOptions);

        await context.Response.WriteAsync(json);
    }
}
