"use client";

import { AppProviders } from "@summer/app";
import { webStorage } from "@summer/data";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppProviders storage={webStorage}>{children}</AppProviders>;
}
