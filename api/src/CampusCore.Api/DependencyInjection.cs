using CampusCore.Api.Common.Utility;
using CampusCore.Api.Modules.Attendance;
using CampusCore.Api.Modules.Auth;
using CampusCore.Api.Modules.Fees;
using CampusCore.Api.Modules.Staff;
using CampusCore.Api.Modules.Students;
using FluentValidation;

namespace CampusCore.Api;

public static class DependencyInjection
{
    public static IServiceCollection AddCampusCoreApi(this IServiceCollection services)
    {
        // Utility
        services.AddScoped<IApiResponseBuilder, ApiResponseBuilder>();

        // Auth
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthManager, AuthManager>();
        services.AddScoped<IValidator<LoginRequest>, LoginRequestValidator>();
        services.AddScoped<IValidator<SetupRequest>, SetupRequestValidator>();

        // Students
        services.AddScoped<IStudentRepository, StudentRepository>();
        services.AddScoped<IStudentManager, StudentManager>();
        services.AddScoped<IValidator<CreateStudentRequest>, CreateStudentRequestValidator>();
        services.AddScoped<IValidator<UpdateStudentRequest>, UpdateStudentRequestValidator>();

        // Staff
        services.AddScoped<IStaffRepository, StaffRepository>();
        services.AddScoped<IStaffManager, StaffManager>();
        services.AddScoped<IValidator<CreateStaffMemberRequest>, CreateStaffMemberRequestValidator>();
        services.AddScoped<IValidator<UpdateStaffMemberRequest>, UpdateStaffMemberRequestValidator>();

        // Attendance
        services.AddScoped<IAttendanceRepository, AttendanceRepository>();
        services.AddScoped<IAttendanceManager, AttendanceManager>();
        services.AddScoped<IValidator<CreateAttendanceRecordRequest>, CreateAttendanceRecordRequestValidator>();
        services.AddScoped<IValidator<UpdateAttendanceRecordRequest>, UpdateAttendanceRecordRequestValidator>();
        services.AddScoped<IValidator<BulkAttendanceRequest>, BulkAttendanceRequestValidator>();

        // Fees
        services.AddScoped<IFeeRepository, FeeRepository>();
        services.AddScoped<IFeeManager, FeeManager>();
        services.AddScoped<IValidator<AssignFeeRequest>, AssignFeeRequestValidator>();
        services.AddScoped<IValidator<UpdateFeeRequest>, UpdateFeeRequestValidator>();
        services.AddScoped<IValidator<RecordPaymentRequest>, RecordPaymentRequestValidator>();

        return services;
    }
}
