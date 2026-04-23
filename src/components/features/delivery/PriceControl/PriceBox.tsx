import React, { useEffect, useState } from "react";
import { Edit2, ChevronDown } from "lucide-react";

export type PriceBoxStatus = "system" | "approved" | "adjusted" | "flagged";

type Variant = "default" | "highlight" | "final";

type PriceBoxProps = {
  label: string;
  value: number;
  subtext?: string;
  variant?: Variant;
  editable?: boolean;
  status?: PriceBoxStatus;
  onStatusChange?: (next: PriceBoxStatus) => void;
  onCommit?: (next: number) => void;
};

function money(value: number) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : "0";
}

export function PriceBox({
  label,
  value,
  subtext,
  variant = "default",
  editable = false,
  status = "system",
  onStatusChange,
  onCommit,
}: PriceBoxProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(Number(value || 0)));

  useEffect(() => {
    setDraft(String(Number(value || 0)));
  }, [value]);

  const tone =
    variant === "final"
      ? "bg-emerald-600 border-emerald-700 text-white"
      : variant === "highlight"
        ? "bg-blue-600 border-blue-700 text-white"
        : "bg-white border-slate-200 text-slate-900";

  const mutedText =
    variant === "default" ? "text-slate-400" : "text-white/80";

  function commit() {
    const next = Number(draft || 0);
    if (Number.isFinite(next) && onCommit) onCommit(next);
    setEditing(false);
  }

  return (
    <div className={`rounded-3xl border p-5 shadow-sm transition-all ${tone}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className={`text-[10px] font-black uppercase tracking-[0.18em] ${mutedText}`}>
          {label}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => editable && setEditing((v) => !v)}
            className={`rounded-full p-1 transition-transform ${editable ? "hover:scale-110" : "opacity-40 cursor-not-allowed"}`}
            disabled={!editable}
          >
            <Edit2 size={14} className={variant === "default" ? "text-slate-400" : "text-white"} />
          </button>

          <div className="relative">
            <select
              value={status}
              onChange={(e) => onStatusChange?.(e.target.value as PriceBoxStatus)}
              className="appearance-none rounded-full bg-black/10 px-3 py-1 pr-6 text-[10px] font-black uppercase tracking-wide outline-none"
            >
              <option value="system">System</option>
              <option value="approved">Approved</option>
              <option value="adjusted">Adjusted</option>
              <option value="flagged">Flagged</option>
            </select>
            <ChevronDown size={10} className="pointer-events-none absolute right-2 top-[9px]" />
          </div>
        </div>
      </div>

      <div className="flex min-h-[44px] items-end gap-1">
        {editing ? (
          <input
            type="number"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(String(Number(value || 0)));
                setEditing(false);
              }
            }}
            className="w-full border-b border-current bg-transparent text-3xl font-black outline-none"
          />
        ) : (
          <span className="text-3xl font-black">
            {money(Number(value || 0))}{" "}
            <span className="text-sm font-semibold opacity-75">MMK</span>
          </span>
        )}
      </div>

      {subtext ? (
        <p className="mt-2 text-[11px] font-medium opacity-80">{subtext}</p>
      ) : null}
    </div>
  );
}

export default PriceBox;
