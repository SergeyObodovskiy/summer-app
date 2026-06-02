import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppState } from "@summer/domain";

const TABLE = "app_state";

export interface SyncHandle {
  /** push the current state (debounced by the caller) */
  push: (state: AppState) => Promise<void>;
  /** stop realtime subscription */
  dispose: () => void;
}

/**
 * Connect to Supabase for cross-device sync of the whole AppState blob,
 * keyed by a shared `code`. `onRemote` fires when another client writes.
 * `writerId` lets us ignore our own echoed changes.
 */
export async function connectSync(
  sb: SupabaseClient,
  code: string,
  writerId: string,
  local: AppState,
  onRemote: (state: AppState) => void
): Promise<SyncHandle> {
  const { data, error } = await sb
    .from(TABLE)
    .select("data")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;

  if (data?.data) {
    onRemote(data.data as AppState);
  } else {
    await sb.from(TABLE).upsert({
      code,
      data: { ...local, _writer: writerId },
      updated_at: new Date().toISOString(),
    });
  }

  const channel = sb
    .channel(`app_state_${code}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `code=eq.${code}` },
      (payload: any) => {
        const remote = payload.new?.data;
        if (remote && remote._writer !== writerId) onRemote(remote as AppState);
      }
    )
    .subscribe();

  return {
    push: async (state) => {
      const { error: e } = await sb.from(TABLE).upsert({
        code,
        data: { ...state, _writer: writerId },
        updated_at: new Date().toISOString(),
      });
      if (e) throw e;
    },
    dispose: () => {
      sb.removeChannel(channel);
    },
  };
}
