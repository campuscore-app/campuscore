using CampusCore.Api.Common;
using CampusCore.Api.Common.Utility;
using FluentValidation;

namespace CampusCore.Api.Modules.Staff;

public interface IStaffManager
{
    Task<ApiResponse<List<StaffMemberResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<StaffMemberResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<StaffMemberResponse>> CreateAsync(
        CreateStaffMemberRequest request,
        CancellationToken cancellationToken = default
    );
    Task<ApiResponse<StaffMemberResponse>> UpdateAsync(
        int id,
        UpdateStaffMemberRequest request,
        CancellationToken cancellationToken = default
    );
    Task<ApiResponse<object>> DeleteAsync(int id, CancellationToken cancellationToken = default);
}

public class StaffManager(
    IStaffRepository staffRepository,
    IValidator<CreateStaffMemberRequest> createValidator,
    IValidator<UpdateStaffMemberRequest> updateValidator,
    IApiResponseBuilder response
) : IStaffManager
{
    public async Task<ApiResponse<List<StaffMemberResponse>>> GetAllAsync(
        CancellationToken cancellationToken = default
    )
    {
        var staff = await staffRepository.GetAllAsync(cancellationToken);
        return response.Ok(staff.Select(MapToResponse).ToList());
    }

    public async Task<ApiResponse<StaffMemberResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default
    )
    {
        var staff = await staffRepository.GetByIdAsync(id, cancellationToken);
        if (staff is null)
            return response.NotFound<StaffMemberResponse>("Staff member not found.");

        return response.Ok(MapToResponse(staff));
    }

    public async Task<ApiResponse<StaffMemberResponse>> CreateAsync(
        CreateStaffMemberRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var validation = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return response.BadRequest<StaffMemberResponse>(
                null,
                validation.Errors.First().ErrorMessage,
                validation.Errors.Select(e => e.ErrorMessage).ToList()
            );
        }

        var staff = new StaffMember
        {
            Name = request.Name,
            Role = request.Role,
            Department = request.Department,
            Contact = request.Contact,
            JoinedOn = request.JoinedOn,
        };

        var created = await staffRepository.CreateAsync(staff, cancellationToken);
        return response.Created(MapToResponse(created));
    }

    public async Task<ApiResponse<StaffMemberResponse>> UpdateAsync(
        int id,
        UpdateStaffMemberRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var validation = await updateValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return response.BadRequest<StaffMemberResponse>(
                null,
                validation.Errors.First().ErrorMessage,
                validation.Errors.Select(e => e.ErrorMessage).ToList()
            );
        }

        var staff = await staffRepository.GetByIdAsync(id, cancellationToken);
        if (staff is null)
            return response.NotFound<StaffMemberResponse>("Staff member not found.");

        staff.Name = request.Name;
        staff.Role = request.Role;
        staff.Department = request.Department;
        staff.Contact = request.Contact;
        staff.JoinedOn = request.JoinedOn;

        await staffRepository.UpdateAsync(staff, cancellationToken);
        return response.Ok(MapToResponse(staff), "Staff member updated");
    }

    public async Task<ApiResponse<object>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var staff = await staffRepository.GetByIdAsync(id, cancellationToken);
        if (staff is null)
            return response.NotFound<object>("Staff member not found.");

        await staffRepository.DeleteAsync(id, cancellationToken);
        return response.Ok<object>(null, "Staff member removed");
    }

    private static StaffMemberResponse MapToResponse(StaffMember s) =>
        new()
        {
            Id = s.Id,
            Name = s.Name,
            Role = s.Role,
            Department = s.Department,
            Contact = s.Contact,
            JoinedOn = s.JoinedOn,
        };
}
