import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { Txt, Card, ProgressBar } from "@summer/ui";
import { DAYS, isPast } from "@summer/domain";
import { selectDayBlocks, selectDayProgress } from "@summer/state";
import { useAppStore } from "../../../provider/StoreProvider";
import { useWeather } from "../../../provider/WeatherProvider";
import { BlockList } from "./BlockList";

/** Shared day card — the reusable building block. Layouts arrange these. */
export function DayCard({ index }: { index: number }) {
  const day = DAYS[index]!;
  const past = isPast(day.iso);
  const [unlocked, setUnlocked] = useState(false);
  const locked = past && !unlocked;

  const blocks = useAppStore((s) => selectDayBlocks(s, index));
  const progress = useAppStore((s) => selectDayProgress(s, index));
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  // live forecast overrides the planned temperature when available
  const wx = useWeather().byIso[day.iso];
  const temp = wx ? `+${wx.tmax}°` : day.t;
  const sky = wx ? (wx.rain ? " · дождь" : " · сухо") : "";

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
        <Txt className="text-[12px] text-muted">{day.date} · {temp}{sky}</Txt>
      </View>

      <BlockList dayIndex={index} blocks={blocks} dayDate={day.date} locked={locked} />

      <View className="flex-row items-center gap-2 mt-3">
        <View className="flex-1">
          <ProgressBar pct={pct} done={progress.done === progress.total} />
        </View>
        <Txt className="text-[12px] text-muted">{progress.done}/{progress.total}</Txt>
      </View>
    </Card>
  );
}
