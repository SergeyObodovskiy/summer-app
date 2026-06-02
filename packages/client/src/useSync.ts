import { useEffect, useRef } from "react";
import { connectSync, getSupabase, type SupabaseConfig, type SyncHandle } from "@summer/data";
import type { SyncState } from "@summer/domain";
import { useRawStore } from "./StoreProvider";

const writerId = Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Wire Supabase realtime sync to the store. No-op until config + code are provided.
 *  Loop-safe: identical snapshots are never re-applied or re-pushed, so a remote
 *  update can't bounce back as a new local change (no check/uncheck flicker). */
export function useSync(config: SupabaseConfig | null, code: string | null) {
  const store = useRawStore();
  const handle = useRef<SyncHandle | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastJSON = useRef<string>("");

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

    const applyRemote = (remote: SyncState) => {
      const rj = JSON.stringify(remote);
      // Ignore data identical to what we already have — this is what breaks the echo loop.
      if (rj === JSON.stringify(snapshot())) {
        lastJSON.current = rj;
        return;
      }
      lastJSON.current = rj;
      store.getState().actions.replaceAll(remote);
    };

    lastJSON.current = JSON.stringify(snapshot());

    connectSync(sb, code, writerId, snapshot(), applyRemote)
      .then((h) => {
        if (!active) return h.dispose();
        handle.current = h;
      })
      .catch((e) => console.warn("sync connect failed", e));

    const unsub = store.subscribe(() => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const snap = snapshot();
        const json = JSON.stringify(snap);
        if (json === lastJSON.current) return; // nothing actually changed — don't push
        lastJSON.current = json;
        handle.current?.push(snap).catch(() => {});
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
