import React from "react";
import { View, Pressable } from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import type { BlockView } from "@summer/state";
import { useActions } from "../../../provider/StoreProvider";
import { BlockRow } from "./BlockRow";

/** Native within-day reorder via react-native-draggable-flatlist.
 *  Long-press a row to drag. Nested in the screen ScrollView (scrollEnabled off). */
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

  if (locked) {
    return (
      <View className="gap-0.5">
        {blocks.map((bv) => (
          <BlockRow key={bv.block.uid} bv={bv} dayDate={dayDate} locked />
        ))}
      </View>
    );
  }

  const renderItem = ({ item, drag, isActive }: RenderItemParams<BlockView>) => (
    <ScaleDecorator>
      <Pressable onLongPress={drag} disabled={isActive}>
        <BlockRow bv={item} dayDate={dayDate} locked={false} />
      </Pressable>
    </ScaleDecorator>
  );

  return (
    <DraggableFlatList
      data={blocks}
      keyExtractor={(b) => b.block.uid}
      scrollEnabled={false}
      activationDistance={12}
      renderItem={renderItem}
      onDragEnd={({ from, to }) => {
        if (from !== to) actions.moveBlock(blocks[from]!.block.uid, dayIndex, to);
      }}
    />
  );
}
