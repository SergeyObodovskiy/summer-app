"use client";

import React from "react";
import { useAppStore, useActions } from "@summer/client";
import { selectStats } from "@summer/state";
import { fmtDuration } from "@summer/domain";
import { Card, Metric } from "../components/ui";

export function WorkoutsScreen() {
  const workouts = useAppStore((s) => s.workouts);
  const stats = useAppStore((s) => selectStats(s));
  const actions = useActions();

  return (
    <div className="max-w-[1100px] mx-auto p-4 flex flex-col gap-3">
      <h1 className="text-2xl font-medium text-ink">Тренировки</h1>

      <div className="flex flex-wrap gap-3">
        <Metric label="Тренировок" value={workouts.length} />
        <Metric label="Общее время" value={fmtDuration(stats.totalMin)} />
        <Metric label="Километраж" value={`${stats.totalKm} км`} />
        <Metric label="Сожжено" value={`${stats.totalKcal} ккал`} />
      </div>

      <Card>
        {workouts.length === 0 ? (
          <p className="text-[13px] text-muted">Пока нет тренировок — отметь спортивное дело во вкладке «Неделя».</p>
        ) : (
          workouts.map((w) => (
            <div key={w.id} className="flex items-center border-t border-line/60 py-2 gap-2 first:border-t-0">
              <div className="flex-1">
                <div className="text-[13px] text-ink">{w.type}</div>
                <div className="text-[12px] text-muted">{w.day}</div>
              </div>
              <div className="text-[13px] text-muted text-right">
                {fmtDuration(w.min)}{w.km ? ` · ${w.km} км` : ""} · {w.kcal} ккал
              </div>
              <button onClick={() => actions.removeWorkout(w.id)} className="text-danger text-base px-1">×</button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
