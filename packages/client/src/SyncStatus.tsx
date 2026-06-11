import { useSyncExternalStore } from "react";

export interface SyncStatus {
  /** device has network */
  online: boolean;
  /** connected to Supabase realtime */
  connected: boolean;
  /** a push is in flight */
  syncing: boolean;
}

/* External store: status updates re-render ONLY the components that read it
   (e.g. a badge), not the whole provider tree — avoids a re-render storm. */

let status: SyncStatus = { online: true, connected: false, syncing: false };
const listeners = new Set<() => void>();

export function setSyncStatus(patch: Partial<SyncStatus>) {
  const next = { ...status, ...patch };
  if (
    next.online === status.online &&
    next.connected === status.connected &&
    next.syncing === status.syncing
  ) {
    return; // no change → don't notify (stable snapshot, no extra renders)
  }
  status = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
const getSnapshot = () => status;

/** Read-only sync status for UI badges. */
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
