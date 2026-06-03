"use client";

import * as React from "react";
import type { TagKind } from "@summer/domain";
import { cn } from "@/lib/utils";
import { Button } from "./ui-kit/button";
import { Checkbox as ScCheckbox } from "./ui-kit/checkbox";
import { Progress as ScProgress } from "./ui-kit/progress";
import { ToggleGroup, ToggleGroupItem } from "./ui-kit/toggle-group";

/* App-facing UI: keeps the existing API the screens use, implemented on shadcn/ui
   primitives (Radix) so accessibility and theming come for free. Screens don't change. */

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-lg border bg-card text-card-foreground p-4", className)}>{children}</div>;
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
    <Button type={type} onClick={onClick} variant={variant === "primary" ? "default" : "outline"} className={className}>
      {title}
    </Button>
  );
}

const TAG: Record<TagKind, string> = {
  sport: "bg-tag-sport", work: "bg-tag-work", pet: "bg-tag-pet",
  moto: "bg-tag-moto", culture: "bg-tag-culture", other: "bg-tag-other",
};
export function Tag({ kind }: { kind: TagKind }) {
  return <span className={cn("inline-block w-2.5 h-2.5 rounded", TAG[kind])} />;
}

export function Checkbox({
  checked, disabled, onChange,
}: { checked: boolean; disabled?: boolean; onChange: (next: boolean) => void }) {
  return <ScCheckbox checked={checked} disabled={disabled} onCheckedChange={(v) => onChange(v === true)} />;
}

export function Progress({ pct, done }: { pct: number; done?: boolean }) {
  return (
    <ScProgress
      value={Math.max(0, Math.min(100, pct))}
      indicatorClassName={done ? "bg-success" : undefined}
    />
  );
}

export function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-md p-3 flex-1 min-w-[120px]">
      <div className="text-[12px] text-muted mb-1">{label}</div>
      <div className="text-2xl font-medium text-foreground">{value}</div>
    </div>
  );
}

export function Segmented<T extends string | number>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <ToggleGroup
      type="single"
      value={String(value)}
      onValueChange={(v) => {
        if (!v) return;
        const found = options.find((o) => String(o.value) === v);
        if (found) onChange(found.value);
      }}
    >
      {options.map((o) => (
        <ToggleGroupItem key={String(o.value)} value={String(o.value)}>
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export const inputCls =
  "flex w-full rounded-md border border-input bg-background px-2.5 py-2 text-[13px] text-foreground placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
