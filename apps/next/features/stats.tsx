"use client";

import React from "react";
import clsx from "clsx";
import { useAppStore } from "@summer/client";
import { selectStats } from "@summer/state";
import { Card, Metric, Progress } from "../components/ui";

export function StatsScreen() {
  const stats = useAppStore((s) => selectStats(s));
  return (
    <div className="max-w-[1100px] mx-auto p-4 flex flex-col gap-3">
      <h1 className="text-2xl font-medium text-ink">Достижения недели</h1>

      <div className="flex flex-wrap gap-3">
        <Metric label="Целей выполнено" value={`${stats.goalsDone} / ${stats.goalsTotal}`} />
        <Metric label="Тренировок" value={stats.workouts} />
        <Metric label="Километраж" value={`${stats.totalKm} км`} />
        <Metric label="Сожжено" value={`${stats.totalKcal} ккал`} />
      </div>

      <Card className="flex flex-col gap-3">
        {stats.categories.map((c) => (
          <div key={c.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[13px] text-ink">{c.label}</span>
              <span className={clsx("text-[13px]", c.met ? "text-success font-medium" : "text-muted")}>
                {c.count} / {c.target}{c.met ? " ✓" : ""}
              </span>
            </div>
            <Progress pct={Math.min(100, Math.round((c.count / c.target) * 100))} done={c.met} />
          </div>
        ))}
      </Card>
    </div>
  );
}
