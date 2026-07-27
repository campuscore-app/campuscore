import { useState, type ReactNode } from "react";

/**
 * Describes one column of the table.
 * - header: text shown in the table header row
 * - accessor: which property of each data row to display in this column
 * - render: optional custom renderer if you don't just want to print the raw value
 *   (for example, to show a colored badge for a "status" field)
 * - sortable: opt-in per column — clicking the header cycles asc/desc/off.
 *   Left off by default so existing tables (Staff, Attendance, Fees) don't
 *   change behavior just because this was added for Students.
 */
export interface Column<T> {
  header: ReactNode;
  accessor: keyof T;
  render?: (value: T[keyof T], row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /** Used as the React "key" for each row so React can track rows efficiently. */
  keyField: keyof T;
}

type SortDirection = "asc" | "desc";

/**
 * A small reusable table component.
 *
 * Every module (Students, Staff, Attendance, Fees) needs to show a list of
 * records in a table, so instead of writing a <table> from scratch in every
 * page, we write it once here and each page just tells it which columns and
 * which rows to display.
 */
export function DataTable<T extends object>({ columns, rows, keyField }: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  function handleHeaderClick(column: Column<T>) {
    if (!column.sortable) return;
    if (sortColumn === column.accessor) {
      setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column.accessor);
      setSortDirection("asc");
    }
  }

  const sortedRows =
    sortColumn === null
      ? rows
      : [...rows].sort((a, b) => {
          const aValue = a[sortColumn];
          const bValue = b[sortColumn];
          // Numbers compare numerically; everything else falls back to a
          // locale-aware string compare (works for names, dates as
          // "YYYY-MM-DD" strings, etc.)
          const comparison =
            typeof aValue === "number" && typeof bValue === "number"
              ? aValue - bValue
              : String(aValue).localeCompare(String(bValue));
          return sortDirection === "asc" ? comparison : -comparison;
        });

  return (
    <table className="data-table">
      <thead>
        <tr>
          {/* One <th> per column definition. Keyed by index, not accessor —
              more than one column can share an accessor (e.g. a checkbox
              column and an actions column both keyed off "id", neither of
              which displays that field directly). */}
          {columns.map((col, index) => (
            <th
              key={index}
              className={col.sortable ? "data-table-sortable" : undefined}
              onClick={() => handleHeaderClick(col)}
            >
              {col.header}
              {col.sortable && sortColumn === col.accessor && (
                <span className="data-table-sort-indicator">{sortDirection === "asc" ? "▲" : "▼"}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/* One <tr> per row of data, one <td> per column inside that row */}
        {sortedRows.map((row) => (
          <tr key={String(row[keyField])}>
            {columns.map((col, index) => {
              const value = row[col.accessor];
              return (
                <td key={index}>
                  {/* Use the custom renderer if the column defined one,
                      otherwise just print the value as text. */}
                  {col.render ? col.render(value, row) : String(value)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
