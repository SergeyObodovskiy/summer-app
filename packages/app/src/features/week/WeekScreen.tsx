import React, { useState } from "react";
import { ScrollView, View, Pressable } from "react-native";
import { Box, Txt, Card, Checkbox, Tag, Segmented, Btn, ProgressBar } from "@summer/ui";
import {
  DAYS,
  COMPLETION_LEVELS,
  estimateKcal,
  goalSport,
  isPast,
  relativeDate,
  scaledMinutes,
  type CompletionLevel,
} from "@summer/domain";
import {
  selectDayBlocks,
  selectDayProgress,
  type BlockView,
} from "@summer/state";
import { useActions, useAppStore } from "../../provider/StoreProvider";

export function WeekScreen() {
  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Txt className="text-2xl font-medium text-ink">Летнее расписание · Неделя 1</Txt>
      {DAYS.map((d) => (
        <DayCard key={d.index} index={d.index} />
      ))}
    </ScrollView>
  );
}

function DayCard({ index }: { index: number }) {
  const day = DAYS[index]!;
  const past = isPast(day.iso);
  const [unlocked, setUnlocked] = useState(false);
  const locked = past && !unlocked;
  const blocks = useAppStore((s) => selectDayBlocks(s, index));
  const progress = useAppStore((s) => selectDayProgress(s, index));
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <Card className={locked ? "opacity-60" : ""}>
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row items-center gap-2">
          <Txt className="text-base font-medium text-ink">{day.name}</Txt>
          {past ? (
            <Pressable onPress={() => setUnlocked((v) => !v)} hitSlop={8}>
              <Txt className="text-[13px]">{locked ? "🔒" : "🔓"}</Txt>
            </Pressable>
          ) : null}
        </View>
        <Txt className="text-[12px] text-muted">{day.date} · {day.t}</Txt>
      </View>

      <View className="gap-0.5">
        {blocks.map((bv) => (
          <BlockRow key={bv.block.uid} bv={bv} dayDate={day.date} locked={locked} />
        ))}
      </View>

      <View className="flex-row items-center gap-2 mt-3">
        <View className="flex-1"><ProgressBar pct={pct} done={progress.done === progress.total} /></View>
        <Txt className="text-[12px] text-muted">{progress.done}/{progress.total}</Txt>
      </View>
    </Card>
  );
}

function BlockRow({
  bv,
  dayDate,
  locked,
}: {
  bv: BlockView;
  dayDate: string;
  locked: boolean;
}) {
  const actions = useActions();
  const [open, setOpen] = useState(false);

  return (
    <View className="border-t border-line/60 py-1.5">
      <View className="flex-row items-center gap-2">
        <Checkbox
          checked={bv.done}
          disabled={locked}
          onChange={(next) => actions.toggleBlock(bv.block.uid, next)}
        />
        <Pressable
          disabled={locked}
          onPress={() => setOpen((v) => !v)}
          className="flex-row items-center gap-2 flex-1"
        >
          <Txt className="text-[12px] text-muted w-[88px]">{bv.time}</Txt>
          <View className="flex-row items-center gap-1.5 flex-1">
            <Txt
              className={`text-[13px] ${bv.done ? "text-muted line-through" : "text-ink"}`}
            >
              {bv.block.act}
            </Txt>
            <Tag kind={bv.block.tag} />
          </View>
        </Pressable>
      </View>

      {open && !locked ? (
        <CheckinSection bv={bv} dayDate={dayDate} onDone={() => setOpen(false)} />
      ) : null}
    </View>
  );
}

function CheckinSection({
  bv,
  dayDate,
  onDone,
}: {
  bv: BlockView;
  dayDate: string;
  onDone: () => void;
}) {
  const actions = useActions();
  const sport = goalSport(bv.block.act);
  const day = bv.moved ?? dayDate;

  const setLevel = (level: CompletionLevel) => actions.setLevel(bv.block.uid, level);
  const move = (offset: number) => actions.setMovedDate(bv.block.uid, relativeDate(offset));

  const logWorkout = () => {
    if (!sport) return;
    const min = scaledMinutes(bv.block.dur, bv.level);
    actions.addWorkout({
      day,
      type: sport.type,
      min,
      km: 0,
      kcal: estimateKcal(sport.type, min),
    });
    onDone();
  };

  return (
    <View className="ml-7 mt-2 p-2.5 bg-tag-work/40 rounded-md gap-2">
      <View className="flex-row items-center gap-2 flex-wrap">
        <Txt className="text-[12px] text-muted">Выполнение:</Txt>
        <Segmented options={COMPLETION_LEVELS} value={bv.level} onChange={setLevel} />
      </View>
      <View className="flex-row items-center gap-2 flex-wrap">
        <Txt className="text-[12px] text-muted">Перенести:</Txt>
        <Btn title="На завтра" variant="ghost" onPress={() => move(1)} />
        <Btn title="Послезавтра" variant="ghost" onPress={() => move(2)} />
        {bv.moved ? <Txt className="text-[12px] text-success">→ {bv.moved}</Txt> : null}
      </View>
      {sport ? (
        <Btn title={`Записать тренировку (${sport.type})`} onPress={logWorkout} />
      ) : null}
    </View>
  );
}
