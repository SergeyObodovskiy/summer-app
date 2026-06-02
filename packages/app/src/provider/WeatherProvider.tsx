import React, { createContext, useContext, useEffect, useState } from "react";
import {
  DAYS,
  SHORT,
  FORECAST_URL,
  parseForecast,
  diffWeather,
  type WeatherDay,
} from "@summer/domain";
import { useRawStore } from "./StoreProvider";

interface WeatherCtx {
  byIso: Record<string, WeatherDay>;
  changes: string[];
}

const Ctx = createContext<WeatherCtx>({ byIso: {}, changes: [] });

const ISO_SHORT: Record<string, string> = {};
DAYS.forEach((d) => {
  ISO_SHORT[d.iso] = SHORT[d.index] ?? d.date;
});

/** Fetches the Minsk forecast once on mount, exposes it, and computes what
 *  changed vs the last-seen snapshot (persisted locally in the store). */
export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const store = useRawStore();
  const [byIso, setByIso] = useState<Record<string, WeatherDay>>({});
  const [changes, setChanges] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(FORECAST_URL);
        if (!res.ok) return;
        const json = await res.json();
        const days = parseForecast(json);
        if (!active || days.length === 0) return;

        const map: Record<string, WeatherDay> = {};
        const snap: Record<string, { rain: boolean; tmax: number }> = {};
        for (const d of days) {
          map[d.iso] = d;
          snap[d.iso] = { rain: d.rain, tmax: d.tmax };
        }
        const prev = store.getState().lastWeather;
        const msgs = diffWeather(prev, snap, (iso) => ISO_SHORT[iso] ?? iso);

        setByIso(map);
        setChanges(msgs);
        store.getState().actions.setLastWeather(snap);
      } catch {
        /* offline — keep planned values */
      }
    })();
    return () => {
      active = false;
    };
  }, [store]);

  return <Ctx.Provider value={{ byIso, changes }}>{children}</Ctx.Provider>;
}

export function useWeather() {
  return useContext(Ctx);
}
