// src/types/item.ts
export type MapleItem = {
  id: number;
  name: string;
  desc?: string;
  // 실제 응답에는 더 많은 필드가 있을 수 있어서 느슨하게 받기
  [key: string]: unknown;
};

export type ItemSearchResult = {
  id: number;
  name: string;
  iconUrl: string;
};
