import { useEffect, useRef } from "react";
import { connectSync, getSupabase, type SupabaseConfig, type SyncHandle } from "@summer/data";
import type { SyncState } from "@summer/domain";
import { useRawStore } from "./StoreProvider";

const writerId = Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Wire Supabase realtime sync to the store. No-op until config + code are provided. */
export function useSync(config: SupabaseConfig | null, code: string | null) {
  const store = useRawStore();
  const handle = useRef<SyncHandle | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!config || !code) return;
    let active = true;
    const sb = getSupabase(config);

    const snapshot = (): SyncState => {
      const s = store.getState();
      return {
        v: s.v, dayDone: s.dayDone, goalLevel: s.goalLevel, goalMoved: s.goalMoved,
        layout: s.layout, kbjuLog: s.kbjuLog, foods: s.foods, workouts: s.workouts,
      };
    };

    connectSync(sb, code, writerId, snapshot(), (remote) => {
      store.getState().actions.replaceAll(remote);
    })
      .then((h) => {
        if (!active) return h.dispose();
        handle.current = h;
      })
      .catch((e) => console.warn("sync connect failed", e));

    const unsub = store.subscribe(() => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        handle.current?.push(snapshot()).catch(() => {});
      }, 800);
    });

    return () => {
      active = false;
      unsub();
      if (timer.current) clearTimeout(timer.current);
      handle.current?.dispose();
      handle.current = null;
    };
  }, [config, code, store]);
}
