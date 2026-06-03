"use client";

import React, { useMemo, useState } from "react";
import { useAppStore, useActions } from "@summer/client";
import type { Goal } from "@summer/domain";
import { Card, Btn, inputCls } from "../components/ui";

/** russian plural: plural(3, ["задача", "задачи", "задач"]) -> "задачи" */
function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b === 1) return forms[0];
  if (b >= 2 && b <= 4) return forms[1];
  return forms[2];
}

function NoteEditor({
  goal, onDone,
}: { goal: Goal; onDone: () => void }) {
  const actions = useActions();
  const [note, setNote] = useState(goal.note ?? "");
  const save = () => {
    actions.updateGoal(goal.id, { note: note.trim() || undefined });
    onDone();
  };
  return (
    <div className="flex gap-2 mt-1.5">
      <input
        className={inputCls}
        value={note}
        autoFocus
        placeholder="Заметка…"
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") onDone();
        }}
      />
      <Btn title="Сохранить" onClick={save} />
    </div>
  );
}

function RowActions({
  goal, onEditNote,
}: { goal: Goal; onEditNote: () => void }) {
  const actions = useActions();
  return (
    <span className="flex items-center gap-0.5 shrink-0">
      <button
        type="button"
        title={goal.note ? "Изменить заметку" : "Добавить заметку"}
        onClick={onEditNote}
        className="text-[12px] text-muted hover:text-ink px-1.5 py-0.5 rounded hover:bg-black/5"
      >
        ✎
      </button>
      <button
        type="button"
        title="Удалить"
        onClick={() => actions.removeGoal(goal.id)}
        className="text-[13px] text-muted hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-black/5"
      >
        ✕
      </button>
    </span>
  );
}

function SubGoalRow({ goal }: { goal: Goal }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="border-t border-line/60 py-1.5 first:border-t-0">
      <div className="flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
        <span className="text-[13.5px] text-ink flex-1">{goal.title}</span>
        <RowActions goal={goal} onEditNote={() => setEditing((v) => !v)} />
      </div>
      {editing ? (
        <div className="ml-3.5">
          <NoteEditor goal={goal} onDone={() => setEditing(false)} />
        </div>
      ) : goal.note ? (
        <p className="text-[12px] text-muted mt-0.5 ml-3.5 whitespace-pre-wrap">{goal.note}</p>
      ) : null}
    </div>
  );
}

function GoalCard({ goal, subs }: { goal: Goal; subs: Goal[] }) {
  const actions = useActions();
  const [editingNote, setEditingNote] = useState(false);
  const [subTitle, setSubTitle] = useState("");

  const addSub = () => {
    const t = subTitle.trim();
    if (!t) return;
    actions.addGoal({ title: t, parentId: goal.id });
    setSubTitle("");
  };

  return (
    <Card>
      <div className="flex items-center gap-2">
        <h2 className="text-[15px] font-semibold text-ink flex-1">{goal.title}</h2>
        {subs.length > 0 && (
          <span className="text-[12px] text-muted shrink-0">
            {subs.length} {plural(subs.length, ["задача", "задачи", "задач"])}
          </span>
        )}
        <RowActions goal={goal} onEditNote={() => setEditingNote((v) => !v)} />
      </div>
      {editingNote ? (
        <NoteEditor goal={goal} onDone={() => setEditingNote(false)} />
      ) : goal.note ? (
        <p className="text-[12px] text-muted mt-0.5 whitespace-pre-wrap">{goal.note}</p>
      ) : null}

      {subs.length > 0 && (
        <div className="mt-2 ml-1">
          {subs.map((g) => (
            <SubGoalRow key={g.id} goal={g} />
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <input
          className={inputCls}
          value={subTitle}
          placeholder="Добавить задачу, например: побывать в Токио"
          onChange={(e) => setSubTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSub()}
        />
        <Btn title="+ Задача" variant="ghost" onClick={addSub} />
      </div>
    </Card>
  );
}

export function GoalsScreen() {
  const goals = useAppStore((s) => s.goals);
  const actions = useActions();
  const [title, setTitle] = useState("");

  const { tops, subsByParent } = useMemo(() => {
    const subsByParent = new Map<string, Goal[]>();
    const tops: Goal[] = [];
    for (const g of goals) {
      if (g.parentId) {
        if (!subsByParent.has(g.parentId)) subsByParent.set(g.parentId, []);
        subsByParent.get(g.parentId)!.push(g);
      } else tops.push(g);
    }
    // orphaned sub-goals (parent deleted on another device) → show as top-level
    for (const [pid, subs] of subsByParent) {
      if (!tops.some((t) => t.id === pid)) {
        tops.push(...subs);
        subsByParent.delete(pid);
      }
    }
    return { tops, subsByParent };
  }, [goals]);

  const add = () => {
    const t = title.trim();
    if (!t) return;
    actions.addGoal({ title: t });
    setTitle("");
  };

  return (
    <div className="max-w-[1100px] mx-auto p-4 flex flex-col gap-3">
      <h1 className="text-2xl font-medium text-ink">Цели</h1>

      <Card>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className={inputCls}
            value={title}
            placeholder="Новая глобальная цель, например: съездить в Японию"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Btn title="Добавить цель" onClick={add} />
        </div>
        <p className="text-[12px] text-muted mt-2">
          Внутри цели можно добавить задачи (как milestone): «съездить в Японию» → «побывать в Токио», «побывать в Хоккайдо». Цель без задач — просто обычная цель.
        </p>
      </Card>

      {tops.length === 0 && (
        <Card>
          <p className="text-[13px] text-muted">Пока нет целей — добавь первую выше.</p>
        </Card>
      )}

      {tops.map((g) => (
        <GoalCard key={g.id} goal={g} subs={subsByParent.get(g.id) ?? []} />
      ))}
    </div>
  );
}
