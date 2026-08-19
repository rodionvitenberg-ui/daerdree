import type { ReactNode } from "react";

export type AdminColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export default function AdminTable<T>({
  rows,
  columns,
  getRowKey,
  getRowClassName,
  onRowClick,
  empty = "Пусто",
}: {
  rows: T[];
  columns: AdminColumn<T>[];
  getRowKey: (row: T) => string | number;
  getRowClassName?: (row: T) => string | undefined;
  onRowClick?: (row: T) => void;
  empty?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-[10px] border border-white/[0.08] bg-[hsl(56,100%,3%)] px-5 py-8 text-center text-sm text-white/45">
        {empty}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[10px] border border-white/[0.08] bg-[hsl(56,100%,3%)]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.08]">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40 ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-t border-white/[0.04] ${
                onRowClick ? "cursor-pointer hover:bg-white/[0.03]" : ""
              } ${getRowClassName?.(row) ?? ""}`}
            >
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-3 align-middle ${column.className ?? ""}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
