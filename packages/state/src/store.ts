import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import {
  BLOCKS,
  defaultLayout,
  type AppState,
  type CompletionLevel,
  type FoodItem,
  type Meal,
  type SyncConfig,
  type SyncState,
  type Workout,
} from "@summer/domain";
import type { KVStorage } from "@summer/data";
import { mergeStates } from "./merge";

export interface Actions {
  toggleBlock: (uid: string, done?: boolean) => void;
  setLevel: (uid: string, level: CompletionLevel) => void;
  setMovedDate: (uid: string, date: string) => void;
  /** move a block to a position within a (possibly different) day */
  moveBlock: (uid: string, toDayIndex: number, toIndex: number) => void;
  setLayout: (layout: string[][]) => void;

  addWorkout: (w: Omit<Workout, "id">) => void;
  removeWorkout: (id: string) => void;
  updateWorkout: (id: string, patch: Partial<Omit<Workout, "id">>) => void;

  addMeal: (date: string, meal: Omit<Meal, "id">) => void;
  removeMeal: (date: string, id: string) => void;
  rememberFood: (food: FoodItem) => void;

  setLastWeather: (snapshot: AppState["lastWeather"]) => void;
  setSyncConfig: (config: SyncConfig | null) => void;

  /** Conflict-free merge of a remote state (used by realtime sync). */
  mergeRemote: (remote: SyncState) => void;
  replaceAll: (state: Partial<AppState>) => void;
  reset: () => void;
}

export type Store = AppState & { actions: Actions };

/** The bound store returned by createAppStore — re-export so consumers
 *  (e.g. @summer/app) don't need a direct zustand dependency. */
export type AppStore = ReturnType<typeof createAppStore>;

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function initialState(): AppState {
  return {
    v: 1,
    dayDone: {},
    goalLevel: {},
    goalMoved: {},
    layout: defaultLayout(),
    kbjuLog: {},
    foods: {},
    workouts: [],
    clock: {},
    lastWeather: {},
    syncConfig: null,
  };
}

const now = () => Date.now();

/** Guarantee every known block appears exactly once across the layout. */
export function normalizeLayout(layout: string[][] | undefined): string[][] {
  const all = Object.keys(BLOCKS);
  const days = defaultLayout().length;
  const seen = new Set<string>();
  let out =
    Array.isArray(layout) && layout.length === days
      ? layout.map((a) => (Array.isArray(a) ? a.slice() : []))
      : defaultLayout().map(() => []);
  out = out.map((arr) =>
    arr.filter((u) => {
      if (BLOCKS[u] && !seen.has(u)) {
        seen.add(u);
        return true;
      }
      return false;
    })
  );
  for (const u of all) {
    if (!seen.has(u)) {
      const di = parseInt(u.slice(1, u.indexOf("b")), 10) || 0;
      (out[di] ??= []).push(u);
      seen.add(u);
    }
  }
  return out;
}

function adapt(kv: KVStorage): StateStorage {
  return {
    getItem: (name) => kv.getString(name),
    setItem: (name, value) => kv.set(name, value),
    removeItem: (name) => kv.remove(name),
  };
}

export function createAppStore(kv: KVStorage): UseBoundStore<StoreApi<Store>> {
  return create<Store>()(
    persist(
      (set, get) => ({
        ...initialState(),
        actions: {
          toggleBlock: (id, done) =>
            set((s) => ({
              dayDone: { ...s.dayDone, [id]: done ?? !s.dayDone[id] },
              clock: { ...s.clock, ["dayDone:" + id]: now() },
            })),
          setLevel: (id, level) =>
            set((s) => ({
              goalLevel: { ...s.goalLevel, [id]: level },
              clock: { ...s.clock, ["goalLevel:" + id]: now() },
            })),
          setMovedDate: (id, date) =>
            set((s) => ({
              goalMoved: { ...s.goalMoved, [id]: date },
              clock: { ...s.clock, ["goalMoved:" + id]: now() },
            })),
          moveBlock: (id, toDay, toIndex) =>
            set((s) => {
              const layout = s.layout.map((a) => a.slice());
              for (const arr of layout) {
                const i = arr.indexOf(id);
                if (i >= 0) arr.splice(i, 1);
              }
              const t = (layout[toDay] ??= []);
              t.splice(Math.max(0, Math.min(toIndex, t.length)), 0, id);
              return { layout, clock: { ...s.clock, layout: now() } };
            }),
          setLayout: (layout) =>
            set((s) => ({ layout: normalizeLayout(layout), clock: { ...s.clock, layout: now() } })),

          addWorkout: (w) =>
            set((s) => {
              const id = uid();
              return {
                workouts: [...s.workouts, { ...w, id }],
                clock: { ...s.clock, ["workout:" + id]: now() },
              };
            }),
          removeWorkout: (id) =>
            set((s) => ({
              workouts: s.workouts.filter((w) => w.id !== id),
              clock: { ...s.clock, ["workout:" + id]: now() },
            })),
          updateWorkout: (id, patch) =>
            set((s) => ({
              workouts: s.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)),
              clock: { ...s.clock, ["workout:" + id]: now() },
            })),

          addMeal: (date, meal) =>
            set((s) => {
              const id = uid();
              return {
                kbjuLog: { ...s.kbjuLog, [date]: [...(s.kbjuLog[date] ?? []), { ...meal, id }] },
                clock: { ...s.clock, ["meal:" + id]: now() },
              };
            }),
          removeMeal: (date, id) =>
            set((s) => ({
              kbjuLog: { ...s.kbjuLog, [date]: (s.kbjuLog[date] ?? []).filter((m) => m.id !== id) },
              clock: { ...s.clock, ["meal:" + id]: now() },
            })),
          rememberFood: (food) =>
            set((s) => {
              const key = food.name.trim().toLowerCase();
              return {
                foods: { ...s.foods, [key]: food },
                clock: { ...s.clock, ["foods:" + key]: now() },
              };
            }),

          setLastWeather: (snapshot) => set({ lastWeather: snapshot }),
          setSyncConfig: (config) => set({ syncConfig: config }),

          mergeRemote: (remote) =>
            set((s) => {
              const local: SyncState = {
                v: s.v, dayDone: s.dayDone, goalLevel: s.goalLevel, goalMoved: s.goalMoved,
                layout: s.layout, kbjuLog: s.kbjuLog, foods: s.foods, workouts: s.workouts, clock: s.clock,
              };
              const merged = mergeStates(local, remote);
              return { ...merged, layout: normalizeLayout(merged.layout) };
            }),
          replaceAll: (partial) =>
            set((s) => ({
              ...s,
              ...partial,
              layout: normalizeLayout(partial.layout ?? s.layout),
            })),
          reset: () => set({ ...initialState() }),
        },
      }),
      {
        name: "summer-app:v1",
        storage: createJSONStorage(() => adapt(kv)),
        partialize: (s): AppState => ({
          v: s.v,
          dayDone: s.dayDone,
          goalLevel: s.goalLevel,
          goalMoved: s.goalMoved,
          layout: s.layout,
          kbjuLog: s.kbjuLog,
          foods: s.foods,
          workouts: s.workouts,
          clock: s.clock,
          lastWeather: s.lastWeather,
          syncConfig: s.syncConfig,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) state.layout = normalizeLayout(state.layout);
        },
      }
    )
  );
}
