"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore, useActions } from "@summer/client";
import type { Goal } from "@summer/domain";
import { Card } from "../components/ui";

/* Apple Notes-style outline editor:
   - every row is always editable text (no edit mode)
   - Enter -> new row below (same level; if the row has children -> first child)
   - Tab / Shift+Tab -> indent / outdent
   - Backspace on an empty childless row -> delete it, focus the row above
   - hover actions: note (✎) and delete subtree (✕) */

const PHANTOM = "__new_goal__";

type Tree = Map<string, Goal[]>;
interface FlatRow {
  goal: Goal;
  depth: number;
}

function NoteEditor({ goal, onDone }: { goal: Goal; onDone: () => void }) {
  const actions = useActions();
  const [note, setNote] = useState(goal.note ?? "");
  const save = () => {
    actions.updateGoal(goal.id, { note: note.trim() || undefined });
    onDone();
  };
  return (
    <input
      className="w-full bg-transparent text-[12px] text-muted placeholder:text-muted/60 focus:outline-none border-b border-line/60 focus:border-ring py-0.5"
      value={note}
      autoFocus
      placeholder="Заметка… (Enter — сохранить, Esc — отмена)"
      onChange={(e) => setNote(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") onDone();
      }}
    />
  );
}

function Row({
  row, focused, onFocused, onKeyDown,
}: {
  row: FlatRow;
  focused: boolean;
  onFocused: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, row: FlatRow, value: string) => void;
}) {
  const actions = useActions();
  const { goal, depth } = row;
  const [val, setVal] = useState(goal.title);
  const [noteOpen, setNoteOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  // external change (sync) -> refresh local value
  useEffect(() => setVal(goal.title), [goal.title]);

  useEffect(() => {
    if (focused && ref.current) {
      ref.current.focus();
      const len = ref.current.value.length;
      ref.current.setSelectionRange(len, len);
      onFocused();
    }
  }, [focused, onFocused]);

  const top = depth === 0;
  const btn = "opacity-0 group-hover:opacity-100 text-[12px] text-muted px-1 rounded hover:bg-black/5 transition-opacity";

  return (
    <div className="group" style={{ paddingLeft: depth * 20 }}>
      <div className="flex items-center gap-2">
        {top ? null : <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />}
        <input
          ref={ref}
          className={
            "flex-1 bg-transparent focus:outline-none py-1 " +
            (top ? "text-[15px] font-semibold text-ink" : "text-[13.5px] text-ink")
          }
          value={val}
          placeholder={top ? "Цель…" : "Задача…"}
          onChange={(e) => {
            setVal(e.target.value);
            actions.updateGoal(goal.id, { title: e.target.value });
          }}
          onKeyDown={(e) => onKeyDown(e, row, val)}
        />
        <button type="button" title={goal.note ? "Изменить заметку" : "Заметка"} onClick={() => setNoteOpen((v) => !v)} className={btn + " hover:text-ink"}>
          ✎
        </button>
        <button type="button" title="Удалить (вместе с вложенными)" onClick={() => actions.removeGoal(goal.id)} className={btn + " hover:text-red-600"}>
          ✕
        </button>
      </div>
      {(noteOpen || goal.note) && (
        <div style={{ paddingLeft: top ? 0 : 14 }} className="pr-10">
          {noteOpen ? (
            <NoteEditor goal={goal} onDone={() => setNoteOpen(false)} />
          ) : (
            <p className="text-[12px] text-muted whitespace-pre-wrap cursor-text" onClick={() => setNoteOpen(true)}>
              {goal.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function GoalsScreen() {
  const goals = useAppStore((s) => s.goals);
  const clock = useAppStore((s) => s.clock);
  const actions = useActions();
  const [focusId, setFocusId] = useState<string | null>(null);
  const [phantom, setPhantom] = useState("");
  const phantomRef = useRef<HTMLInputElement>(null);

  const orderKey = useMemo(() => {
    return (g: Goal) => g.order ?? g.createdAt ?? clock["goalItem:" + g.id] ?? 0;
  }, [clock]);

  const { tops, tree, rows } = useMemo(() => {
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
    // cycle guard for synced data: unreachable nodes surface as top-level
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
        tops.push(g);
        reachable.add(g.id);
        walk(g.id);
      }
    }
    tops.sort(byInsertion);
    for (const arr of tree.values()) arr.sort(byInsertion);

    const rows: FlatRow[] = [];
    const flatten = (list: Goal[], depth: number) => {
      for (const g of list) {
        rows.push({ goal: g, depth });
        flatten(tree.get(g.id) ?? [], depth + 1);
      }
    };
    flatten(tops, 0);
    return { tops, tree, rows };
  }, [goals, orderKey]);

  const siblingsOf = (parentId: string | undefined): Goal[] =>
    parentId ? tree.get(parentId) ?? [] : tops;

  /** order value that places an item between siblings i and i+1 */
  const between = (sibs: Goal[], i: number): number => {
    const ga = i >= 0 ? sibs[i] : undefined;
    const gb = i + 1 < sibs.length ? sibs[i + 1] : undefined;
    const a = ga ? orderKey(ga) : undefined;
    const b = gb ? orderKey(gb) : undefined;
    if (a === undefined && b === undefined) return Date.now();
    if (a === undefined) return b! - 1000;
    if (b === undefined) return a + 1000;
    return (a + b) / 2;
  };

  const onRowKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: FlatRow, value: string) => {
    const g = row.goal;
    const sibs = siblingsOf(g.parentId);
    const idx = sibs.findIndex((s) => s.id === g.id);
    const children = tree.get(g.id) ?? [];

    if (e.key === "Enter") {
      e.preventDefault();
      // row with children -> new row becomes its first child (visually right below)
      const id = children.length
        ? actions.addGoal({ title: "", parentId: g.id, order: between(children, -1) })
        : actions.addGoal({ title: "", parentId: g.parentId, order: between(sibs, idx) });
      setFocusId(id);
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      const prev = idx > 0 ? sibs[idx - 1] : undefined;
      if (!prev) return; // nothing to nest under
      const newSibs = tree.get(prev.id) ?? [];
      actions.updateGoal(g.id, { parentId: prev.id, order: between(newSibs, newSibs.length - 1) });
      setFocusId(g.id);
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      if (!g.parentId) return; // already top-level
      const parent = goals.find((p) => p.id === g.parentId);
      const parentSibs = siblingsOf(parent?.parentId);
      const pIdx = parentSibs.findIndex((s) => s.id === g.parentId);
      actions.updateGoal(g.id, { parentId: parent?.parentId, order: between(parentSibs, pIdx) });
      setFocusId(g.id);
    } else if (e.key === "Backspace" && value === "" && children.length === 0) {
      e.preventDefault();
      const i = rows.findIndex((r) => r.goal.id === g.id);
      actions.removeGoal(g.id);
      const prevRow = i > 0 ? rows[i - 1] : undefined;
      setFocusId(prevRow ? prevRow.goal.id : PHANTOM);
    }
  };

  // phantom bottom row: start typing -> it becomes a real top-level goal
  const onPhantomChange = (v: string) => {
    if (!v) {
      setPhantom("");
      return;
    }
    const lastTop = tops[tops.length - 1];
    const last = lastTop ? orderKey(lastTop) + 1000 : Date.now();
    const id = actions.addGoal({ title: v, order: last });
    setPhantom("");
    setFocusId(id);
  };

  useEffect(() => {
    if (focusId === PHANTOM && phantomRef.current) {
      phantomRef.current.focus();
      setFocusId(null);
    }
  }, [focusId]);

  return (
    <div className="max-w-[1100px] mx-auto p-4 flex flex-col gap-3">
      <h1 className="text-2xl font-medium text-ink">Цели</h1>

      <Card>
        {rows.map((r) => (
          <Row
            key={r.goal.id}
            row={r}
            focused={focusId === r.goal.id}
            onFocused={() => setFocusId(null)}
            onKeyDown={onRowKeyDown}
          />
        ))}

        <div className="flex items-center gap-2">
          <input
            ref={phantomRef}
            className="flex-1 bg-transparent focus:outline-none py-1 text-[15px] font-semibold text-ink placeholder:font-normal placeholder:text-muted/60"
            value={phantom}
            placeholder={rows.length ? "Новая цель…" : "Новая цель, например: съездить в Японию"}
            onChange={(e) => onPhantomChange(e.target.value)}
          />
        </div>

        <p className="text-[11.5px] text-muted/80 mt-3 border-t border-line/60 pt-2">
          Enter — новая строка · Tab — вложить · Shift+Tab — наружу · Backspace на пустой — удалить · ✎/✕ — по наведению
        </p>
      </Card>
    </div>
  );
}
