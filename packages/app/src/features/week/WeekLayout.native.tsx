import React from "react";
import { View } from "react-native";
import { DAYS } from "@summer/domain";
import { DayCard } from "./parts/DayCard";

/** Native layout: single-column vertical feed, comfortable for thumbs. */
export function WeekLayout() {
  return (
    <View className="gap-3">
      {DAYS.map((d) => (
        <DayCard key={d.index} index={d.index} />
      ))}
    </View>
  );
}
