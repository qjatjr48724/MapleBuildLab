// src/components/ItemListPanel.tsx
import React from "react";
import {
  fetchItemCount,
  fetchItemList,
  fetchItemListFiltered,
  getItemIconUrl,
  MAPLE_API_DEFAULT,
  type MapleApiConfig,
  type MapleItemSummary,
} from "../data/maplestoryIo";
import { SLOT_TABS, type SlotKey } from "../data/categoryRanges";

type Props = {
  apiConfig?: MapleApiConfig;
  onPickItem?: (item: MapleItemSummary, rect: DOMRect) => void;
  isEquippedId?: (itemId: number) => boolean;
};

type TabFilter =
  | {
      mode: "all";
    }
  | {
      mode: "filter";
      // 한 탭이 여러 필터를 합쳐야 할 수 있음(예: clothes = top + overall)
      filters: Array<{
        overallCategoryFilter: string; // "equip"
        categoryFilter?: string; // "armor" / "accessory"
        subCategoryFilter?: string; // "hat" ...
      }>;
    };

// ✅ 탭 -> API 필터 매핑 (너가 말한 방식 그대로)
const TAB_FILTERS: Record<SlotKey, TabFilter> = {
  cap: { mode: "filter", filters: [{ overallCategoryFilter: "equip", categoryFilter: "armor", subCategoryFilter: "hat" }] },
  medal: { mode: "filter", filters: [{ overallCategoryFilter: "equip", categoryFilter: "accessory", subCategoryFilter: "medal" }] },
  forehead: { mode: "filter", filters: [{ overallCategoryFilter: "equip", categoryFilter: "accessory", subCategoryFilter: "face accessory" }] },
  eye_acc: { mode: "filter", filters: [{ overallCategoryFilter: "equip", categoryFilter: "accessory", subCategoryFilter: "eye decoration" }] },
  ear_acc: { mode: "filter", filters: [{ overallCategoryFilter: "equip", categoryFilter: "accessory", subCategoryFilter: "earrings" }] },

  mantle: { mode: "filter", filters: [{ overallCategoryFilter: "equip", categoryFilter: "armor", subCategoryFilter: "cape" }] },

  clothes: {
    mode: "filter",
    filters: [
      { overallCategoryFilter: "equip", categoryFilter: "armor", subCategoryFilter: "top" },
      { overallCategoryFilter: "equip", categoryFilter: "armor", subCategoryFilter: "overall" },
    ],
  },

  pants: { mode: "filter", filters: [{ overallCategoryFilter: "equip", categoryFilter: "armor", subCategoryFilter: "bottom" }] },
  shoes: { mode: "filter", filters: [{ overallCategoryFilter: "equip", categoryFilter: "armor", subCategoryFilter: "shoes" }] },
  gloves: { mode: "filter", filters: [{ overallCategoryFilter: "equip", categoryFilter: "armor", subCategoryFilter: "glove" }] },
  belt: { mode: "filter", filters: [{ overallCategoryFilter: "equip", categoryFilter: "accessory", subCategoryFilter: "belt" }] },
  pendant: { mode: "filter", filters: [{ overallCategoryFilter: "equip", categoryFilter: "accessory", subCategoryFilter: "pendant" }] },
  shield: { mode: "filter", filters: [{ overallCategoryFilter: "equip", categoryFilter: "armor", subCategoryFilter: "shield" }] },

  ring: { mode: "filter", filters: [{ overallCategoryFilter: "equip", categoryFilter: "accessory", subCategoryFilter: "ring" }] },

  // weapon은 서버 표기가 다양할 수 있어서 “category=one-handed weapon / two-handed weapon”로 먼저 시도
  weapon: {
    mode: "filter",
    filters: [
      { overallCategoryFilter: "equip", categoryFilter: "one-handed weapon" },
      { overallCategoryFilter: "equip", categoryFilter: "two-handed weapon" },
    ],
  },

  pet_acc: { mode: "filter", filters: [{ overallCategoryFilter: "equip", categoryFilter: "other", subCategoryFilter: "pet equipment" }] },
  taming_mob: { mode: "filter", filters: [{ overallCategoryFilter: "equip", categoryFilter: "mount", subCategoryFilter: "mount" }] },

  // 아직 미정이면 일단 ALL에서 검색하도록 비워두기(탭은 있지만 데이터는 0일 수 있음)
  saddle: { mode: "filter", filters: [] },
  mob_equip: { mode: "filter", filters: [] },
};

