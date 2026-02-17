// src/types/item.ts
export type MapleItemTypeInfo = {
  overallCategory?: string; // "Equip"
  category?: string;        // "Accessory", "Armor" 등
  subCategory?: string;     // "Face Accessory" 등
  lowItemId?: number;
  highItemId?: number;
};

export type MapleItem = {
  id: number;
  name: string;

  desc?: string;

  // ✅ 장착 조건/메타
  requiredJobs?: string[];     // ["Beginner"] 같은 식
  requiredLevel?: number;
  requiredGender?: number;
  isCash?: boolean;

  // ✅ 분류 정보
  typeInfo?: MapleItemTypeInfo;

  // 실제 응답에는 더 많은 필드가 있을 수 있어서 느슨하게 받기
  [key: string]: unknown;
};

export type ItemSearchResult = {
  id: number;
  name: string;
  iconUrl: string;
};
