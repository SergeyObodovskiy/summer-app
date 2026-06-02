import type { CompletionLevel, WeatherDay } from "./types";

/* ---------- time ---------- */

/** Parse "9:00–9:45" (en-dash or hyphen) into minutes of duration. */
export function parseDur(s: string): number {
  const m = String(s).match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (!m) return 60;
  let a = Number(m[1]) * 60 + Number(m[2]);
  let b = Number(m[3]) * 60 + Number(m[4]);
  if (b <= a) b += 1440; // crosses midnight
  return b - a;
}

/** Minutes-of-day -> "H:MM". */
export function fmtTOD(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = ((min % 60) + 60) % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

const DAY_START = 9 * 60; // 9:00

/** Given an ordered list of durations, return sequential time labels from 9:00. */
export function sequentialTimes(durations: number[]): string[] {
  let cur = DAY_START;
  return durations.map((dur) => {
    const label = `${fmtTOD(cur)}–${fmtTOD(cur + dur)}`;
    cur += dur;
    return label;
  });
}

/* ---------- past / lock ---------- */

export function isPast(iso: string, today = new Date()): boolean {
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  const d = new Date(`${iso}T00:00:00`);
  return d < t;
}

/* ---------- relative dates ---------- */

const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

export function fmtRuDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

export function relativeDate(offsetDays: number, today = new Date()): string {
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return fmtRuDate(d);
}

/* ---------- sport / calories ---------- */

const SPORT: [RegExp, string, number][] = [
  [/велосипед/i, "Велосипед", 150],
  [/турник/i, "Турники", 45],
  [/скейт/i, "Скейт", 120],
  [/бассейн/i, "Бассейн", 60],
  [/батут/i, "Батут", 60],
  [/(^|[^а-яё])бег|пробежк/i, "Бег", 40],
];

const MET: Record<string, number> = {
  Велосипед: 7, Бассейн: 7, Скейт: 5, Турники: 6, Батут: 4.5, Бег: 9, Другое: 5,
};

const BODY_KG = 99;

export function goalSport(label: string): { type: string; def: number } | null {
  for (const [re, type, def] of SPORT) if (re.test(label)) return { type, def };
  return null;
}

export function estimateKcal(type: string, min: number): number {
  return Math.round((MET[type] ?? 5) * BODY_KG * (min / 60));
}

export function scaledMinutes(baseMin: number, level: CompletionLevel): number {
  return Math.round(baseMin * level);
}

/* ---------- weekly goal categories ---------- */

export interface Category {
  label: string;
  re: RegExp;
  target: number;
}

export const CATEGORIES: Category[] = [
  { label: "Мотопутешествие", re: /мотопут/i, target: 1 },
  { label: "Велосипед", re: /велосипед/i, target: 2 },
  { label: "Скейт", re: /скейт/i, target: 1 },
  { label: "Турники", re: /турник/i, target: 7 },
  { label: "Бассейн", re: /бассейн/i, target: 2 },
  { label: "Музей / галерея", re: /музе|галере/i, target: 1 },
];

/* ---------- КБЖУ norm ---------- */

export const BASE_KCAL = 2400;
export const PROTEIN = 180;
export const FAT = 70;

export interface DayNorm {
  kcal: number;
  p: number;
  f: number;
  c: number;
}

/** Daily macro norm including an activity bonus (extra carbs). */
export function dayNorm(bonusKcal = 0): DayNorm {
  const kcal = BASE_KCAL + bonusKcal;
  const c = Math.round((kcal - PROTEIN * 4 - FAT * 9) / 4);
  return { kcal, p: PROTEIN, f: FAT, c };
}

/* ---------- weather ---------- */

export function weatherInfo(
  code: number,
  precipSum: number | null,
  precipProb: number | null
): { rain: boolean; desc: string } {
  const rain =
    code >= 51 ||
    (precipProb != null && precipProb >= 50) ||
    (precipSum != null && precipSum >= 1);
  let desc = "Ясно";
  if (code === 1 || code === 2) desc = "Переменная облачность";
  else if (code === 3) desc = "Пасмурно";
  else if (code === 45 || code === 48) desc = "Туман";
  else if (code >= 51 && code <= 57) desc = "Морось";
  else if (code >= 61 && code <= 67) desc = "Дождь";
  else if (code >= 71 && code <= 77) desc = "Снег";
  else if (code >= 80 && code <= 82) desc = "Ливни";
  else if (code >= 95) desc = "Гроза";
  return { rain, desc };
}

export function diffWeather(
  prev: Record<string, { rain: boolean; tmax: number }>,
  cur: Record<string, { rain: boolean; tmax: number }>,
  dayShort: (iso: string) => string
): string[] {
  const msgs: string[] = [];
  for (const iso of Object.keys(cur)) {
    const a = prev[iso];
    const b = cur[iso];
    if (!a || !b) continue;
    const lbl = dayShort(iso);
    if (a.rain !== b.rain) {
      msgs.push(`${lbl}: ${b.rain ? "стало дождливо" : "прояснилось"}`);
    } else if (Math.abs(a.tmax - b.tmax) >= 3) {
      msgs.push(`${lbl}: ${a.tmax > b.tmax ? "похолодало" : "потеплело"} ${a.tmax}° → ${b.tmax}°`);
    }
  }
  return msgs;
}

export const MINSK = { latitude: 53.9, longitude: 27.5667 };

export const FORECAST_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${MINSK.latitude}` +
  `&longitude=${MINSK.longitude}` +
  `&daily=temperature_2m_max,precipitation_sum,precipitation_probability_max,weathercode` +
  `&timezone=auto&forecast_days=7`;

export function parseForecast(json: any): WeatherDay[] {
  const d = json?.daily;
  if (!d?.time) return [];
  return d.time.map((iso: string, i: number) => {
    const info = weatherInfo(
      d.weathercode[i],
      d.precipitation_sum?.[i] ?? null,
      d.precipitation_probability_max?.[i] ?? null
    );
    return { iso, tmax: Math.round(d.temperature_2m_max[i]), rain: info.rain, desc: info.desc };
  });
}
