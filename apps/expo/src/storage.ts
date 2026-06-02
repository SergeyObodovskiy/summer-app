import { MMKV } from "react-native-mmkv";
import type { KVStorage } from "@summer/data";

const mmkv = new MMKV({ id: "summer-app" });

export const mmkvStorage: KVStorage = {
  getString: (key) => mmkv.getString(key) ?? null,
  set: (key, value) => mmkv.set(key, value),
  remove: (key) => mmkv.delete(key),
};
