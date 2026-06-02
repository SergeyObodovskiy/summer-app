"use client";

import { StoreProvider, useSync } from "@summer/app";
import { webStorage, configFromEnv } from "@summer/data";

function SyncBridge() {
  useSync(configFromEnv(), process.env.NEXT_PUBLIC_SYNC_CODE ?? null);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider storage={webStorage}>
      <SyncBridge />
      {children}
    </StoreProvider>
  );
}
