import React from "react";
import { View } from "react-native";
import { Txt } from "@summer/ui";
import type { KbView } from "../useKbju";
import { RemainCard } from "./RemainCard";

export function NormBlock({ kb }: { kb: KbView }) {
  return (
    <View className="gap-3">
      <Txt className="text-[13px] text-muted">
        Норма на {kb.day.name}{kb.bonus ? ` · +${kb.bonus} ккал` : " · базовая"}
      </Txt>
      <View className="flex-row flex-wrap gap-3">
        <RemainCard label="Калории" unit="ккал" rest={kb.remaining.kcal} norm={kb.norm.kcal} con={kb.consumed.kcal} />
        <RemainCard label="Белки" unit="г" rest={kb.remaining.p} norm={kb.norm.p} con={kb.consumed.p} />
        <RemainCard label="Жиры" unit="г" rest={kb.remaining.f} norm={kb.norm.f} con={kb.consumed.f} />
        <RemainCard label="Углеводы" unit="г" rest={kb.remaining.c} norm={kb.norm.c} con={kb.consumed.c} />
      </View>
    </View>
  );
}
