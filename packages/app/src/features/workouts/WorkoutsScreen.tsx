import React from "react";
import { ScrollView, View, Pressable } from "react-native";
import { Txt, Card, MetricCard } from "@summer/ui";
import { fmtDuration } from "@summer/domain";
import { selectStats } from "@summer/state";
import { useActions, useAppStore } from "../../provider/StoreProvider";

export function WorkoutsScreen() {
  const workouts = useAppStore((s) => s.workouts);
  const stats = useAppStore((s) => selectStats(s));
  const actions = useActions();

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16, gap: 12, maxWidth: 1100, width: "100%", alignSelf: "center" }}
    >
      <Txt className="text-2xl font-medium text-ink">Тренировки</Txt>

      <View className="flex-row flex-wrap gap-3">
        <MetricCard label="Тренировок" value={workouts.length} />
        <MetricCard label="Общее время" value={fmtDuration(stats.totalMin)} />
        <MetricCard label="Километраж" value={`${stats.totalKm} км`} />
        <MetricCard label="Сожжено" value={`${stats.totalKcal} ккал`} />
      </View>

      <Card>
        {workouts.length === 0 ? (
          <Txt className="text-[13px] text-muted">Пока нет тренировок — отметь спортивное дело во вкладке «Неделя».</Txt>
        ) : (
          workouts.map((w) => (
            <View key={w.id} className="flex-row items-center border-t border-line/60 py-2">
              <View className="flex-1">
                <Txt className="text-[13px] text-ink">{w.type}</Txt>
                <Txt className="text-[12px] text-muted">{w.day}</Txt>
              </View>
              <Txt className="text-[13px] text-muted text-right">
                {fmtDuration(w.min)}
                {w.km ? ` · ${w.km} км` : ""} · {w.kcal} ккал
              </Txt>
              <Pressable onPress={() => actions.removeWorkout(w.id)} hitSlop={8} className="pl-3">
                <Txt className="text-danger text-base">×</Txt>
              </Pressable>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}
