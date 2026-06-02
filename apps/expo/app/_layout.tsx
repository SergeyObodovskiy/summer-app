import "../global.css";
import React from "react";
import { Tabs } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider, useSync } from "@summer/app";
import { configFromEnv } from "@summer/data";
import { mmkvStorage } from "../src/storage";

function SyncBridge() {
  useSync(configFromEnv(), process.env.EXPO_PUBLIC_SYNC_CODE ?? null);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider storage={mmkvStorage}>
        <SyncBridge />
        <Tabs screenOptions={{ headerShown: true }}>
          <Tabs.Screen name="index" options={{ title: "Неделя" }} />
          <Tabs.Screen name="kbju" options={{ title: "КБЖУ" }} />
        </Tabs>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
