// src/data/maplestoryIo.ts
import type { MapleItem } from "../types/item";

export type MapleRegion = "GMS" | "KMS" | "MSEA" | "JMS" | "TMS" | "CMS";

export type MapleApiConfig = {
  region: MapleRegion;
  version: string; // 예: "239", "62" 등
};

// Vite 환경변수에서 기본 region/version을 읽습니다.
// .env에 없으면 fallback으로 GMS / 200을 사용합니다.
const REGION_FROM_ENV = (import.meta.env.VITE_MS_REGION ?? "GMS") as MapleRegion;
const VERSION_FROM_ENV = (import.meta.env.VITE_MS_VERSION ?? "200") as string;

export const MAPLE_API_DEFAULT: MapleApiConfig = {
  region: REGION_FROM_ENV,
  version: VERSION_FROM_ENV,
};


export function getItemIconUrl(cfg: MapleApiConfig, itemId: number, resize = 2) {
  // 아이콘은 실제로 이런 형태로 많이 사용됨
  // 예: https://maplestory.io/api/GMS/239/item/60467/icon
  return `https://maplestory.io/api/${cfg.region}/${cfg.version}/item/${itemId}/icon?resize=${resize}`;
}

export async function fetchItem(cfg: MapleApiConfig, itemId: number): Promise<MapleItem> {
  const url = `https://maplestory.io/api/${cfg.region}/${cfg.version}/item/${itemId}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`아이템 조회 실패: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as MapleItem;

  // 방어적으로 id/name 없으면 에러
  if (typeof data?.name !== "string") {
    throw new Error("아이템 응답에 name이 없습니다.");
  }

  return {
    ...data,
    id: itemId,
    name: data.name,
  };
}
