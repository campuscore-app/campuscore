using CampusCore.Api.Common;
using CampusCore.Api.Common.Utility;
using FluentValidation;

namespace CampusCore.Api.Modules.Students;

public interface IStudentManager
{
    Task<ApiResponse<List<StudentResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<StudentResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<StudentResponse>> CreateAsync(
        CreateStudentRequest request,
        CancellationToken cancellationToken = default
    );
    Task<ApiResponse<StudentResponse>> UpdateAsync(
        int id,
        UpdateStudentRequest request,
        CancellationToken cancellationToken = default
    );
    Task<ApiResponse<object>> DeleteAsync(int id, CancellationToken cancellationToken = default);
}

public class StudentManager(
    IStudentRepository studentRepository,
    IValidator<CreateStudentRequest> createValidator,
    IValidator<UpdateStudentRequest> updateValidator,
    IApiResponseBuilder response
) : IStudentManager
{
    public async Task<ApiResponse<List<StudentResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var students = await studentRepository.GetAllAsync(cancellationToken);
        return response.Ok(students.Select(MapToResponse).ToList());
    }

    public async Task<ApiResponse<StudentResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default
    )
    {
        var student = await studentRepository.GetByIdAsync(id, cancellationToken);
        if (student is null)
            return response.NotFound<StudentResponse>("Student not found.");

        return response.Ok(MapToResponse(student));
    }

    public async Task<ApiResponse<StudentResponse>> CreateAsync(
        CreateStudentRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var validation = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return response.BadRequest<StudentResponse>(
                null,
                validation.Errors.First().ErrorMessage,
                validation.Errors.Select(e => e.ErrorMessage).ToList()
            );
        }

        var existing = await studentRepository.GetByRollNoAsync(request.RollNo, cancellationToken);
        if (existing is not null)
            return response.Conflict<StudentResponse>("This roll number is already assigned to another student.");

        var student = new Student
        {
            Name = request.Name,
            RollNo = request.RollNo,
            ClassName = request.ClassName,
            Section = request.Section,
            GuardianName = request.GuardianName,
            Contact = request.Contact,
        };

        var created = await studentRepository.CreateAsync(student, cancellationToken);
        return response.Created(MapToResponse(created));
    }

    public async Task<ApiResponse<StudentResponse>> UpdateAsync(
        int id,
        UpdateStudentRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var validation = await updateValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return response.BadRequest<StudentResponse>(
                null,
                validation.Errors.First().ErrorMessage,
                validation.Errors.Select(e => e.ErrorMessage).ToList()
            );
        }

        var student = await studentRepository.GetByIdAsync(id, cancellationToken);
        if (student is null)
            return response.NotFound<StudentResponse>("Student not found.");

        // Excludes the student's own current roll number from the
        // uniqueness check — otherwise saving without changing it would
        // incorrectly flag it as a duplicate of itself.
        var existing = await studentRepository.GetByRollNoAsync(request.RollNo, cancellationToken);
        if (existing is not null && existing.Id != id)
            return response.Conflict<StudentResponse>("This roll number is already assigned to another student.");

        student.Name = request.Name;
        student.RollNo = request.RollNo;
        student.ClassName = request.ClassName;
        student.Section = request.Section;
        student.GuardianName = request.GuardianName;
        student.Contact = request.Contact;

        await studentRepository.UpdateAsync(student, cancellationToken);
        return response.Ok(MapToResponse(student), "Student updated");
    }

    public async Task<ApiResponse<object>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var student = await studentRepository.GetByIdAsync(id, cancellationToken);
        if (student is null)
            return response.NotFound<object>("Student not found.");

        await studentRepository.DeleteAsync(id, cancellationToken);
        return response.Ok<object>(null, "Student removed");
    }

    private static StudentResponse MapToResponse(Student s) =>
        new()
        {
            Id = s.Id,
            Name = s.Name,
            RollNo = s.RollNo,
            ClassName = s.ClassName,
            Section = s.Section,
            GuardianName = s.GuardianName,
            Contact = s.Contact,
        };
}
