import React from "react";
import { View, Text, Pressable, type ViewProps, type PressableProps } from "react-native";
import type { TagKind } from "@summer/domain";

/* Thin universal primitives. `className` is provided by NativeWind on both web and native. */

export function Box(props: ViewProps & { className?: string }) {
  return <View {...props} />;
}

export function Txt(
  props: React.ComponentProps<typeof Text> & { className?: string }
) {
  return <Text {...props} />;
}

export function Card({
  className = "",
  ...rest
}: ViewProps & { className?: string }) {
  return (
    <View
      className={`bg-surface border border-line rounded-lg p-4 ${className}`}
      {...rest}
    />
  );
}

export function Btn({
  title,
  onPress,
  variant = "primary",
  className = "",
}: {
  title: string;
  onPress?: PressableProps["onPress"];
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const base = "px-4 h-9 rounded-md items-center justify-center";
  const v =
    variant === "primary" ? "bg-primary" : "bg-surface border border-line";
  const text = variant === "primary" ? "text-white" : "text-ink";
  return (
    <Pressable onPress={onPress} className={`${base} ${v} ${className}`}>
      <Txt className={`text-[13px] font-medium ${text}`}>{title}</Txt>
    </Pressable>
  );
}

const TAG_BG: Record<TagKind, string> = {
  sport: "bg-tag-sport",
  work: "bg-tag-work",
  pet: "bg-tag-pet",
  moto: "bg-tag-moto",
  culture: "bg-tag-culture",
  other: "bg-tag-other",
};

export function Tag({ kind }: { kind: TagKind }) {
  return <View className={`w-2.5 h-2.5 rounded ${TAG_BG[kind]}`} />;
}

export function Checkbox({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onChange?.(!checked)}
      hitSlop={8}
      className={`w-[18px] h-[18px] rounded border items-center justify-center ${
        checked ? "bg-success border-success" : "border-line"
      } ${disabled ? "opacity-40" : ""}`}
    >
      {checked ? <Txt className="text-white text-[12px] leading-[12px]">✓</Txt> : null}
    </Pressable>
  );
}

export function ProgressBar({
  pct,
  done,
}: {
  pct: number;
  done?: boolean;
}) {
  return (
    <View className="h-1.5 bg-line rounded overflow-hidden">
      <View
        className={`h-full rounded ${done ? "bg-success" : "bg-primary"}`}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </View>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row border border-line rounded-md overflow-hidden self-start">
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            className={`px-3 py-1.5 ${i > 0 ? "border-l border-line" : ""} ${
              on ? "bg-primary" : "bg-surface"
            }`}
          >
            <Txt className={`text-[12px] font-medium ${on ? "text-white" : "text-ink"}`}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="bg-surface border border-line rounded-md p-3 flex-1 min-w-[120px]">
      <Txt className="text-[12px] text-muted mb-1">{label}</Txt>
      <Txt className="text-2xl font-medium text-ink">{value}</Txt>
    </View>
  );
}
