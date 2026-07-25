using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusCore.Api.Modules.Students;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StudentsController(IStudentManager studentManager) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var response = await studentManager.GetAllAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var response = await studentManager.GetByIdAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateStudentRequest request, CancellationToken cancellationToken)
    {
        var response = await studentManager.CreateAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateStudentRequest request, CancellationToken cancellationToken)
    {
        var response = await studentManager.UpdateAsync(id, request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var response = await studentManager.DeleteAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
