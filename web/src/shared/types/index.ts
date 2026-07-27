/** One valid (class, section) combination students can be enrolled into —
 * master data so "10-A" vs "10 A" vs "Class 10 A" can't drift inconsistent
 * across the register (see AddStudentForm, which sources its Class/Section
 * dropdowns from this instead of free-typed text). */
export interface SchoolClass {
  id: number;
  className: string;
  section: string;
}

export interface Student {
  id: number;
  name: string;
  rollNo: string;
  className: string;
  section: string;
  guardianName: string;
  contact: string;
}

export interface StaffMember {
  id: number;
  name: string;
  role: string;
  department: string;
  contact: string;
  joinedOn: string;
}

export interface AttendanceRecord {
  id: number;
  studentName: string;
  className: string;
  date: string;
  status: "Present" | "Absent" | "Late";
}

// Matches the backend's PaymentMode enum member names exactly (see
// Modules/Fees/PaymentEntry.cs) — "BankTransfer"/"Upi", not "Bank
// Transfer"/"UPI". Display formatting for those two happens at the UI
// layer (formatPaymentMode below), not by changing the wire value.
export type PaymentMode = "Cash" | "Cheque" | "BankTransfer" | "Upi";

export function formatPaymentMode(mode: PaymentMode): string {
  if (mode === "BankTransfer") return "Bank Transfer";
  if (mode === "Upi") return "UPI";
  return mode;
}

/** One historical payment against a fee record — this is what makes the running "amountPaid" total auditable instead of just a trusted number. */
export interface PaymentEntry {
  id: number;
  amount: number;
  date: string;
  mode: PaymentMode;
  /** Computed server-side (Modules/Fees/FeeManager.cs) — never generated client-side, so there's one source of truth for the format. */
  receiptNumber: string;
}

export interface FeeRecord {
  id: number;
  /** References an actual enrolled Student — fees are assigned by picking a real student, not free-typing a name, so this can never point at a non-existent record. */
  studentId: number;
  studentName: string;
  className: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  status: "Paid" | "Pending" | "Overdue";
  // Payment history is NOT embedded here — GET /api/fees returns the lean
  // list shape; history is fetched on demand via getFeePaymentHistory(id)
  // only when the "History" modal is actually opened.
}
