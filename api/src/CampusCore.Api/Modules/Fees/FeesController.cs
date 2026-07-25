using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusCore.Api.Modules.Fees;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FeesController(IFeeManager feeManager) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var response = await feeManager.GetAllAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var response = await feeManager.GetByIdAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost]
    public async Task<IActionResult> Assign(AssignFeeRequest request, CancellationToken cancellationToken)
    {
        var response = await feeManager.AssignAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateFeeRequest request, CancellationToken cancellationToken)
    {
        var response = await feeManager.UpdateAsync(id, request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var response = await feeManager.DeleteAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("{id:int}/payments")]
    public async Task<IActionResult> RecordPayment(
        int id,
        RecordPaymentRequest request,
        CancellationToken cancellationToken
    )
    {
        var response = await feeManager.RecordPaymentAsync(id, request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{id:int}/payments")]
    public async Task<IActionResult> GetPaymentHistory(int id, CancellationToken cancellationToken)
    {
        var response = await feeManager.GetPaymentHistoryAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
