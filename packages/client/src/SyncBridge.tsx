import { configFromEnv } from "@summer/data";
import { useAppStore } from "./StoreProvider";
import { useSync } from "./useSync";

/** Resolves effective Supabase config (store override → env) and wires sync. */
export function SyncBridge() {
  const cfg = useAppStore((s) => s.syncConfig);
  const env = configFromEnv();
  const url = cfg?.url ?? env?.url ?? null;
  const anonKey = cfg?.anonKey ?? env?.anonKey ?? null;
  const code =
    cfg?.code ??
    process.env.NEXT_PUBLIC_SYNC_CODE ??
    process.env.EXPO_PUBLIC_SYNC_CODE ??
    null;

  useSync(url && anonKey ? { url, anonKey } : null, code);
  return null;
}
