import type { ReactNode } from "react";
import { useRef, useState } from "react";

export type AdminColumn<T> = {
  key: string;
  header: string;
  className?: string;
  sortable?: boolean;
  render: (row: T) => ReactNode;
};

export type SortDirection = "asc" | "desc";

type Props<T> = {
  rows: T[];
  columns: AdminColumn<T>[];
  getRowKey: (row: T) => string | number;
  getRowClassName?: (row: T) => string | undefined;
  onRowClick?: (row: T) => void;
  empty?: string;
  resizable?: boolean;
  sortable?: boolean;
  sortKey?: string | null;
  sortDirection?: SortDirection;
  onSortChange?: (key: string) => void;
};

export default function AdminTable<T>(props: Props<T>) {
  const {
    rows,
    columns,
    getRowKey,
    getRowClassName,
    onRowClick,
    empty = "Пусто",
    resizable = false,
    sortable = false,
    sortKey,
    sortDirection,
    onSortChange,
  } = props;
  const [widths, setWidths] = useState<Record<string, number>>({});
  const dragRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  if (rows.length === 0) {
    return (
      <p className="rounded-[10px] border border-white/[0.08] bg-[hsl(56,100%,3%)] px-5 py-8 text-center text-sm text-white/45">
        {empty}
      </p>
    );
  }

  function startResize(key: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const th = (event.target as HTMLElement).closest("th") as HTMLTableCellElement;
    dragRef.current = { key, startX: event.clientX, startWidth: th.offsetWidth };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const width = Math.max(80, dragRef.current.startWidth + ev.clientX - dragRef.current.startX);
      setWidths((current) => ({ ...current, [dragRef.current!.key]: width }));
    };
    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  return (
    <div className="overflow-x-auto rounded-[10px] border border-white/[0.08] bg-[hsl(56,100%,3%)]">
      <table
        className="w-full text-left text-sm"
        style={resizable ? { tableLayout: "fixed" } : undefined}
      >
        <thead>
          <tr className="border-b border-white/[0.08]">
            {columns.map((column) => {
              const active = sortable && sortKey === column.key;
              const clickable = sortable && column.sortable !== false && onSortChange;
              return (
                <th
                  key={column.key}
                  onClick={clickable ? () => onSortChange(column.key) : undefined}
                  className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40 ${
                    clickable ? "cursor-pointer select-none hover:text-white/70" : ""
                  } ${column.className ?? ""}`}
                  style={widths[column.key] ? { width: widths[column.key] } : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {column.header}
                    {active ? (sortDirection === "asc" ? "▲" : "▼") : null}
                  </span>
                  {resizable ? (
                    <span
                      onMouseDown={(event) => startResize(column.key, event)}
                      className="float-right -mr-4 ml-2 h-4 w-1.5 cursor-col-resize rounded-sm hover:bg-[hsl(187,83%,26%)]"
                    />
                  ) : null}
                </th>
              );
            })}
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
                <td
                  key={column.key}
                  className={`overflow-hidden px-4 py-3 align-middle ${column.className ?? ""}`}
                  style={widths[column.key] ? { width: widths[column.key] } : undefined}
                >
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