import React, { createContext, useCallback, useContext, useState } from "react";

export interface SyncStatus {
  /** device has network */
  online: boolean;
  /** connected to Supabase realtime */
  connected: boolean;
  /** a push is in flight */
  syncing: boolean;
}

const defaultStatus: SyncStatus = { online: true, connected: false, syncing: false };

const Ctx = createContext<{
  status: SyncStatus;
  setStatus: (patch: Partial<SyncStatus>) => void;
}>({ status: defaultStatus, setStatus: () => {} });

export function SyncStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, set] = useState<SyncStatus>(defaultStatus);
  const setStatus = useCallback((patch: Partial<SyncStatus>) => set((s) => ({ ...s, ...patch })), []);
  return <Ctx.Provider value={{ status, setStatus }}>{children}</Ctx.Provider>;
}

/** Read-only sync status for UI badges. */
export function useSyncStatus(): SyncStatus {
  return useContext(Ctx).status;
}

/** Internal: used by useSync to report status. */
export function useSyncStatusSetter() {
  return useContext(Ctx).setStatus;
}
