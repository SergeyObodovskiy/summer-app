import "../global.css";
import React from "react";
import { Tabs } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProviders } from "@summer/app";
import { mmkvStorage } from "../src/storage";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders storage={mmkvStorage}>
          <Tabs screenOptions={{ headerShown: true }}>
            <Tabs.Screen name="index" options={{ title: "Неделя" }} />
            <Tabs.Screen name="kbju" options={{ title: "КБЖУ" }} />
            <Tabs.Screen name="workouts" options={{ title: "Тренировки" }} />
            <Tabs.Screen name="stats" options={{ title: "Достижения" }} />
            <Tabs.Screen name="settings" options={{ title: "Настройки" }} />
          </Tabs>
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
