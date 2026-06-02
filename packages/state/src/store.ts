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
  type Workout,
} from "@summer/domain";
import type { KVStorage } from "@summer/data";

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
    lastWeather: {},
    syncConfig: null,
  };
}

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
            })),
          setLevel: (id, level) =>
            set((s) => ({ goalLevel: { ...s.goalLevel, [id]: level } })),
          setMovedDate: (id, date) =>
            set((s) => ({ goalMoved: { ...s.goalMoved, [id]: date } })),
          moveBlock: (id, toDay, toIndex) =>
            set((s) => {
              const layout = s.layout.map((a) => a.slice());
              for (const arr of layout) {
                const i = arr.indexOf(id);
                if (i >= 0) arr.splice(i, 1);
              }
              const t = (layout[toDay] ??= []);
              t.splice(Math.max(0, Math.min(toIndex, t.length)), 0, id);
              return { layout };
            }),
          setLayout: (layout) => set({ layout: normalizeLayout(layout) }),

          addWorkout: (w) =>
            set((s) => ({ workouts: [...s.workouts, { ...w, id: uid() }] })),
          removeWorkout: (id) =>
            set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),
          updateWorkout: (id, patch) =>
            set((s) => ({
              workouts: s.workouts.map((w) =>
                w.id === id ? { ...w, ...patch } : w
              ),
            })),

          addMeal: (date, meal) =>
            set((s) => ({
              kbjuLog: {
                ...s.kbjuLog,
                [date]: [...(s.kbjuLog[date] ?? []), { ...meal, id: uid() }],
              },
            })),
          removeMeal: (date, id) =>
            set((s) => ({
              kbjuLog: {
                ...s.kbjuLog,
                [date]: (s.kbjuLog[date] ?? []).filter((m) => m.id !== id),
              },
            })),
          rememberFood: (food) =>
            set((s) => ({
              foods: { ...s.foods, [food.name.trim().toLowerCase()]: food },
            })),

          setLastWeather: (snapshot) => set({ lastWeather: snapshot }),
          setSyncConfig: (config) => set({ syncConfig: config }),

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
