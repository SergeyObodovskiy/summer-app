"use client";

import React, { useMemo, useState } from "react";
import { useAppStore, useActions } from "@summer/client";
import type { Goal } from "@summer/domain";
import { Card, Btn, inputCls } from "../components/ui";

const GENERAL = "Общий список";

function GoalRow({ goal }: { goal: Goal }) {
  const actions = useActions();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(goal.note ?? "");

  const saveNote = () => {
    actions.updateGoal(goal.id, { note: note.trim() || undefined });
    setEditing(false);
  };

  return (
    <div className="border-t border-line/60 py-2 first:border-t-0">
      <div className="flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
        <span className="text-[14px] text-ink flex-1">{goal.title}</span>
        <button
          type="button"
          title={goal.note ? "Изменить заметку" : "Добавить заметку"}
          onClick={() => { setNote(goal.note ?? ""); setEditing((v) => !v); }}
          className="text-[12px] text-muted hover:text-ink px-1.5 py-0.5 rounded hover:bg-black/5"
        >
          ✎
        </button>
        <button
          type="button"
          title="Удалить цель"
          onClick={() => actions.removeGoal(goal.id)}
          className="text-[13px] text-muted hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-black/5"
        >
          ✕
        </button>
      </div>
      {editing ? (
        <div className="flex gap-2 mt-1.5 ml-3.5">
          <input
            className={inputCls}
            value={note}
            autoFocus
            placeholder="Заметка к цели…"
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveNote();
              if (e.key === "Escape") setEditing(false);
            }}
          />
          <Btn title="Сохранить" onClick={saveNote} />
        </div>
      ) : goal.note ? (
        <p className="text-[12px] text-muted mt-0.5 ml-3.5 whitespace-pre-wrap">{goal.note}</p>
      ) : null}
    </div>
  );
}

export function GoalsScreen() {
  const goals = useAppStore((s) => s.goals);
  const actions = useActions();

  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("");
  const [note, setNote] = useState("");

  const { groups, general, cats } = useMemo(() => {
    const groups = new Map<string, Goal[]>();
    const general: Goal[] = [];
    for (const g of goals) {
      const c = g.cat?.trim();
      if (c) {
        if (!groups.has(c)) groups.set(c, []);
        groups.get(c)!.push(g);
      } else general.push(g);
    }
    const cats = [...groups.keys()].sort((a, b) => a.localeCompare(b, "ru"));
    return { groups, general, cats };
  }, [goals]);

  const add = () => {
    const t = title.trim();
    if (!t) return;
    actions.addGoal({
      title: t,
      cat: cat.trim() || undefined,
      note: note.trim() || undefined,
    });
    setTitle("");
    setNote("");
  };

  return (
    <div className="max-w-[1100px] mx-auto p-4 flex flex-col gap-3">
      <h1 className="text-2xl font-medium text-ink">Цели</h1>

      <Card>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className={inputCls}
            value={title}
            placeholder="Цель, например: побывать в Амстердаме"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <input
            className={inputCls + " sm:max-w-[220px]"}
            value={cat}
            placeholder="Категория (необязательно)"
            list="goal-cats"
            onChange={(e) => setCat(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <datalist id="goal-cats">
            {cats.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <input
            className={inputCls + " sm:max-w-[260px]"}
            value={note}
            placeholder="Заметка (необязательно)"
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Btn title="Добавить" onClick={add} />
        </div>
        <p className="text-[12px] text-muted mt-2">
          Без категории цель попадает в «{GENERAL}». Укажи категорию (например «Туризм» или «Стройка дома»), чтобы сгруппировать цели.
        </p>
      </Card>

      {goals.length === 0 && (
        <Card>
          <p className="text-[13px] text-muted">Пока нет целей — добавь первую выше.</p>
        </Card>
      )}

      {general.length > 0 && (
        <Card>
          <h2 className="text-[15px] font-semibold text-ink mb-1">{GENERAL}</h2>
          {general.map((g) => (
            <GoalRow key={g.id} goal={g} />
          ))}
        </Card>
      )}

      {cats.map((c) => (
        <Card key={c}>
          <div className="flex items-baseline gap-2 mb-1">
            <h2 className="text-[15px] font-semibold text-ink">{c}</h2>
            <span className="text-[12px] text-muted">{groups.get(c)!.length}</span>
          </div>
          {groups.get(c)!.map((g) => (
            <GoalRow key={g.id} goal={g} />
          ))}
        </Card>
      ))}
    </div>
  );
}
