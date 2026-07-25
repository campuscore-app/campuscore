import type { ReactNode } from "react";

/**
 * Describes one column of the table.
 * - header: text shown in the table header row
 * - accessor: which property of each data row to display in this column
 * - render: optional custom renderer if you don't just want to print the raw value
 *   (for example, to show a colored badge for a "status" field)
 */
export interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /** Used as the React "key" for each row so React can track rows efficiently. */
  keyField: keyof T;
}

/**
 * A small reusable table component.
 *
 * Every module (Students, Staff, Attendance, Fees) needs to show a list of
 * records in a table, so instead of writing a <table> from scratch in every
 * page, we write it once here and each page just tells it which columns and
 * which rows to display.
 */
export function DataTable<T extends object>({
  columns,
  rows,
  keyField,
}: DataTableProps<T>) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          {/* One <th> per column definition */}
          {columns.map((col) => (
            <th key={String(col.accessor)}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/* One <tr> per row of data, one <td> per column inside that row */}
        {rows.map((row) => (
          <tr key={String(row[keyField])}>
            {columns.map((col) => {
              const value = row[col.accessor];
              return (
                <td key={String(col.accessor)}>
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
