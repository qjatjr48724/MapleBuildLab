// src/data/categoryRanges.ts
export type IdRange = { from: number; to: number }; // [from, to)  (to는 미포함)

export type SlotKey =
  | "cap"
  | "medal"
  | "forehead"
  | "eye_acc"
  | "ear_acc"
  | "mantle"
  | "clothes"
  | "pants"
  | "shoes"
  | "gloves"
  | "belt"
  | "pendant"
  | "weapon"
  | "shield"
  | "ring"
  | "pet_acc"
  | "taming_mob"
  | "saddle"
  | "mob_equip";

export const SLOT_TABS: Array<{ key: SlotKey | "all"; label: string }> = [
  { key: "all", label: "ALL" },
  { key: "cap", label: "CAP" },
  { key: "medal", label: "MEDAL" },
  { key: "forehead", label: "FOREHEAD" },
  { key: "eye_acc", label: "EYE ACC" },
  { key: "ear_acc", label: "EAR ACC" },
  { key: "mantle", label: "MANTLE" },
  { key: "clothes", label: "CLOTHES" },
  { key: "pants", label: "PANTS" },
  { key: "shoes", label: "SHOES" },
  { key: "gloves", label: "GLOVES" },
  { key: "belt", label: "BELT" },
  { key: "pendant", label: "PENDANT" },
  { key: "weapon", label: "WEAPON" },
  { key: "shield", label: "SHIELD" },
  { key: "ring", label: "RING" }, // ✅ ring 탭은 1개
  { key: "pet_acc", label: "PET ACC" },
  { key: "taming_mob", label: "TAMING MOB" },
  // 아래 둘은 JSON 범위가 명확하지 않아 일단 탭만 남겨둠(추후 range 추가 가능)
  { key: "saddle", label: "SADDLE" },
  { key: "mob_equip", label: "MOB EQUIP" },
];

/**
 * api_result_category.json 기반으로 뽑은 “슬롯별 ID 범위”
 * - 범위는 [from, to) (to 미포함)
 * - clothes는 Top + Overall 두 범위를 합침
 * - ear_acc는 Earring/Earrings 둘 다 커버하도록 1030000~1040000 사용
 */
export const SLOT_RANGES: Record<SlotKey, IdRange[]> = {
  cap: [{ from: 1000000, to: 1010000 }], // Hat
  forehead: [{ from: 1010000, to: 1020000 }], // Face Accessory
  eye_acc: [{ from: 1020000, to: 1030000 }], // Eye Decoration
  ear_acc: [{ from: 1030000, to: 1040000 }], // Earrings
  clothes: [
    { from: 1040000, to: 1050000 }, // Top
    { from: 1050000, to: 1060000 }, // Overall
  ],
  pants: [{ from: 1060000, to: 1070000 }], // Bottom
  shoes: [{ from: 1070000, to: 1080000 }], // Shoes
  gloves: [{ from: 1080000, to: 1090000 }], // Glove
  shield: [{ from: 1090000, to: 1100000 }], // Shield
  mantle: [{ from: 1100000, to: 1110000 }], // Cape
  ring: [{ from: 1110000, to: 1120000 }], // Ring
  pendant: [{ from: 1120000, to: 1130000 }], // Pendant
  belt: [{ from: 1130000, to: 1140000 }], // Belt
  medal: [{ from: 1140000, to: 1150000 }], // Medal

  // ✅ weapon은 one-handed + two-handed 범위를 넓게 커버(구간이 여러 개라 범용적으로 잡음)
  // (api_result_category.json의 one-handed/two-handed/secondary가 많아서, 일단 1200000~1600000대 무기 전체를 포괄)
  weapon: [{ from: 1200000, to: 1600000 }],

  // ✅ pet_acc / taming
  pet_acc: [{ from: 1800000, to: 1810000 }], // Pet Equipment
  taming_mob: [{ from: 1902000, to: 1993000 }], // Mount

  // 아직 범위 확정이 어려운 것들(우선 비움)
  saddle: [],
  mob_equip: [],
};
