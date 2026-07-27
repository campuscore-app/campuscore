using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusCore.Api.Modules.Classes;

[ApiController]
[Route("api/classes")]
[Authorize]
public class ClassesController(ISchoolClassManager classManager) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var response = await classManager.GetAllAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateSchoolClassRequest request, CancellationToken cancellationToken)
    {
        var response = await classManager.CreateAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var response = await classManager.DeleteAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
