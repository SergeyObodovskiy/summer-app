"use client";

import React, { useMemo, useState } from "react";
import clsx from "clsx";
import { useAppStore, useActions } from "@summer/client";
import { selectKbju } from "@summer/state";
import { DAYS, SHORT, type FoodItem } from "@summer/domain";
import { Card, Btn, inputCls } from "../components/ui";

export function KbjuScreen() {
  const [dayIndex, setDayIndex] = useState(0);
  const kb = useAppStore((s) => selectKbju(s, dayIndex));
  const foods = useAppStore((s) => s.foods);
  const actions = useActions();

  return (
    <div className="max-w-[1100px] mx-auto p-4 flex flex-col gap-3">
      <h1 className="text-2xl font-medium text-ink">КБЖУ дня</h1>

      <div className="flex flex-wrap gap-1.5">
        {DAYS.map((d, i) => {
          const on = i === dayIndex;
          return (
            <button
              key={d.index}
              onClick={() => setDayIndex(i)}
              className={clsx("px-3 py-1.5 rounded-md text-[13px] font-medium", on ? "bg-primary text-white" : "bg-line/60 text-ink")}
            >
              {SHORT[i]} {d.date.split(" ")[0]}
            </button>
          );
        })}
      </div>

      <p className="text-[13px] text-muted">
        Норма на {kb.day.name}{kb.bonus ? ` · +${kb.bonus} ккал` : " · базовая"}
      </p>

      <div className="grid gap-3 grid-cols-1 lg:grid-cols-[55%_1fr] items-start">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <Remain label="Калории" unit="ккал" rest={kb.remaining.kcal} norm={kb.norm.kcal} con={kb.consumed.kcal} />
            <Remain label="Белки" unit="г" rest={kb.remaining.p} norm={kb.norm.p} con={kb.consumed.p} />
            <Remain label="Жиры" unit="г" rest={kb.remaining.f} norm={kb.norm.f} con={kb.consumed.f} />
            <Remain label="Углеводы" unit="г" rest={kb.remaining.c} norm={kb.norm.c} con={kb.consumed.c} />
          </div>
          <AddMeal date={kb.day.date} foods={foods} />
        </div>

        <Card>
          <div className="text-base font-medium text-ink mb-2">Приёмы пищи</div>
          {kb.meals.length === 0 ? (
            <p className="text-[13px] text-muted">Пока ничего не добавлено</p>
          ) : (
            kb.meals.map((m) => (
              <div key={m.id} className="flex items-center border-t border-line/60 py-2 gap-2">
                <span className="text-[13px] text-ink flex-1">{m.name || "—"}</span>
                <span className="text-[13px] text-muted">{m.kcal} ккал · Б{m.p}/Ж{m.f}/У{m.c}</span>
                <button onClick={() => actions.removeMeal(kb.day.date, m.id)} className="text-danger text-base px-1">×</button>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

function Remain({
  label, unit, rest, norm, con,
}: { label: string; unit: string; rest: number; norm: number; con: number }) {
  const over = con > norm;
  const pct = norm ? Math.min(100, Math.round((con / norm) * 100)) : 0;
  return (
    <div className="bg-surface border border-line rounded-md p-3 flex-1 min-w-[150px]">
      <div className="text-[12px] text-muted mb-1">{label} — остаток</div>
      <div className={clsx("text-2xl font-medium", over ? "text-danger" : "text-ink")}>
        {Math.round(rest)}<span className="text-[13px] text-muted"> {unit}</span>
      </div>
      <div className="h-1.5 bg-line rounded overflow-hidden mt-2">
        <div className={clsx("h-full rounded", over ? "bg-danger" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[12px] text-muted mt-1.5">
        {Math.round(con)} из {norm} {unit}{over ? " · перебор" : ""}
      </div>
    </div>
  );
}

function AddMeal({ date, foods }: { date: string; foods: Record<string, FoodItem> }) {
  const actions = useActions();
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [p, setP] = useState("");
  const [f, setF] = useState("");
  const [c, setC] = useState("");

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return [];
    return Object.values(foods).filter((fd) => fd.name.toLowerCase().includes(q)).slice(0, 6);
  }, [name, foods]);

  const pick = (fd: FoodItem) => {
    setName(fd.name); setKcal(String(fd.kcal)); setP(String(fd.p)); setF(String(fd.f)); setC(String(fd.c));
  };
  const add = () => {
    const nm = name.trim();
    if (!nm) return;
    const pv = Number(p) || 0, fv = Number(f) || 0, cv = Number(c) || 0;
    let kc = Number(kcal) || 0;
    if (!kc) kc = Math.round(pv * 4 + fv * 9 + cv * 4);
    const meal = { name: nm, kcal: kc, p: pv, f: fv, c: cv };
    actions.addMeal(date, meal);
    actions.rememberFood(meal);
    setName(""); setKcal(""); setP(""); setF(""); setC("");
  };

  return (
    <Card className="flex flex-col gap-2">
      <div className="text-base font-medium text-ink">Добавить приём пищи</div>
      <div className="relative">
        <input className={inputCls} placeholder="Блюдо" value={name} onChange={(e) => setName(e.target.value)} />
        {suggestions.length > 0 && (
          <div className="absolute z-10 left-0 right-0 bg-surface border border-line rounded-md mt-1 shadow-lg">
            {suggestions.map((fd) => (
              <button key={fd.name} onClick={() => pick(fd)} className="block w-full text-left px-2.5 py-2 border-t border-line/60 first:border-t-0 hover:bg-line/30">
                <div className="text-[13px] font-medium text-ink">{fd.name}</div>
                <div className="text-[12px] text-muted">{fd.kcal} ккал · Б{fd.p} · Ж{fd.f} · У{fd.c}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input className={inputCls} placeholder="Ккал" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} />
        <input className={inputCls} placeholder="Б" inputMode="numeric" value={p} onChange={(e) => setP(e.target.value)} />
        <input className={inputCls} placeholder="Ж" inputMode="numeric" value={f} onChange={(e) => setF(e.target.value)} />
        <input className={inputCls} placeholder="У" inputMode="numeric" value={c} onChange={(e) => setC(e.target.value)} />
      </div>
      <Btn title="Добавить" onClick={add} />
    </Card>
  );
}
