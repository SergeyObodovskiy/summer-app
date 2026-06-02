import {
  BLOCKS,
  CATEGORIES,
  DAYS,
  KBJU_BONUS,
  dayNorm,
  sequentialTimes,
  type AppState,
  type Block,
  type CompletionLevel,
} from "@summer/domain";

export interface BlockView {
  block: Block;
  time: string; // recomputed sequential time
  done: boolean;
  level: CompletionLevel;
  moved?: string;
}

/** Blocks of a given day, in current layout order, with recomputed times. */
export function selectDayBlocks(s: AppState, dayIndex: number): BlockView[] {
  const uids = s.layout[dayIndex] ?? [];
  const blocks = uids.map((u) => BLOCKS[u]).filter(Boolean) as Block[];
  const times = sequentialTimes(blocks.map((b) => b.dur));
  return blocks.map((block, i) => ({
    block,
    time: times[i]!,
    done: !!s.dayDone[block.uid],
    level: s.goalLevel[block.uid] ?? 1,
    moved: s.goalMoved[block.uid],
  }));
}

export function selectDayProgress(s: AppState, dayIndex: number) {
  const uids = s.layout[dayIndex] ?? [];
  const done = uids.filter((u) => s.dayDone[u]).length;
  return { done, total: uids.length };
}

export function selectWeekProgress(s: AppState) {
  let done = 0;
  let total = 0;
  for (const uids of s.layout)
    for (const u of uids) {
      total++;
      if (s.dayDone[u]) done++;
    }
  return { done, total };
}

export interface CategoryStat {
  label: string;
  count: number;
  target: number;
  met: boolean;
}

export function selectStats(s: AppState) {
  const counts = CATEGORIES.map(() => 0);
  for (const uid of Object.keys(BLOCKS)) {
    if (!s.dayDone[uid]) continue;
    const text = BLOCKS[uid]!.act;
    CATEGORIES.forEach((c, i) => {
      if (c.re.test(text)) counts[i]!++;
    });
  }
  const categories: CategoryStat[] = CATEGORIES.map((c, i) => ({
    label: c.label,
    count: counts[i]!,
    target: c.target,
    met: counts[i]! >= c.target,
  }));
  const goalsDone = categories.filter((c) => c.met).length;
  const totalKm = s.workouts.reduce((a, w) => a + (w.km || 0), 0);
  const totalKcal = s.workouts.reduce((a, w) => a + (w.kcal || 0), 0);
  const totalMin = s.workouts.reduce((a, w) => a + (w.min || 0), 0);
  return {
    categories,
    goalsDone,
    goalsTotal: CATEGORIES.length,
    workouts: s.workouts.length,
    totalKm: Math.round(totalKm * 10) / 10,
    totalKcal,
    totalMin,
  };
}

/** КБЖУ norm + consumed + remaining for a given day index. */
export function selectKbju(s: AppState, dayIndex: number) {
  const day = DAYS[dayIndex]!;
  const bonus = KBJU_BONUS[dayIndex] ?? 0;
  const norm = dayNorm(bonus);
  const meals = s.kbjuLog[day.date] ?? [];
  const consumed = meals.reduce(
    (a, m) => ({
      kcal: a.kcal + m.kcal,
      p: a.p + m.p,
      f: a.f + m.f,
      c: a.c + m.c,
    }),
    { kcal: 0, p: 0, f: 0, c: 0 }
  );
  return {
    day,
    bonus,
    norm,
    meals,
    consumed,
    remaining: {
      kcal: norm.kcal - consumed.kcal,
      p: norm.p - consumed.p,
      f: norm.f - consumed.f,
      c: norm.c - consumed.c,
    },
  };
}
