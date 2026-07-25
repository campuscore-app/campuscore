import { apiFetch } from "../../shared/api/client";
import type { FeeRecord, PaymentEntry, PaymentMode } from "../../shared/types";

export type FeeRecordInput = Omit<FeeRecord, "id" | "amountPaid" | "status">;

export function getAllFees(): Promise<FeeRecord[]> {
  return apiFetch<FeeRecord[]>("/api/fees");
}

export function createFee(input: FeeRecordInput): Promise<FeeRecord> {
  return apiFetch<FeeRecord>("/api/fees", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateFee(id: number, input: FeeRecordInput): Promise<FeeRecord> {
  return apiFetch<FeeRecord>(`/api/fees/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function removeFee(id: number): Promise<void> {
  return apiFetch<void>(`/api/fees/${id}`, { method: "DELETE" });
}

export function recordPayment(id: number, amount: number, mode: PaymentMode): Promise<FeeRecord> {
  return apiFetch<FeeRecord>(`/api/fees/${id}/payments`, {
    method: "POST",
    body: JSON.stringify({ amount, mode }),
  });
}

/** Fetched on demand only when the "Payment History" modal is opened — payment history is not embedded in the fee list response. */
export function getFeePaymentHistory(id: number): Promise<PaymentEntry[]> {
  return apiFetch<PaymentEntry[]>(`/api/fees/${id}/payments`);
}
