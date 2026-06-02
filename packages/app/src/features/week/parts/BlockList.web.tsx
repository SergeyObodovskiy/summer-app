import React from "react";
import { View } from "react-native";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BlockView } from "@summer/state";
import { useActions } from "../../../provider/StoreProvider";
import { BlockRow } from "./BlockRow";

/** Web drag-and-drop within a day via dnd-kit. This file is web-only,
 *  so it may use DOM elements (div/span) directly for the drag nodes. */
function SortableRow({ bv, dayDate }: { bv: BlockView; dayDate: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: bv.block.uid,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: "flex",
    alignItems: "center",
  };
  return (
    <div ref={setNodeRef} style={style}>
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: "grab", padding: "0 6px", color: "#c4c4bd", touchAction: "none", userSelect: "none" }}
      >
        ⠿
      </span>
      <div style={{ flex: 1 }}>
        <BlockRow bv={bv} dayDate={dayDate} locked={false} />
      </div>
    </div>
  );
}

export function BlockList({
  dayIndex,
  blocks,
  dayDate,
  locked,
}: {
  dayIndex: number;
  blocks: BlockView[];
  dayDate: string;
  locked: boolean;
}) {
  const actions = useActions();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (locked) {
    return (
      <View className="gap-0.5">
        {blocks.map((bv) => (
          <BlockRow key={bv.block.uid} bv={bv} dayDate={dayDate} locked />
        ))}
      </View>
    );
  }

  const ids = blocks.map((b) => b.block.uid);
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const to = ids.indexOf(String(over.id));
    if (to >= 0) actions.moveBlock(String(active.id), dayIndex, to);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <View className="gap-0.5">
          {blocks.map((bv) => (
            <SortableRow key={bv.block.uid} bv={bv} dayDate={dayDate} />
          ))}
        </View>
      </SortableContext>
    </DndContext>
  );
}
