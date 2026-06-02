import React from "react";
import { Txt, Card } from "@summer/ui";
import type { KbView } from "../useKbju";
import { MealRow } from "./MealRow";

export function MealsCard({ kb }: { kb: KbView }) {
  return (
    <Card>
      <Txt className="text-base font-medium text-ink mb-2">Приёмы пищи</Txt>
      {kb.meals.length === 0 ? (
        <Txt className="text-[13px] text-muted">Пока ничего не добавлено</Txt>
      ) : (
        kb.meals.map((m) => <MealRow key={m.id} date={kb.day.date} meal={m} />)
      )}
    </Card>
  );
}
