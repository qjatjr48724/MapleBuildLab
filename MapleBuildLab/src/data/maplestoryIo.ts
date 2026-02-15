// src/data/maplestoryIo.ts
import type { MapleItem } from "../types/item";

export type MapleRegion = "GMS" | "KMS" | "MSEA" | "JMS" | "TMS" | "CMS";

export type MapleApiConfig = {
  region: MapleRegion;
  version: string; // 예: "239", "200" 등
};

// ✅ Vite(.env) 환경변수에서 기본 region/version을 읽습니다.
// - 없으면 fallback: GMS / 200
const REGION_FROM_ENV = (import.meta.env.VITE_MS_REGION ?? "GMS") as MapleRegion;
const VERSION_FROM_ENV = (import.meta.env.VITE_MS_VERSION ?? "200") as string;

export const MAPLE_API_DEFAULT: MapleApiConfig = {
  region: REGION_FROM_ENV,
  version: VERSION_FROM_ENV,
};

export function getItemIconUrl(cfg: MapleApiConfig, itemId: number, resize = 2) {
  // 예: https://maplestory.io/api/GMS/239/item/60467/icon
  return `https://maplestory.io/api/${cfg.region}/${cfg.version}/item/${itemId}/icon?resize=${resize}`;
}

/** 단일 아이템 상세 */
export async function fetchItem(cfg: MapleApiConfig, itemId: number): Promise<MapleItem> {
  const url = `https://maplestory.io/api/${cfg.region}/${cfg.version}/item/${itemId}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`아이템 조회 실패: ${res.status} ${res.statusText} ${text}`);
    }


  const data = (await res.json()) as MapleItem;

  // ✅ name이 없을 수도 있으니 여러 후보에서 추출하고, 없으면 ID로 대체
    const nameCandidate =
    (data as any)?.name ??
    (data as any)?.itemName ??
    (data as any)?.meta?.name ??
    (data as any)?.data?.name;

    const safeName = typeof nameCandidate === "string" && nameCandidate.trim()
    ? nameCandidate
    : `#${itemId}`;


    // ✅ spread를 먼저 하고 id/name을 마지막에 확정 (타입 충돌 방지)
    return {
        ...data,
        id: itemId,
        name: safeName,
        };

    }

/** item/list 응답용 요약 타입 (보통 id/name) */
export type MapleItemSummary = {
  id: number;
  name: string;
  [key: string]: unknown;
};

/** 전체 아이템 개수 */
export async function fetchItemCount(cfg: MapleApiConfig): Promise<number> {
  const url = `https://maplestory.io/api/${cfg.region}/${cfg.version}/item/count`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`아이템 count 조회 실패: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as unknown;

  // API가 number 또는 { count: number } 둘 다 대응
  if (typeof data === "number") return data;
  if (typeof (data as any)?.count === "number") return (data as any).count;

  throw new Error("item/count 응답 형식을 해석할 수 없습니다.");
}

/**
 * 아이템 목록 페이지 조회
 * ⚠️ 쿼리 파라미터 이름이 구현에 따라 다를 수 있어서 후보를 순서대로 시도합니다.
 */
export async function fetchItemList(
  cfg: MapleApiConfig,
  opts: { start: number; count: number }
): Promise<MapleItemSummary[]> {
  const base = `https://maplestory.io/api/${cfg.region}/${cfg.version}/item/list`;

  const candidates = [
    `${base}?startPosition=${opts.start}&count=${opts.count}`,
    `${base}?start=${opts.start}&count=${opts.count}`,
    `${base}?offset=${opts.start}&limit=${opts.count}`,
  ];

  for (const url of candidates) {
    const res = await fetch(url);
    if (!res.ok) continue;

    const data = (await res.json()) as unknown;

    if (Array.isArray(data)) return data as MapleItemSummary[];
    if (Array.isArray((data as any)?.items)) return (data as any).items as MapleItemSummary[];
  }

  throw new Error("item/list 조회 실패: 서버 응답 형식을 확인해야 합니다.");
}
