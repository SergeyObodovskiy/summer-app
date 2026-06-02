import type { ComponentType } from "react";
import type { BlockView } from "@summer/state";
// Picked per-platform: BlockList.web.tsx (dnd-kit) / BlockList.native.tsx (draggable-flatlist)
export declare const BlockList: ComponentType<{
  dayIndex: number;
  blocks: BlockView[];
  dayDate: string;
  locked: boolean;
}>;
