import React, { createContext, useContext, useRef } from "react";
import { createAppStore, type Store } from "@summer/state";
import type { KVStorage } from "@summer/data";
import type { StoreApi, UseBoundStore } from "zustand";

type BoundStore = UseBoundStore<StoreApi<Store>>;

const StoreCtx = createContext<BoundStore | null>(null);

/** Provide a platform-specific storage adapter (localStorage on web, MMKV on native). */
export function StoreProvider({
  storage,
  children,
}: {
  storage: KVStorage;
  children: React.ReactNode;
}) {
  const ref = useRef<BoundStore>();
  if (!ref.current) ref.current = createAppStore(storage);
  return <StoreCtx.Provider value={ref.current}>{children}</StoreCtx.Provider>;
}

export function useAppStore<T>(selector: (s: Store) => T): T {
  const store = useContext(StoreCtx);
  if (!store) throw new Error("useAppStore must be used within <StoreProvider>");
  return store(selector);
}

export function useActions() {
  return useAppStore((s) => s.actions);
}

export function useRawStore(): BoundStore {
  const store = useContext(StoreCtx);
  if (!store) throw new Error("useRawStore must be used within <StoreProvider>");
  return store;
}
