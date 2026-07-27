using CampusCore.Api.Common;
using CampusCore.Api.Common.Utility;
using FluentValidation;

namespace CampusCore.Api.Modules.Classes;

public interface ISchoolClassManager
{
    Task<ApiResponse<List<SchoolClassResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<SchoolClassResponse>> CreateAsync(
        CreateSchoolClassRequest request,
        CancellationToken cancellationToken = default
    );
    Task<ApiResponse<object>> DeleteAsync(int id, CancellationToken cancellationToken = default);
}

public class SchoolClassManager(
    ISchoolClassRepository repository,
    IValidator<CreateSchoolClassRequest> createValidator,
    IApiResponseBuilder response
) : ISchoolClassManager
{
    public async Task<ApiResponse<List<SchoolClassResponse>>> GetAllAsync(
        CancellationToken cancellationToken = default
    )
    {
        var classes = await repository.GetAllAsync(cancellationToken);
        return response.Ok(classes.Select(MapToResponse).ToList());
    }

    public async Task<ApiResponse<SchoolClassResponse>> CreateAsync(
        CreateSchoolClassRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var validation = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return response.BadRequest<SchoolClassResponse>(
                null,
                validation.Errors.First().ErrorMessage,
                validation.Errors.Select(e => e.ErrorMessage).ToList()
            );
        }

        if (await repository.ExistsAsync(request.ClassName, request.Section, cancellationToken))
        {
            return response.BadRequest<SchoolClassResponse>(null, "This class and section already exists.");
        }

        var created = await repository.CreateAsync(
            new SchoolClass { ClassName = request.ClassName, Section = request.Section },
            cancellationToken
        );
        return response.Created(MapToResponse(created));
    }

    public async Task<ApiResponse<object>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var existing = await repository.GetByIdAsync(id, cancellationToken);
        if (existing is null)
            return response.NotFound<object>("Class not found.");

        await repository.DeleteAsync(id, cancellationToken);
        return response.Ok<object>(null, "Class removed");
    }

    private static SchoolClassResponse MapToResponse(SchoolClass c) =>
        new()
        {
            Id = c.Id,
            ClassName = c.ClassName,
            Section = c.Section,
        };
}
