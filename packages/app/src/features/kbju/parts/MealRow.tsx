import React from "react";
import { View, Pressable } from "react-native";
import { Txt } from "@summer/ui";
import type { Meal } from "@summer/domain";
import { useActions } from "../../../provider/StoreProvider";

export function MealRow({ date, meal }: { date: string; meal: Meal }) {
  const actions = useActions();
  return (
    <View className="flex-row items-center border-t border-line/60 py-2">
      <Txt className="text-[13px] text-ink flex-1">{meal.name || "—"}</Txt>
      <Txt className="text-[13px] text-muted w-[120px] text-right">
        {meal.kcal} ккал · Б{meal.p}/Ж{meal.f}/У{meal.c}
      </Txt>
      <Pressable onPress={() => actions.removeMeal(date, meal.id)} hitSlop={8} className="pl-3">
        <Txt className="text-danger text-base">×</Txt>
      </Pressable>
    </View>
  );
}
