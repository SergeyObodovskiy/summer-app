"use client";

import React, { useState } from "react";
import { useActions, useAppStore, useRawStore } from "@summer/client";
import type { AppState } from "@summer/domain";
import { Card, Btn, inputCls } from "../components/ui";

export function SettingsScreen() {
  const actions = useActions();
  const store = useRawStore();
  const cfg = useAppStore((s) => s.syncConfig);

  const [url, setUrl] = useState(cfg?.url ?? "");
  const [key, setKey] = useState(cfg?.anonKey ?? "");
  const [code, setCode] = useState(cfg?.code ?? "");
  const [status, setStatus] = useState("");
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
      clock: s.clock, lastWeather: s.lastWeather, syncConfig: s.syncConfig,
    };
  };
  const doExport = () => setDump(JSON.stringify(snapshot(), null, 2));
  const doImport = () => {
    try {
      actions.replaceAll(JSON.parse(importText) as Partial<AppState>);
      setStatus("Данные импортированы.");
      setImportText("");
    } catch {
      setStatus("Не удалось разобрать JSON.");
    }
  };

  return (
    <div className="max-w-[760px] mx-auto p-4 flex flex-col gap-3">
      <h1 className="text-2xl font-medium text-ink">Настройки</h1>

      <Card className="flex flex-col gap-2">
        <div className="text-base font-medium text-ink">Синхронизация (Supabase)</div>
        <p className="text-[12px] text-muted">Оставь поля пустыми, чтобы использовать значения по умолчанию из окружения.</p>
        <input className={inputCls} placeholder="Project URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <input className={inputCls} placeholder="Anon / publishable key" value={key} onChange={(e) => setKey(e.target.value)} />
        <input className={inputCls} placeholder="Код синхронизации" value={code} onChange={(e) => setCode(e.target.value)} />
        <Btn title="Сохранить" onClick={saveSync} />
      </Card>

      <Card className="flex flex-col gap-2">
        <div className="text-base font-medium text-ink">Резервная копия</div>
        <div className="flex gap-2">
          <Btn title="Экспорт" variant="ghost" onClick={doExport} />
          <Btn title="Импорт" variant="ghost" onClick={doImport} />
        </div>
        {dump && <textarea className={`${inputCls} h-32 font-mono`} readOnly value={dump} />}
        <textarea
          className={`${inputCls} h-24`}
          placeholder="Вставь сюда JSON и нажми «Импорт»"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
      </Card>

      {status && <p className="text-[13px] text-success">{status}</p>}
    </div>
  );
}
