import React from "react";
import { View } from "react-native";
import { Txt } from "@summer/ui";

export function RemainCard({
  label, unit, rest, norm, con,
}: { label: string; unit: string; rest: number; norm: number; con: number }) {
  const over = con > norm;
  const pct = norm ? Math.min(100, Math.round((con / norm) * 100)) : 0;
  return (
    <View className="bg-surface border border-line rounded-md p-3 flex-1 min-w-[150px]">
      <Txt className="text-[12px] text-muted mb-1">{label} — остаток</Txt>
      <Txt className={`text-2xl font-medium ${over ? "text-danger" : "text-ink"}`}>
        {Math.round(rest)}
        <Txt className="text-[13px] text-muted"> {unit}</Txt>
      </Txt>
      <View className="h-1.5 bg-line rounded overflow-hidden mt-2">
        <View
          className={`h-full rounded ${over ? "bg-danger" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </View>
      <Txt className="text-[12px] text-muted mt-1.5">
        {Math.round(con)} из {norm} {unit}{over ? " · перебор" : ""}
      </Txt>
    </View>
  );
}
