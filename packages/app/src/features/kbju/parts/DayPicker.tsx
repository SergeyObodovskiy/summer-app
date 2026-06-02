import React from "react";
import { View, Pressable } from "react-native";
import { Txt } from "@summer/ui";
import { DAYS, SHORT } from "@summer/domain";

export function DayPicker({
  dayIndex,
  onChange,
}: {
  dayIndex: number;
  onChange: (i: number) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {DAYS.map((d, i) => {
        const on = i === dayIndex;
        return (
          <Pressable
            key={d.index}
            onPress={() => onChange(i)}
            className={`px-3 py-1.5 rounded-md ${on ? "bg-primary" : "bg-line/60"}`}
          >
            <Txt className={`text-[13px] font-medium ${on ? "text-white" : "text-ink"}`}>
              {SHORT[i]} {d.date.split(" ")[0]}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
