import React, { useState } from "react";
import { ScrollView, View, TextInput } from "react-native";
import { Txt, Card, Btn } from "@summer/ui";
import type { AppState } from "@summer/domain";
import { useActions, useAppStore, useRawStore } from "../../provider/StoreProvider";

const inputCls = "border border-line rounded-md px-2.5 py-2 text-[13px] text-ink";

export function SettingsScreen() {
  const actions = useActions();
  const store = useRawStore();
  const cfg = useAppStore((s) => s.syncConfig);

  const [url, setUrl] = useState(cfg?.url ?? "");
  const [key, setKey] = useState(cfg?.anonKey ?? "");
  const [code, setCode] = useState(cfg?.code ?? "");
  const [status, setStatus] = useState<string>("");
  const [dump, setDump] = useState("");
  const [importText, setImportText] = useState("");

  const saveSync = () => {
    if (url.trim() && key.trim() && code.trim()) {
      actions.setSyncConfig({ url: url.trim(), anonKey: key.trim(), code: code.trim() });
      setStatus("Сохранено — синхронизация переподключится.");
    } else {
      actions.setSyncConfig(null);
      setStatus("Очищено — используется конфигурация по умолчанию (env).");
    }
  };

  const snapshot = (): AppState => {
    const s = store.getState();
    return {
      v: s.v, dayDone: s.dayDone, goalLevel: s.goalLevel, goalMoved: s.goalMoved,
      layout: s.layout, kbjuLog: s.kbjuLog, foods: s.foods, workouts: s.workouts,
      lastWeather: s.lastWeather, syncConfig: s.syncConfig,
    };
  };

  const doExport = () => setDump(JSON.stringify(snapshot(), null, 2));

  const doImport = () => {
    try {
      const data = JSON.parse(importText) as Partial<AppState>;
      actions.replaceAll(data);
      setStatus("Данные импортированы.");
      setImportText("");
    } catch {
      setStatus("Не удалось разобрать JSON.");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16, gap: 12, maxWidth: 760, width: "100%", alignSelf: "center" }}
    >
      <Txt className="text-2xl font-medium text-ink">Настройки</Txt>

      <Card className="gap-2">
        <Txt className="text-base font-medium text-ink">Синхронизация (Supabase)</Txt>
        <Txt className="text-[12px] text-muted">Оставь поля пустыми, чтобы использовать значения по умолчанию из окружения.</Txt>
        <TextInput className={inputCls} placeholder="Project URL" autoCapitalize="none" value={url} onChangeText={setUrl} />
        <TextInput className={inputCls} placeholder="Anon / publishable key" autoCapitalize="none" value={key} onChangeText={setKey} />
        <TextInput className={inputCls} placeholder="Код синхронизации" autoCapitalize="none" value={code} onChangeText={setCode} />
        <Btn title="Сохранить" onPress={saveSync} />
      </Card>

      <Card className="gap-2">
        <Txt className="text-base font-medium text-ink">Резервная копия</Txt>
        <View className="flex-row gap-2">
          <Btn title="Экспорт" variant="ghost" onPress={doExport} />
          <Btn title="Импорт" variant="ghost" onPress={doImport} />
        </View>
        {dump ? (
          <TextInput
            className={`${inputCls} h-32`}
            multiline
            editable={false}
            value={dump}
          />
        ) : null}
        <TextInput
          className={`${inputCls} h-24`}
          multiline
          placeholder="Вставь сюда JSON и нажми «Импорт»"
          value={importText}
          onChangeText={setImportText}
        />
      </Card>

      {status ? <Txt className="text-[13px] text-success">{status}</Txt> : null}
    </ScrollView>
  );
}
