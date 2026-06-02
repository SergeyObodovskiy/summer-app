import React from "react";
import { ScrollView, View } from "react-native";
import { Txt, Card } from "@summer/ui";
import { useWeek } from "./useWeek";
import { WeekLayout } from "./WeekLayout";
import { useWeather } from "../../provider/WeatherProvider";

/** Thin shell: shared header + a platform-specific layout of shared DayCards. */
export function WeekScreen() {
  const { progress } = useWeek();
  const { changes } = useWeather();
  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16, gap: 12, maxWidth: 1100, width: "100%", alignSelf: "center" }}
    >
      <View className="flex-row items-baseline justify-between">
        <Txt className="text-2xl font-medium text-ink">Летнее расписание · Неделя 1</Txt>
        <Txt className="text-[13px] text-muted">{progress.done}/{progress.total} дел</Txt>
      </View>

      {changes.length > 0 ? (
        <Card className="bg-tag-rain/40 border-0">
          <Txt className="text-[13px] text-ink">
            <Txt className="font-medium">Погода изменилась: </Txt>
            {changes.join("; ")}.
          </Txt>
        </Card>
      ) : null}

      <WeekLayout />
    </ScrollView>
  );
}
