"use client";

import React, { useState } from "react";
import clsx from "clsx";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAppStore, useActions, useWeather } from "@summer/client";
import { selectDayBlocks, selectDayProgress, selectWeekProgress, type BlockView } from "@summer/state";
import {
  DAYS, SHORT, COMPLETION_LEVELS, isPast, goalSport, estimateKcal, scaledMinutes, relativeDate,
} from "@summer/domain";
import { Card, Btn, Tag, Checkbox, Progress, Segmented } from "../components/ui";

export function WeekScreen() {
  const progress = useAppStore((s) => selectWeekProgress(s));
  const { changes } = useWeather();
  return (
    <div className="max-w-[1100px] mx-auto p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-medium text-ink">Летнее расписание · Неделя 1</h1>
        <span className="text-[13px] text-muted">{progress.done}/{progress.total} дел</span>
      </div>
      {changes.length > 0 && (
        <Card className="!bg-tag-rain/40 !border-0">
          <span className="text-[13px] text-ink">
            <b className="font-medium">Погода изменилась: </b>{changes.join("; ")}.
          </span>
        </Card>
      )}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-start">
        {DAYS.map((d) => <DayCard key={d.index} index={d.index} />)}
      </div>
    </div>
  );
}

function DayCard({ index }: { index: number }) {
  const day = DAYS[index]!;
  const past = isPast(day.iso);
  const [unlocked, setUnlocked] = useState(false);
  const locked = past && !unlocked;
  const blocks = useAppStore((s) => selectDayBlocks(s, index));
  const progress = useAppStore((s) => selectDayProgress(s, index));
  const actions = useActions();
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const wx = useWeather().byIso[day.iso];
  const temp = wx ? `+${wx.tmax}°` : day.t;
  const sky = wx ? (wx.rain ? " · дождь" : " · сухо") : "";

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const ids = blocks.map((b) => b.block.uid);
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const to = ids.indexOf(String(over.id));
    if (to >= 0) actions.moveBlock(String(active.id), index, to);
  };

  return (
    <Card className={clsx(locked && "opacity-60")}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-ink">{day.name}</span>
          {past && (
            <button onClick={() => setUnlocked((v) => !v)} className="text-[13px]" title="блокировка прошедшего дня">
              {locked ? "🔒" : "🔓"}
            </button>
          )}
        </div>
        <span className="text-[12px] text-muted">{day.date} · {temp}{sky}</span>
      </div>

      {locked ? (
        <div className="flex flex-col gap-0.5">
          {blocks.map((bv) => <BlockRow key={bv.block.uid} bv={bv} dayDate={day.date} locked />)}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-0.5">
              {blocks.map((bv) => <SortableRow key={bv.block.uid} bv={bv} dayDate={day.date} />)}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex items-center gap-2 mt-3">
        <div className="flex-1"><Progress pct={pct} done={progress.done === progress.total} /></div>
        <span className="text-[12px] text-muted">{progress.done}/{progress.total}</span>
      </div>
    </Card>
  );
}

function SortableRow({ bv, dayDate }: { bv: BlockView; dayDate: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: bv.block.uid });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      <span {...attributes} {...listeners} className="cursor-grab px-1.5 text-line select-none" style={{ touchAction: "none", color: "#c4c4bd" }}>
        ⠿
      </span>
      <div className="flex-1">
        <BlockRow bv={bv} dayDate={dayDate} locked={false} />
      </div>
    </div>
  );
}

function BlockRow({ bv, dayDate, locked }: { bv: BlockView; dayDate: string; locked: boolean }) {
  const actions = useActions();
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-line/60 py-1.5">
      <div className="flex items-center gap-2">
        <Checkbox checked={bv.done} disabled={locked} onChange={(n) => actions.toggleBlock(bv.block.uid, n)} />
        <button disabled={locked} onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 flex-1 text-left">
          <span className="text-[12px] text-muted w-[88px] shrink-0">{bv.time}</span>
          <span className="flex items-center gap-1.5 flex-1">
            <span className={clsx("text-[13px]", bv.done ? "text-muted line-through" : "text-ink")}>{bv.block.act}</span>
            <Tag kind={bv.block.tag} />
          </span>
        </button>
      </div>
      {open && !locked && <CheckinSection bv={bv} dayDate={dayDate} onDone={() => setOpen(false)} />}
    </div>
  );
}

function CheckinSection({ bv, dayDate, onDone }: { bv: BlockView; dayDate: string; onDone: () => void }) {
  const actions = useActions();
  const sport = goalSport(bv.block.act);
  const day = bv.moved ?? dayDate;
  const logWorkout = () => {
    if (!sport) return;
    const min = scaledMinutes(bv.block.dur, bv.level);
    actions.addWorkout({ day, type: sport.type, min, km: 0, kcal: estimateKcal(sport.type, min) });
    onDone();
  };
  return (
    <div className="ml-7 mt-2 p-2.5 bg-tag-work/40 rounded-md flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12px] text-muted">Выполнение:</span>
        <Segmented options={COMPLETION_LEVELS} value={bv.level} onChange={(l) => actions.setLevel(bv.block.uid, l)} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12px] text-muted">Перенести:</span>
        <Btn title="На завтра" variant="ghost" onClick={() => actions.setMovedDate(bv.block.uid, relativeDate(1))} />
        <Btn title="Послезавтра" variant="ghost" onClick={() => actions.setMovedDate(bv.block.uid, relativeDate(2))} />
        {bv.moved && <span className="text-[12px] text-success">→ {bv.moved}</span>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12px] text-muted">В день недели:</span>
        {DAYS.map((d, i) => (
          <button
            key={d.index}
            onClick={() => { actions.moveBlock(bv.block.uid, i, Number.MAX_SAFE_INTEGER); onDone(); }}
            className="px-2 py-1 rounded bg-line/60 text-[12px] text-ink"
          >
            {SHORT[i]}
          </button>
        ))}
      </div>
      {sport && <Btn title={`Записать тренировку (${sport.type})`} onClick={logWorkout} />}
    </div>
  );
}
