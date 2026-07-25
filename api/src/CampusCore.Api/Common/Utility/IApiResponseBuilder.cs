namespace CampusCore.Api.Common.Utility;

public interface IApiResponseBuilder
{
    ApiResponse<T> Ok<T>(T? data, string? message = null);
    ApiResponse<T> Created<T>(T? data, string? message = null);
    ApiResponse<T> NoContent<T>(string? message = null);
    ApiResponse<T> NotFound<T>(string? message = null);
    ApiResponse<T> BadRequest<T>(T? data, string? message = null, List<string>? errors = null);
    ApiResponse<T> Conflict<T>(string? message = null);
    ApiResponse<T> InternalServerError<T>(string? message = null, List<string>? errors = null);
}
