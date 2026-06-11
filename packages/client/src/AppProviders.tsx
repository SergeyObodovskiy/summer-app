import React from "react";
import type { KVStorage } from "@summer/data";
import { StoreProvider } from "./StoreProvider";
import { WeatherProvider } from "./WeatherProvider";
import { SyncBridge } from "./SyncBridge";

/** Single entry point for app wiring. Each platform passes its storage adapter. */
export function AppProviders({
  storage,
  children,
}: {
  storage: KVStorage;
  children: React.ReactNode;
}) {
  return (
    <StoreProvider storage={storage}>
      <SyncBridge />
      <WeatherProvider>{children}</WeatherProvider>
    </StoreProvider>
  );
}
