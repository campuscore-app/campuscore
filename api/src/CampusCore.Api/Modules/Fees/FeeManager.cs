using CampusCore.Api.Common;
using CampusCore.Api.Common.Utility;
using CampusCore.Api.Modules.Students;
using FluentValidation;

namespace CampusCore.Api.Modules.Fees;

public interface IFeeManager
{
    Task<ApiResponse<List<FeeRecordResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<FeeRecordResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<FeeRecordResponse>> AssignAsync(
        AssignFeeRequest request,
        CancellationToken cancellationToken = default
    );
    Task<ApiResponse<FeeRecordResponse>> UpdateAsync(
        int id,
        UpdateFeeRequest request,
        CancellationToken cancellationToken = default
    );
    Task<ApiResponse<object>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<FeeRecordResponse>> RecordPaymentAsync(
        int id,
        RecordPaymentRequest request,
        CancellationToken cancellationToken = default
    );
    Task<ApiResponse<List<PaymentEntryResponse>>> GetPaymentHistoryAsync(
        int id,
        CancellationToken cancellationToken = default
    );
}

public class FeeManager(
    IFeeRepository feeRepository,
    IStudentRepository studentRepository,
    IValidator<AssignFeeRequest> assignValidator,
    IValidator<UpdateFeeRequest> updateValidator,
    IValidator<RecordPaymentRequest> paymentValidator,
    IApiResponseBuilder response
) : IFeeManager
{
    public async Task<ApiResponse<List<FeeRecordResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var fees = await feeRepository.GetAllAsync(cancellationToken);
        return response.Ok(fees.Select(MapToResponse).ToList());
    }

    public async Task<ApiResponse<FeeRecordResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default
    )
    {
        var fee = await feeRepository.GetByIdAsync(id, cancellationToken);
        if (fee is null)
            return response.NotFound<FeeRecordResponse>("Fee record not found.");

        return response.Ok(MapToResponse(fee));
    }

    public async Task<ApiResponse<FeeRecordResponse>> AssignAsync(
        AssignFeeRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var validation = await assignValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return response.BadRequest<FeeRecordResponse>(
                null,
                validation.Errors.First().ErrorMessage,
                validation.Errors.Select(e => e.ErrorMessage).ToList()
            );
        }

        var student = await studentRepository.GetByIdAsync(request.StudentId, cancellationToken);
        if (student is null)
            return response.NotFound<FeeRecordResponse>("Student not found.");

        var fee = new FeeRecord
        {
            StudentId = student.Id,
            StudentName = student.Name,
            ClassName = student.ClassName,
            AmountDue = request.AmountDue,
            AmountPaid = 0,
            DueDate = request.DueDate,
        };

        var created = await feeRepository.CreateAsync(fee, cancellationToken);
        return response.Created(MapToResponse(created));
    }

    public async Task<ApiResponse<FeeRecordResponse>> UpdateAsync(
        int id,
        UpdateFeeRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var validation = await updateValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return response.BadRequest<FeeRecordResponse>(
                null,
                validation.Errors.First().ErrorMessage,
                validation.Errors.Select(e => e.ErrorMessage).ToList()
            );
        }

        var fee = await feeRepository.GetByIdAsync(id, cancellationToken);
        if (fee is null)
            return response.NotFound<FeeRecordResponse>("Fee record not found.");

        // Business rule: can't edit the amount due below what's already
        // been paid — that would leave a payment with no fee left to
        // justify it. Only meaningful on edit; a new fee always starts at
        // zero paid, so AssignAsync has nothing to check here.
        if (request.AmountDue < fee.AmountPaid)
        {
            return response.BadRequest<FeeRecordResponse>(
                null,
                $"Amount due can't be less than the {fee.AmountPaid:C0} already paid."
            );
        }

        var student = await studentRepository.GetByIdAsync(request.StudentId, cancellationToken);
        if (student is null)
            return response.NotFound<FeeRecordResponse>("Student not found.");

        fee.StudentId = student.Id;
        fee.StudentName = student.Name;
        fee.ClassName = student.ClassName;
        fee.AmountDue = request.AmountDue;
        fee.DueDate = request.DueDate;

        await feeRepository.UpdateAsync(fee, cancellationToken);
        return response.Ok(MapToResponse(fee), "Fee record updated");
    }

    public async Task<ApiResponse<object>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var fee = await feeRepository.GetByIdAsync(id, cancellationToken);
        if (fee is null)
            return response.NotFound<object>("Fee record not found.");

        await feeRepository.DeleteAsync(id, cancellationToken);
        return response.Ok<object>(null, "Fee record removed");
    }

    public async Task<ApiResponse<FeeRecordResponse>> RecordPaymentAsync(
        int id,
        RecordPaymentRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var validation = await paymentValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return response.BadRequest<FeeRecordResponse>(
                null,
                validation.Errors.First().ErrorMessage,
                validation.Errors.Select(e => e.ErrorMessage).ToList()
            );
        }

        var fee = await feeRepository.GetByIdAsync(id, cancellationToken);
        if (fee is null)
            return response.NotFound<FeeRecordResponse>("Fee record not found.");

        var remainingBalance = fee.AmountDue - fee.AmountPaid;
        if (request.Amount > remainingBalance)
        {
            return response.BadRequest<FeeRecordResponse>(
                null,
                $"Payment cannot exceed the remaining balance of {remainingBalance:C0}."
            );
        }

        fee.Payments.Add(
            new PaymentEntry
            {
                Amount = request.Amount,
                Date = DateOnly.FromDateTime(DateTime.UtcNow),
                Mode = request.Mode,
            }
        );
        fee.AmountPaid += request.Amount;

        await feeRepository.UpdateAsync(fee, cancellationToken);
        return response.Ok(MapToResponse(fee), "Payment recorded");
    }

    public async Task<ApiResponse<List<PaymentEntryResponse>>> GetPaymentHistoryAsync(
        int id,
        CancellationToken cancellationToken = default
    )
    {
        var fee = await feeRepository.GetByIdAsync(id, cancellationToken);
        if (fee is null)
            return response.NotFound<List<PaymentEntryResponse>>("Fee record not found.");

        var history = fee
            .Payments.OrderByDescending(p => p.Date)
            .Select(p => new PaymentEntryResponse
            {
                Id = p.Id,
                Amount = p.Amount,
                Date = p.Date,
                Mode = p.Mode,
                ReceiptNumber = $"RCPT-{fee.Id:D4}-{p.Id:D3}",
            })
            .ToList();

        return response.Ok(history);
    }

    /// <summary>Derives Paid/Pending/Overdue from the numbers on every
    /// read, instead of trusting a stored status column — mirrors
    /// deriveStatus() in FeesPage.tsx. This is the one place status is
    /// ever computed; nowhere else assumes a status value is already correct.</summary>
    private static FeeStatus ComputeStatus(FeeRecord fee)
    {
        if (fee.AmountPaid >= fee.AmountDue)
            return FeeStatus.Paid;
        return fee.DueDate < DateOnly.FromDateTime(DateTime.UtcNow) ? FeeStatus.Overdue : FeeStatus.Pending;
    }

    private static FeeRecordResponse MapToResponse(FeeRecord f) =>
        new()
        {
            Id = f.Id,
            StudentId = f.StudentId,
            StudentName = f.StudentName,
            ClassName = f.ClassName,
            AmountDue = f.AmountDue,
            AmountPaid = f.AmountPaid,
            DueDate = f.DueDate,
            Status = ComputeStatus(f),
        };
}
