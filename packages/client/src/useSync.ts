import { useEffect, useRef } from "react";
import { connectSync, getSupabase, type SupabaseConfig, type SyncHandle } from "@summer/data";
import type { SyncState } from "@summer/domain";
import { useRawStore } from "./StoreProvider";

const writerId = Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Canonical JSON (object keys sorted at every level) so logically-equal states
 *  compare equal regardless of key order — prevents sync ping-pong. Arrays keep order. */
function stable(value: unknown): string {
  return JSON.stringify(value, (_k, val) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.keys(val as Record<string, unknown>).sort().reduce<Record<string, unknown>>(
          (o, k) => ((o[k] = (val as Record<string, unknown>)[k]), o),
          {}
        )
      : val
  );
}

/** Wire Supabase realtime sync to the store. No-op until config + code are provided.
 *  Loop-safe: identical snapshots are never re-applied or re-pushed, so a remote
 *  update can't bounce back as a new local change (no check/uncheck flicker). */
export function useSync(config: SupabaseConfig | null, code: string | null) {
  const store = useRawStore();
  const handle = useRef<SyncHandle | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastJSON = useRef<string>("");
  const ready = useRef(false);

  useEffect(() => {
    if (!config || !code) return;
    let active = true;
    ready.current = false;
    const sb = getSupabase(config);

    const snapshot = (): SyncState => {
      const s = store.getState();
      return {
        v: s.v, dayDone: s.dayDone, goalLevel: s.goalLevel, goalMoved: s.goalMoved,
        layout: s.layout, kbjuLog: s.kbjuLog, foods: s.foods, workouts: s.workouts, clock: s.clock,
      };
    };

    const applyRemote = (remote: SyncState) => {
      // Conflict-free merge (per-field LWW) — concurrent edits in other tabs are preserved.
      if (stable(remote) === stable(snapshot())) return;
      store.getState().actions.mergeRemote(remote);
    };

    lastJSON.current = stable(snapshot());

    connectSync(sb, code, writerId, snapshot(), applyRemote)
      .then((h) => {
        if (!active) return h.dispose();
        handle.current = h;
        ready.current = true; // only start pushing AFTER the initial cloud pull
        // push our (possibly merged) state once so peers receive our contributions
        const snap = snapshot();
        const json = stable(snap);
        if (json !== lastJSON.current) {
          lastJSON.current = json;
          h.push(snap).catch(() => {});
        }
      })
      .catch((e) => console.warn("sync connect failed", e));

    const unsub = store.subscribe(() => {
      if (!ready.current) return; // don't push stale local state before we've pulled the cloud
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const snap = snapshot();
        const json = stable(snap);
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
