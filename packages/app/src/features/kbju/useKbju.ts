import { useState } from "react";
import { selectKbju } from "@summer/state";
import { useAppStore } from "../../provider/StoreProvider";

export type KbView = ReturnType<typeof selectKbju>;

/** Screen-level КБЖУ logic, shared by every platform layout. */
export function useKbju() {
  const [dayIndex, setDayIndex] = useState(0);
  const kb = useAppStore((s) => selectKbju(s, dayIndex));
  const foods = useAppStore((s) => s.foods);
  return { dayIndex, setDayIndex, kb, foods };
}