export default function ItemListPanel({ apiConfig, onPickItem, isEquippedId }: Props) {
  const cfg = apiConfig ?? MAPLE_API_DEFAULT;

  const PAGE_SIZE_ALL = 240;
  const PAGE_SIZE_FILTER = 120;

  const [activeTab, setActiveTab] = React.useState<SlotKey | "all">("all");
  const [total, setTotal] = React.useState<number | null>(null);
  const [items, setItems] = React.useState<MapleItemSummary[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  const [allCursor, setAllCursor] = React.useState(0);
  const [filterCursor, setFilterCursor] = React.useState(0);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((it) => {
      const name = String(it.name ?? "").toLowerCase();
      const id = String(it.id ?? "");
      return name.includes(q) || id.includes(q);
    });
  }, [items, query]);

  function mergeDedupe(prev: MapleItemSummary[], next: MapleItemSummary[]) {
    const map = new Map<number, MapleItemSummary>();
    for (const it of prev) map.set(it.id, it);
    for (const it of next) map.set(it.id, it);
    return Array.from(map.values());
  }

  async function loadInitial() {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === "all") {
        const [cnt, list] = await Promise.all([
          fetchItemCount(cfg),
          fetchItemList(cfg, { start: 0, count: PAGE_SIZE_ALL }),
        ]);
        setTotal(cnt);
        setItems(list);
        setAllCursor(list.length);
        setFilterCursor(0);
      } else {
        const def = TAB_FILTERS[activeTab];
        setTotal(null);
        setAllCursor(0);
        setFilterCursor(0);

        if (def.mode === "filter" && def.filters.length > 0) {
          // 첫 페이지 로드
          const chunk = await loadFilteredPage(0);
          setItems(chunk);
          setFilterCursor(PAGE_SIZE_FILTER);
        } else {
          setItems([]);
        }
      }
      setSelectedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  async function loadFilteredPage(startPosition: number) {
    if (activeTab === "all") return [];

    const def = TAB_FILTERS[activeTab];
    if (def.mode !== "filter" || def.filters.length === 0) return [];

    // 여러 필터를 합쳐야 하는 탭(top+overall, one-handed+two-handed 등)
    const results = await Promise.all(
      def.filters.map((f) =>
        fetchItemListFiltered(cfg, {
          startPosition,
          count: PAGE_SIZE_FILTER,
          overallCategoryFilter: f.overallCategoryFilter,
          categoryFilter: f.categoryFilter,
          subCategoryFilter: f.subCategoryFilter,
        }).catch(() => [])
      )
    );

    const merged = results.flat();
    return merged;
  }

  async function loadMore() {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      if (activeTab === "all") {
        if (total != null && allCursor >= total) return;
        const next = await fetchItemList(cfg, { start: allCursor, count: PAGE_SIZE_ALL });
        setItems((prev) => mergeDedupe(prev, next));
        setAllCursor((c) => c + next.length);
      } else {
        const nextStart = filterCursor;
        const next = await loadFilteredPage(nextStart);
        setItems((prev) => mergeDedupe(prev, next));
        setFilterCursor((c) => c + PAGE_SIZE_FILTER);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    setItems([]);
    setQuery("");
    setSelectedId(null);
    void loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, cfg.region, cfg.version]);

  function handlePick(it: MapleItemSummary, rect: DOMRect) {
    setSelectedId(it.id);
    onPickItem?.(it, rect);
  }

  const canLoadMore = activeTab === "all" ? (total == null ? true : allCursor < total) : true;

  return (
    <section className="panel">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h2 className="panelTitle" style={{ margin: 0 }}>
          전체 아이템 목록
        </h2>
        <div style={{ fontSize: 12, color: "#666" }}>
          {activeTab === "all"
            ? total == null
              ? "불러오는 중…"
              : `총 ${total.toLocaleString()}개`
            : "필터 조회(item/list + category params)"}
        </div>
      </div>

      {/* ✅ 탭 UI 개선: 선택=검정배경/흰글씨 */}
      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {SLOT_TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key as any)}
              style={{
                borderRadius: 12,
                padding: "8px 12px",
                minHeight: 36,
                border: "1px solid #111",
                background: active ? "#111" : "#fff",
                color: active ? "#fff" : "#111",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 또는 ID 검색 (현재 불러온 결과에서 필터)"
          className="input"
        />
        <button onClick={() => void loadInitial()} disabled={loading} className="button">
          새로고침
        </button>
      </div>

      {error && (
        <div className="error" style={{ marginTop: 10 }}>
          오류: {error}
        </div>
      )}

      <div
        style={{
          marginTop: 10,
          maxHeight: 420,
          overflow: "auto",
          border: "1px solid #eee",
          borderRadius: 8,
          background: "white",
        }}
      >
        <ul
          style={{
            listStyle: "none",
            padding: 10,
            margin: 0,
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          }}
        >
          {filtered.map((it) => {
            const isSel = it.id === selectedId;
            const equipped = isEquippedId?.(it.id) ?? false;

            const tooltipLines = [
              `${it.name}`,
              `ID: ${it.id}`,
              it?.typeInfo?.overallCategory
                ? `${it.typeInfo.overallCategory} / ${it.typeInfo.category} / ${it.typeInfo.subCategory}`
                : "",
              Array.isArray(it.requiredJobs) && it.requiredJobs.length > 0
                ? `요구 직업: ${it.requiredJobs.join(", ")}`
                : "",
              typeof it.requiredLevel === "number" ? `요구 레벨: ${it.requiredLevel}` : "",
              it.isCash ? "캐시 아이템" : "",
            ].filter(Boolean);

            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                    handlePick(it, rect);
                  }}
                  title={tooltipLines.join("\n")}
                  style={{
                    width: "100%",
                    borderRadius: 10,
                    border: "1px solid #e5e5e5",
                    background: equipped
                      ? "rgba(76, 175, 80, 0.18)"
                      : isSel
                      ? "rgba(255, 235, 59, 0.22)"
                      : "white",
                    padding: 10,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "grid",
                    gridTemplateColumns: "40px 1fr",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <img
                    src={getItemIconUrl(cfg, it.id, 2)}
                    alt={String(it.name)}
                    width={40}
                    height={40}
                    style={{ imageRendering: "pixelated" }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "#000",
                      }}
                    >
                      {it.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>
                      {equipped ? "착용중 · " : ""}
                      ID: {it.id}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "#666" }}>
          현재 불러온 개수: {items.length.toLocaleString()} (표시: {filtered.length.toLocaleString()})
        </div>

        <button onClick={() => void loadMore()} disabled={loading || !canLoadMore} className="button">
          {loading ? "불러오는 중…" : canLoadMore ? "더 불러오기" : "끝"}
        </button>
      </div>
    </section>
  );
}
