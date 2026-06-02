import clsx from "clsx";
import type { TagKind } from "@summer/domain";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("bg-surface border border-line rounded-lg p-4", className)}>{children}</div>;
}

export function Btn({
  title, onClick, variant = "primary", className, type = "button",
}: {
  title: string;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={clsx(
        "px-4 h-9 rounded-md text-[13px] font-medium transition-colors",
        variant === "primary" ? "bg-primary text-white hover:opacity-90" : "bg-surface border border-line text-ink hover:bg-line/30",
        className
      )}
    >
      {title}
    </button>
  );
}

const TAG: Record<TagKind, string> = {
  sport: "bg-tag-sport", work: "bg-tag-work", pet: "bg-tag-pet",
  moto: "bg-tag-moto", culture: "bg-tag-culture", other: "bg-tag-other",
};
export function Tag({ kind }: { kind: TagKind }) {
  return <span className={clsx("inline-block w-2.5 h-2.5 rounded", TAG[kind])} />;
}

export function Checkbox({
  checked, disabled, onChange,
}: { checked: boolean; disabled?: boolean; onChange: (next: boolean) => void }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="w-[18px] h-[18px] accent-success cursor-pointer disabled:opacity-40"
    />
  );
}

export function Progress({ pct, done }: { pct: number; done?: boolean }) {
  return (
    <div className="h-1.5 bg-line rounded overflow-hidden">
      <div
        className={clsx("h-full rounded", done ? "bg-success" : "bg-primary")}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-surface border border-line rounded-md p-3 flex-1 min-w-[120px]">
      <div className="text-[12px] text-muted mb-1">{label}</div>
      <div className="text-2xl font-medium text-ink">{value}</div>
    </div>
  );
}

export function Segmented<T extends string | number>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex border border-line rounded-md overflow-hidden">
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={clsx(
              "px-3 py-1.5 text-[12px] font-medium",
              i > 0 && "border-l border-line",
              on ? "bg-primary text-white" : "bg-surface text-ink"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export const inputCls = "border border-line rounded-md px-2.5 py-2 text-[13px] text-ink w-full bg-surface";
