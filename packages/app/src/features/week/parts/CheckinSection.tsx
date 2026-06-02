import React from "react";
import { View, Pressable } from "react-native";
import { Txt, Segmented, Btn } from "@summer/ui";
import {
  COMPLETION_LEVELS,
  DAYS,
  SHORT,
  estimateKcal,
  goalSport,
  relativeDate,
  scaledMinutes,
  type CompletionLevel,
} from "@summer/domain";
import type { BlockView } from "@summer/state";
import { useActions } from "../../../provider/StoreProvider";

/** Shared check-in block: completion level + reschedule + log workout.
 *  Presentational — identical on every platform. */
export function CheckinSection({
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
    actions.addWorkout({ day, type: sport.type, min, km: 0, kcal: estimateKcal(sport.type, min) });
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
      <View className="flex-row items-center gap-2 flex-wrap">
        <Txt className="text-[12px] text-muted">В день недели:</Txt>
        {DAYS.map((d, i) => (
          <Pressable
            key={d.index}
            onPress={() => {
              actions.moveBlock(bv.block.uid, i, Number.MAX_SAFE_INTEGER);
              onDone();
            }}
            className="px-2 py-1 rounded bg-line/60"
          >
            <Txt className="text-[12px] text-ink">{SHORT[i]}</Txt>
          </Pressable>
        ))}
      </View>
      {sport ? <Btn title={`Записать тренировку (${sport.type})`} onPress={logWorkout} /> : null}
    </View>
  );
}
