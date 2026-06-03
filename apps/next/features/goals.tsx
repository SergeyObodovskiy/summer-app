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

type Tree = Map<string | undefined, Goal[]>;

function NoteEditor({ goal, onDone }: { goal: Goal; onDone: () => void }) {
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

function AddTaskInput({
  parentId, onDone, autoFocus,
}: { parentId: string; onDone?: () => void; autoFocus?: boolean }) {
  const actions = useActions();
  const [title, setTitle] = useState("");
  const add = () => {
    const t = title.trim();
    if (!t) return;
    actions.addGoal({ title: t, parentId });
    setTitle("");
  };
  return (
    <div className="flex gap-2">
      <input
        className={inputCls}
        value={title}
        autoFocus={autoFocus}
        placeholder="Добавить задачу, например: побывать в Токио"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") add();
          if (e.key === "Escape") onDone?.();
        }}
      />
      <Btn title="+ Задача" variant="ghost" onClick={add} />
    </div>
  );
}

function RowActions({
  goal, onEditNote, onAddChild,
}: { goal: Goal; onEditNote: () => void; onAddChild?: () => void }) {
  const actions = useActions();
  const btn = "text-[12px] text-muted px-1.5 py-0.5 rounded hover:bg-black/5";
  return (
    <span className="flex items-center gap-0.5 shrink-0">
      {onAddChild && (
        <button type="button" title="Добавить вложенную задачу" onClick={onAddChild} className={btn + " hover:text-ink"}>
          +
        </button>
      )}
      <button
        type="button"
        title={goal.note ? "Изменить заметку" : "Добавить заметку"}
        onClick={onEditNote}
        className={btn + " hover:text-ink"}
      >
        ✎
      </button>
      <button type="button" title="Удалить (вместе с вложенными)" onClick={() => actions.removeGoal(goal.id)} className={btn + " hover:text-red-600"}>
        ✕
      </button>
    </span>
  );
}

/** Recursive task row — unlimited nesting depth. */
function TaskNode({ goal, tree }: { goal: Goal; tree: Tree }) {
  const [editingNote, setEditingNote] = useState(false);
  const [adding, setAdding] = useState(false);
  const children = tree.get(goal.id) ?? [];

  return (
    <div className="border-t border-line/60 py-1.5 first:border-t-0">
      <div className="flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
        <span className="text-[13.5px] text-ink flex-1">{goal.title}</span>
        <RowActions goal={goal} onEditNote={() => setEditingNote((v) => !v)} onAddChild={() => setAdding((v) => !v)} />
      </div>
      <div className="ml-3.5">
        {editingNote ? (
          <NoteEditor goal={goal} onDone={() => setEditingNote(false)} />
        ) : goal.note ? (
          <p className="text-[12px] text-muted mt-0.5 whitespace-pre-wrap">{goal.note}</p>
        ) : null}
        {adding && (
          <div className="mt-1.5">
            <AddTaskInput parentId={goal.id} autoFocus onDone={() => setAdding(false)} />
          </div>
        )}
        {children.length > 0 && (
          <div className="mt-1 pl-2 border-l border-line/60">
            {children.map((g) => (
              <TaskNode key={g.id} goal={g} tree={tree} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function countSubtree(id: string, tree: Tree): number {
  const children = tree.get(id) ?? [];
  return children.reduce((acc, c) => acc + 1 + countSubtree(c.id, tree), 0);
}

function GoalCard({ goal, tree }: { goal: Goal; tree: Tree }) {
  const [editingNote, setEditingNote] = useState(false);
  const children = tree.get(goal.id) ?? [];
  const total = countSubtree(goal.id, tree);

  return (
    <Card>
      <div className="flex items-center gap-2">
        <h2 className="text-[15px] font-semibold text-ink flex-1">{goal.title}</h2>
        {total > 0 && (
          <span className="text-[12px] text-muted shrink-0">
            {total} {plural(total, ["задача", "задачи", "задач"])}
          </span>
        )}
        <RowActions goal={goal} onEditNote={() => setEditingNote((v) => !v)} />
      </div>
      {editingNote ? (
        <NoteEditor goal={goal} onDone={() => setEditingNote(false)} />
      ) : goal.note ? (
        <p className="text-[12px] text-muted mt-0.5 whitespace-pre-wrap">{goal.note}</p>
      ) : null}

      {children.length > 0 && (
        <div className="mt-2 ml-1">
          {children.map((g) => (
            <TaskNode key={g.id} goal={g} tree={tree} />
          ))}
        </div>
      )}

      <div className="mt-2">
        <AddTaskInput parentId={goal.id} />
      </div>
    </Card>
  );
}

export function GoalsScreen() {
  const goals = useAppStore((s) => s.goals);
  const clock = useAppStore((s) => s.clock);
  const actions = useActions();
  const [title, setTitle] = useState("");

  const { tops, tree } = useMemo(() => {
    // stable insertion order: createdAt, fallback to the sync clock for old items
    const orderKey = (g: Goal) => g.createdAt ?? clock["goalItem:" + g.id] ?? 0;
    const byInsertion = (a: Goal, b: Goal) =>
      orderKey(a) - orderKey(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    const ids = new Set(goals.map((g) => g.id));
    const tree: Tree = new Map();
    const tops: Goal[] = [];
    for (const g of goals) {
      // orphaned tasks (parent deleted on another device) surface as top-level
      if (g.parentId && ids.has(g.parentId)) {
        if (!tree.has(g.parentId)) tree.set(g.parentId, []);
        tree.get(g.parentId)!.push(g);
      } else {
        tops.push(g);
      }
    }
    // guard against accidental cycles in synced data: drop edges that lead back up
    const reachable = new Set<string>();
    const walk = (id: string) => {
      for (const c of tree.get(id) ?? []) {
        if (reachable.has(c.id)) continue;
        reachable.add(c.id);
        walk(c.id);
      }
    };
    for (const t of tops) {
      reachable.add(t.id);
      walk(t.id);
    }
    for (const g of goals) {
      if (!reachable.has(g.id)) {
        tops.push(g); // node trapped in a cycle — show it at top level
        reachable.add(g.id);
        walk(g.id);
      }
    }
    tops.sort(byInsertion);
    for (const arr of tree.values()) arr.sort(byInsertion);
    return { tops, tree };
  }, [goals, clock]);

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
          Внутри цели можно добавлять задачи с неограниченной вложенностью (кнопка «+» у задачи добавляет вложенную). Цель без задач — просто обычная цель.
        </p>
      </Card>

      {tops.length === 0 && (
        <Card>
          <p className="text-[13px] text-muted">Пока нет целей — добавь первую выше.</p>
        </Card>
      )}

      {tops.map((g) => (
        <GoalCard key={g.id} goal={g} tree={tree} />
      ))}
    </div>
  );
}
