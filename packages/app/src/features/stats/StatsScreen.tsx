import React from "react";
import { ScrollView, View } from "react-native";
import { Txt, Card, MetricCard, ProgressBar } from "@summer/ui";
import { selectStats } from "@summer/state";
import { useAppStore } from "../../provider/StoreProvider";

export function StatsScreen() {
  const stats = useAppStore((s) => selectStats(s));
  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16, gap: 12, maxWidth: 1100, width: "100%", alignSelf: "center" }}
    >
      <Txt className="text-2xl font-medium text-ink">Достижения недели</Txt>

      <View className="flex-row flex-wrap gap-3">
        <MetricCard label="Целей выполнено" value={`${stats.goalsDone} / ${stats.goalsTotal}`} />
        <MetricCard label="Тренировок" value={stats.workouts} />
        <MetricCard label="Километраж" value={`${stats.totalKm} км`} />
        <MetricCard label="Сожжено" value={`${stats.totalKcal} ккал`} />
      </View>

      <Card className="gap-3">
        {stats.categories.map((c) => (
          <View key={c.label}>
            <View className="flex-row justify-between mb-1">
              <Txt className="text-[13px] text-ink">{c.label}</Txt>
              <Txt className={`text-[13px] ${c.met ? "text-success font-medium" : "text-muted"}`}>
                {c.count} / {c.target}{c.met ? " ✓" : ""}
              </Txt>
            </View>
            <ProgressBar pct={Math.min(100, Math.round((c.count / c.target) * 100))} done={c.met} />
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}
