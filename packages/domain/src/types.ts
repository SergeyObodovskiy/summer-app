export type TagKind =
  | "sport"
  | "work"
  | "pet"
  | "moto"
  | "culture"
  | "other";

/** A single planned activity. `uid` is stable for the lifetime of the block,
 *  even when it is reordered or moved to another day. */
export interface Block {
  uid: string;
  time: string; // original interval, e.g. "9:00–9:45" (used to derive duration)
  act: string;
  tag: TagKind;
  /** duration in minutes, derived from `time` */
  dur: number;
}

export interface Day {
  index: number; // 0..6
  name: string;
  date: string; // "1 июня"
  iso: string; // "2026-06-01"
  t: string; // planned temperature label
  wx: string;
  cls: "dry" | "rain";
  badge: string;
}

export type CompletionLevel = 1 | 0.5 | 0.25;

export interface Workout {
  id: string;
  day: string; // date label, e.g. "3 июня"
  type: string;
  min: number;
  km: number;
  kcal: number;
}

export interface FoodItem {
  name: string;
  kcal: number;
  p: number;
  f: number;
  c: number;
}

export interface Meal extends FoodItem {
  id: string;
}

/** The full persisted + synced application state. */
export interface AppState {
  v: number;
  /** uid -> done */
  dayDone: Record<string, boolean>;
  /** uid -> completion level */
  goalLevel: Record<string, CompletionLevel>;
  /** uid -> moved date label */
  goalMoved: Record<string, string>;
  /** layout[dayIndex] = ordered list of uids currently in that day */
  layout: string[][];
  /** date label -> meals logged that day */
  kbjuLog: Record<string, Meal[]>;
  /** lowercased name -> remembered food */
  foods: Record<string, FoodItem>;
  workouts: Workout[];
  /** local-only: last seen forecast snapshot, for change detection */
  lastWeather: Record<string, { rain: boolean; tmax: number }>;
  /** local-only: Supabase sync config (overrides env when set) */
  syncConfig: SyncConfig | null;
}

export interface SyncConfig {
  url: string;
  anonKey: string;
  code: string;
}

/** The portion of AppState that travels to the cloud — excludes device-local fields. */
export type SyncState = Omit<AppState, "lastWeather" | "syncConfig">;

export interface WeatherDay {
  iso: string;
  tmax: number;
  rain: boolean;
  desc: string;
}
