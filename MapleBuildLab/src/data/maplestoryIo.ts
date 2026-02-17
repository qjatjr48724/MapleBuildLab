// src/data/maplestoryIo.ts
import type { MapleItem } from "../types/item";

export type MapleRegion = "GMS" | "KMS" | "MSEA" | "JMS" | "TMS" | "CMS";

export type MapleApiConfig = {
  region: MapleRegion;
  version: string;
};

const REGION_FROM_ENV = (import.meta.env.VITE_MS_REGION ?? "GMS") as MapleRegion;
const VERSION_FROM_ENV = (import.meta.env.VITE_MS_VERSION ?? "200") as string;

export const MAPLE_API_DEFAULT: MapleApiConfig = {
  region: REGION_FROM_ENV,
  version: VERSION_FROM_ENV,
};

export function getItemIconUrl(cfg: MapleApiConfig, itemId: number, resize = 2) {
  return `https://maplestory.io/api/${cfg.region}/${cfg.version}/item/${itemId}/icon?resize=${resize}`;
}

export async function fetchItem(cfg: MapleApiConfig, itemId: number): Promise<MapleItem> {
  const url = `https://maplestory.io/api/${cfg.region}/${cfg.version}/item/${itemId}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`아이템 조회 실패: ${res.status} ${res.statusText} ${text}`);
  }

  const data = (await res.json()) as MapleItem;

  const nameCandidate =
    (data as any)?.name ??
    (data as any)?.itemName ??
    (data as any)?.meta?.name ??
    (data as any)?.data?.name;

  const safeName =
    typeof nameCandidate === "string" && nameCandidate.trim() ? nameCandidate : `#${itemId}`;

  return {
    ...data,
    id: itemId,
    name: safeName,
  };
}

export type MapleItemSummary = {
  id: number;
  name: string;
  requiredJobs?: string[];
  requiredLevel?: number;
  requiredGender?: number;
  isCash?: boolean;
  typeInfo?: any;
  [key: string]: unknown;
};

export async function fetchItemCount(cfg: MapleApiConfig): Promise<number> {
  const url = `https://maplestory.io/api/${cfg.region}/${cfg.version}/item/count`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`아이템 count 조회 실패: ${res.status} ${res.statusText}`);

  const data = (await res.json()) as unknown;

  if (typeof data === "number") return data;
  if (typeof (data as any)?.count === "number") return (data as any).count;

  throw new Error("item/count 응답 형식을 해석할 수 없습니다.");
}

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

/**
 * ✅ 탭 필터 조회용 (너가 말한 방식)
 * 예:
 * /item/list?startPosition=0&count=60&overallCategoryFilter=equip&categoryFilter=armor&subCategoryFilter=hat
 */
export async function fetchItemListFiltered(
  cfg: MapleApiConfig,
  opts: {
    startPosition: number;
    count: number;
    overallCategoryFilter?: string; // "equip"
    categoryFilter?: string; // "armor" / "accessory"
    subCategoryFilter?: string; // "hat" / "ring" ...
  }
): Promise<MapleItemSummary[]> {
  const base = `https://maplestory.io/api/${cfg.region}/${cfg.version}/item/list`;

  const sp = new URLSearchParams();
  sp.set("startPosition", String(opts.startPosition));
  sp.set("count", String(opts.count));

  if (opts.overallCategoryFilter) sp.set("overallCategoryFilter", opts.overallCategoryFilter);
  if (opts.categoryFilter) sp.set("categoryFilter", opts.categoryFilter);
  if (opts.subCategoryFilter) sp.set("subCategoryFilter", opts.subCategoryFilter);

  const url = `${base}?${sp.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`필터 목록 조회 실패: ${res.status} ${res.statusText} ${text}`);
  }

  const data = (await res.json()) as unknown;

  if (Array.isArray(data)) return data as MapleItemSummary[];
  if (Array.isArray((data as any)?.items)) return (data as any).items as MapleItemSummary[];

  throw new Error("필터 item/list 응답 형식을 해석할 수 없습니다.");
}
