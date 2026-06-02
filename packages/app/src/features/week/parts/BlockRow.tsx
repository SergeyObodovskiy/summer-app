import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { Txt, Checkbox, Tag } from "@summer/ui";
import type { BlockView } from "@summer/state";
import { useActions } from "../../../provider/StoreProvider";
import { CheckinSection } from "./CheckinSection";

/** Shared activity row: checkbox = done; tap on the item = open check-in. */
export function BlockRow({
  bv,
  dayDate,
  locked,
}: {
  bv: BlockView;
  dayDate: string;
  locked: boolean;
}) {
  const actions = useActions();
  const [open, setOpen] = useState(false);

  return (
    <View className="border-t border-line/60 py-1.5">
      <View className="flex-row items-center gap-2">
        <Checkbox
          checked={bv.done}
          disabled={locked}
          onChange={(next) => actions.toggleBlock(bv.block.uid, next)}
        />
        <Pressable
          disabled={locked}
          onPress={() => setOpen((v) => !v)}
          className="flex-row items-center gap-2 flex-1"
        >
          <Txt className="text-[12px] text-muted w-[88px]">{bv.time}</Txt>
          <View className="flex-row items-center gap-1.5 flex-1">
            <Txt className={`text-[13px] ${bv.done ? "text-muted line-through" : "text-ink"}`}>
              {bv.block.act}
            </Txt>
            <Tag kind={bv.block.tag} />
          </View>
        </Pressable>
      </View>

      {open && !locked ? (
        <CheckinSection bv={bv} dayDate={dayDate} onDone={() => setOpen(false)} />
      ) : null}
    </View>
  );
}
