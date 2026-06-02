import React from "react";
import { View } from "react-native";
import { DAYS } from "@summer/domain";
import { DayCard } from "./parts/DayCard";

/** Web / desktop layout: responsive grid — 1 column on narrow, 2–3 on wide. */
export function WeekLayout() {
  return (
    <View className="flex-row flex-wrap gap-3">
      {DAYS.map((d) => (
        <View key={d.index} className="w-full md:w-[48%] lg:w-[32%]">
          <DayCard index={d.index} />
        </View>
      ))}
    </View>
  );
}
