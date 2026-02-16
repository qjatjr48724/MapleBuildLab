// src/data/slotTags.ts
import type { MapleApiConfig } from "./maplestoryIo";

// itemId -> slotKey
export type SlotTagMap = Record<number, string>;

function key(cfg: MapleApiConfig) {
  return `mbl_slot_tags_v1_${cfg.region}_${cfg.version}`;
}

export function loadSlotTags(cfg: MapleApiConfig): SlotTagMap {
  try {
    const raw = localStorage.getItem(key(cfg));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as SlotTagMap;
  } catch {
    return {};
  }
}

export function saveSlotTags(cfg: MapleApiConfig, tags: SlotTagMap) {
  try {
    localStorage.setItem(key(cfg), JSON.stringify(tags));
  } catch {
    // 용량/권한 문제 등은 앱이 죽지 않게 무시
  }
}
