import React from "react";
import { View } from "react-native";
import type { FoodItem } from "@summer/domain";
import type { KbView } from "./useKbju";
import { NormBlock } from "./parts/NormBlock";
import { AddMeal } from "./parts/AddMeal";
import { MealsCard } from "./parts/MealsCard";

/** Web / desktop: norm + add-meal on the left, meals list on the right. */
export function KbjuLayout({ kb, foods }: { kb: KbView; foods: Record<string, FoodItem> }) {
  return (
    <View className="flex-col lg:flex-row gap-3 lg:items-start">
      <View className="lg:w-[55%] gap-3">
        <NormBlock kb={kb} />
        <AddMeal date={kb.day.date} foods={foods} />
      </View>
      <View className="lg:flex-1">
        <MealsCard kb={kb} />
      </View>
    </View>
  );
}
