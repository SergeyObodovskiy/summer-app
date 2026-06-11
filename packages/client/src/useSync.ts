import { useEffect, useRef } from "react";
import { connectSync, getSupabase, type SupabaseConfig, type SyncHandle } from "@summer/data";
import type { SyncState } from "@summer/domain";
import { useRawStore } from "./StoreProvider";
import { setSyncStatus } from "./SyncStatus";

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

const isOnline = () => (typeof navigator === "undefined" ? true : navigator.onLine !== false);

/**
 * Realtime sync with offline support:
 * - edits are always persisted locally (Zustand persist), online or not;
 * - while offline we don't push — changes queue in local state;
 * - on reconnect (online event, or retry with backoff) we pull the cloud, merge
 *   conflict-free (LWW), then flush the merged result so nothing is lost.
 */
export function useSync(config: SupabaseConfig | null, code: string | null) {
  const store = useRawStore();
  const handle = useRef<SyncHandle | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastJSON = useRef<string>("");
  const ready = useRef(false);

  useEffect(() => {
    setSyncStatus({ online: isOnline(), connected: false, syncing: false });
    if (!config || !code) return;

    let active = true;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let backoff = 3000;
    let gen = 0; // generation token: only the latest connect() wins, stale ones dispose
    ready.current = false;
    const sb = getSupabase(config);

    const snapshot = (): SyncState => {
      const s = store.getState();
      return {
        v: s.v, dayDone: s.dayDone, goalLevel: s.goalLevel, goalMoved: s.goalMoved,
        layout: s.layout, kbjuLog: s.kbjuLog, foods: s.foods, workouts: s.workouts,
        goals: s.goals, clock: s.clock,
      };
    };

    const applyRemote = (remote: SyncState) => {
      if (stable(remote) === stable(snapshot())) return; // identical — ignore
      store.getState().actions.mergeRemote(remote);
    };

    const onPushFail = () => {
      ready.current = false;
      setSyncStatus({ connected: false, syncing: false });
      scheduleRetry();
    };

    const push = (snap: SyncState) => {
      setSyncStatus({ syncing: true });
      handle.current
        ?.push(snap)
        .then(() => setSyncStatus({ syncing: false }))
        .catch(onPushFail);
    };

    function scheduleRetry() {
      if (!active || retry) return;
      retry = setTimeout(() => {
        retry = null;
        connect();
      }, backoff);
      backoff = Math.min(backoff * 2, 30000);
    }

    async function connect() {
      if (!active || !code) return;
      const myGen = ++gen;
      // Drop any existing/in-flight connection so two connects can't both win.
      if (handle.current) {
        try { handle.current.dispose(); } catch { /* ignore */ }
        handle.current = null;
      }
      try {
        const h = await connectSync(sb, code, writerId, snapshot(), applyRemote);
        // Superseded by a newer connect() (or unmounted) while awaiting → dispose, don't leak.
        if (!active || myGen !== gen) return h.dispose();
        handle.current = h;
        ready.current = true;
        backoff = 3000;
        setSyncStatus({ connected: true, online: true });
        // flush our (possibly merged / offline-accumulated) state once
        const snap = snapshot();
        const json = stable(snap);
        if (json !== lastJSON.current) {
          lastJSON.current = json;
          push(snap);
        }
      } catch {
        ready.current = false;
        setSyncStatus({ connected: false });
        scheduleRetry();
      }
    }

    lastJSON.current = stable(snapshot());
    connect();

    // Web: reconnect the instant the network returns.
    // connect() bumps the generation token and disposes any existing/in-flight
    // handle itself, so duplicate online events can't leak a connection.
    const reconnect = () => {
      setSyncStatus({ online: true });
      if (retry) { clearTimeout(retry); retry = null; }
      backoff = 3000;
      ready.current = false;
      connect();
    };
    const goOffline = () => {
      ready.current = false;
      setSyncStatus({ online: false, connected: false });
    };
    const hasWin = typeof window !== "undefined" && !!window.addEventListener;
    if (hasWin) {
      window.addEventListener("online", reconnect);
      window.addEventListener("offline", goOffline);
    }

    const unsub = store.subscribe(() => {
      if (!ready.current) return; // offline: persisted locally, flushed on reconnect
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const snap = snapshot();
        const json = stable(snap);
        if (json === lastJSON.current) return;
        lastJSON.current = json;
        push(snap);
      }, 800);
    });

    return () => {
      active = false;
      if (retry) clearTimeout(retry);
      if (timer.current) clearTimeout(timer.current);
      if (hasWin) {
        window.removeEventListener("online", reconnect);
        window.removeEventListener("offline", goOffline);
      }
      unsub();
      handle.current?.dispose();
      handle.current = null;
    };
  }, [config, code, store]);
}
