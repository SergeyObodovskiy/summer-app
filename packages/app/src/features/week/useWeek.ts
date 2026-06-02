import { DAYS } from "@summer/domain";
import { selectWeekProgress } from "@summer/state";
import { useAppStore } from "../../provider/StoreProvider";

/** Screen-level logic, shared by every platform layout. */
export function useWeek() {
  const progress = useAppStore((s) => selectWeekProgress(s));
  return { days: DAYS, progress };
}
