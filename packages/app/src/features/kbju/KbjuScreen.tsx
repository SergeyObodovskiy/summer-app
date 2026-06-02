import React from "react";
import { ScrollView } from "react-native";
import { Txt } from "@summer/ui";
import { useKbju } from "./useKbju";
import { DayPicker } from "./parts/DayPicker";
import { KbjuLayout } from "./KbjuLayout";

/** Thin shell: shared header + day picker + platform-specific layout. */
export function KbjuScreen() {
  const { dayIndex, setDayIndex, kb, foods } = useKbju();
  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16, gap: 12, maxWidth: 1100, width: "100%", alignSelf: "center" }}
    >
      <Txt className="text-2xl font-medium text-ink">КБЖУ дня</Txt>
      <DayPicker dayIndex={dayIndex} onChange={setDayIndex} />
      <KbjuLayout kb={kb} foods={foods} />
    </ScrollView>
  );
}
