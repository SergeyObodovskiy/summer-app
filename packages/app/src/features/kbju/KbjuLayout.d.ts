import type { ComponentType } from "react";
import type { FoodItem } from "@summer/domain";
import type { KbView } from "./useKbju";
// Picked per-platform: KbjuLayout.web.tsx / KbjuLayout.native.tsx
export declare const KbjuLayout: ComponentType<{ kb: KbView; foods: Record<string, FoodItem> }>;
