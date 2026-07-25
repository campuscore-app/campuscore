namespace CampusCore.Api.Common;

/// <summary>The envelope every endpoint returns, success or failure, so
/// the frontend always parses the same shape. Built via
/// IApiResponseBuilder, not constructed directly by Managers.</summary>
public class ApiResponse<T>
{
    public int StatusCode { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }
}
