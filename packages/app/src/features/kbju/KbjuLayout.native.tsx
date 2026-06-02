import React from "react";
import { View } from "react-native";
import type { FoodItem } from "@summer/domain";
import type { KbView } from "./useKbju";
import { NormBlock } from "./parts/NormBlock";
import { AddMeal } from "./parts/AddMeal";
import { MealsCard } from "./parts/MealsCard";

/** Native: single-column stack, comfortable for scrolling on a phone. */
export function KbjuLayout({ kb, foods }: { kb: KbView; foods: Record<string, FoodItem> }) {
  return (
    <View className="gap-3">
      <NormBlock kb={kb} />
      <AddMeal date={kb.day.date} foods={foods} />
      <MealsCard kb={kb} />
    </View>
  );
}
