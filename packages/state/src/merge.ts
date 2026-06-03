import type { Goal, Meal, SyncState } from "@summer/domain";

/**
 * Conflict-free merge of two app states using per-field LWW (last-writer-wins)
 * timestamps held in `clock`. Concurrent edits to *different* fields both survive;
 * concurrent edits to the *same* field resolve to the newer timestamp.
 * The merge is commutative + idempotent, so all clients converge.
 */

const ts = (clock: Record<string, number>, key: string): number => clock[key] ?? 0;

const idsFromClock = (clock: Record<string, number>, prefix: string): string[] =>
  Object.keys(clock).filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));

function mergeRecord<T>(
  local: Record<string, T>,
  remote: Record<string, T>,
  lc: Record<string, number>,
  rc: Record<string, number>,
  prefix: string,
  outClock: Record<string, number>
): Record<string, T> {
  const out: Record<string, T> = {};
  const keys = new Set<string>([
    ...Object.keys(local), ...Object.keys(remote),
    ...idsFromClock(lc, prefix), ...idsFromClock(rc, prefix),
  ]);
  for (const k of keys) {
    const ck = prefix + k;
    const lt = ts(lc, ck), rt = ts(rc, ck);
    const src = rt > lt ? remote : local;
    const m = Math.max(lt, rt);
    if (k in src) out[k] = src[k]!; // absent on the winning side = deleted/unset
    if (m) outClock[ck] = m;
  }
  return out;
}

function mergeById<T extends { id: string }>(
  local: T[],
  remote: T[],
  lc: Record<string, number>,
  rc: Record<string, number>,
  prefix: string,
  outClock: Record<string, number>
): T[] {
  const lBy: Record<string, T> = Object.fromEntries(local.map((x) => [x.id, x]));
  const rBy: Record<string, T> = Object.fromEntries(remote.map((x) => [x.id, x]));
  const ids = new Set<string>([
    ...Object.keys(lBy), ...Object.keys(rBy),
    ...idsFromClock(lc, prefix), ...idsFromClock(rc, prefix),
  ]);
  const out: T[] = [];
  for (const id of ids) {
    const ck = prefix + id;
    const lt = ts(lc, ck), rt = ts(rc, ck);
    const src = rt > lt ? rBy : lBy;
    const m = Math.max(lt, rt);
    const item = src[id];
    if (item) out.push(item); // absent on the winning side = deleted
    if (m) outClock[ck] = m;
  }
  // deterministic order so every client produces an identical array
  out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return out;
}

export function mergeStates(local: SyncState, remote: SyncState): SyncState {
  const lc = local.clock ?? {};
  const rc = remote.clock ?? {};
  const clock: Record<string, number> = {};

  const dayDone = mergeRecord(local.dayDone, remote.dayDone, lc, rc, "dayDone:", clock);
  const goalLevel = mergeRecord(local.goalLevel, remote.goalLevel, lc, rc, "goalLevel:", clock);
  const goalMoved = mergeRecord(local.goalMoved, remote.goalMoved, lc, rc, "goalMoved:", clock);
  const foods = mergeRecord(local.foods, remote.foods, lc, rc, "foods:", clock);
  const workouts = mergeById(local.workouts, remote.workouts, lc, rc, "workout:", clock);
  const goals = mergeById<Goal>(local.goals ?? [], remote.goals ?? [], lc, rc, "goalItem:", clock);

  // meals: flatten by id (carrying their date), merge, then regroup by date
  type MealLoc = Meal & { __date: string };
  const flat = (log: Record<string, Meal[]>): MealLoc[] =>
    Object.entries(log).flatMap(([date, meals]) => meals.map((mm) => ({ ...mm, __date: date })));
  const mergedMeals = mergeById<MealLoc>(flat(local.kbjuLog), flat(remote.kbjuLog), lc, rc, "meal:", clock);
  const kbjuLog: Record<string, Meal[]> = {};
  for (const m of mergedMeals) {
    const { __date, ...meal } = m;
    (kbjuLog[__date] ??= []).push(meal);
  }

  // layout: single LWW register
  const lt = ts(lc, "layout"), rt = ts(rc, "layout");
  const layout = rt > lt ? remote.layout : local.layout;
  const lm = Math.max(lt, rt);
  if (lm) clock["layout"] = lm;

  return {
    v: Math.max(local.v, remote.v),
    dayDone, goalLevel, goalMoved, foods, workouts, goals, kbjuLog, layout, clock,
  };
}
