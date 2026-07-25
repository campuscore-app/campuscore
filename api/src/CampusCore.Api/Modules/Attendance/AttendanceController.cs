using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusCore.Api.Modules.Attendance;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController(IAttendanceManager attendanceManager) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var response = await attendanceManager.GetAllAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var response = await attendanceManager.GetByIdAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateAttendanceRecordRequest request, CancellationToken cancellationToken)
    {
        var response = await attendanceManager.CreateAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        UpdateAttendanceRecordRequest request,
        CancellationToken cancellationToken
    )
    {
        var response = await attendanceManager.UpdateAsync(id, request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var response = await attendanceManager.DeleteAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    /// <summary>Marks a whole class roster in one save — the primary way
    /// attendance gets taken, matching TakeAttendanceView.tsx on the
    /// frontend. Not one-student-per-request, which wouldn't be realistic
    /// for a teacher marking 30+ students daily.</summary>
    [HttpPost("bulk")]
    public async Task<IActionResult> TakeAttendance(BulkAttendanceRequest request, CancellationToken cancellationToken)
    {
        var response = await attendanceManager.TakeAttendanceAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
