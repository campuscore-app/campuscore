using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusCore.Api.Modules.Staff;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StaffController(IStaffManager staffManager) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var response = await staffManager.GetAllAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var response = await staffManager.GetByIdAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateStaffMemberRequest request, CancellationToken cancellationToken)
    {
        var response = await staffManager.CreateAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        UpdateStaffMemberRequest request,
        CancellationToken cancellationToken
    )
    {
        var response = await staffManager.UpdateAsync(id, request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var response = await staffManager.DeleteAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
