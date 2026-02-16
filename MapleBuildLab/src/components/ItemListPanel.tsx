// src/components/ItemListPanel.tsx
import { useEffect, useMemo, useState } from "react";
import {
  fetchItemCount,
  fetchItemList,
  getItemIconUrl,
  MAPLE_API_DEFAULT,
  type MapleApiConfig,
  type MapleItemSummary,
} from "../data/maplestoryIo";

type Props = {
  apiConfig?: MapleApiConfig;
  onPickItem?: (item: MapleItemSummary, rect: DOMRect) => void;
  isEquippedId?: (itemId: number) => boolean;

  // ✅ itemId -> slotKey (태깅 정보)
  slotTagById?: Record<number, string | undefined>;
};

type ItemCacheV1 = {
  version: 1;
  savedAt: number;
  total: number | null;
  cursor: number;
  items: MapleItemSummary[];
};

function cacheKey(cfg: MapleApiConfig) {
  return `mbl_item_cache_v1_${cfg.region}_${cfg.version}`;
}

const SLOT_TABS: Array<{ key: string; label: string }> = [
  { key: "cap", label: "CAP" },
  { key: "medal", label: "MEDAL" },
  { key: "forehead", label: "FOREHEAD" },
  { key: "eye_acc", label: "EYE" },
  { key: "ear_acc", label: "EAR" },
  { key: "mantle", label: "MANTLE" },
  { key: "clothes", label: "CLOTHES" },
  { key: "pants", label: "PANTS" },
  { key: "gloves", label: "GLOVES" },
  { key: "belt", label: "BELT" },
  { key: "shoes", label: "SHOES" },
  { key: "pendant", label: "PENDANT" },
  { key: "weapon", label: "WEAPON" },
  { key: "shield", label: "SHIELD" },
  { key: "ring1", label: "RING1" },
  { key: "ring2", label: "RING2" },
  { key: "ring3", label: "RING3" },
  { key: "ring4", label: "RING4" },
  { key: "taming_mob", label: "TAMING" },
  { key: "saddle", label: "SADDLE" },
  { key: "mob_equip", label: "MOB EQUIP" },
  { key: "pet_acc", label: "PET ACC" },
];

type TopTab = "all" | "tagged" | "untagged" | "equipped";

export default function ItemListPanel({ apiConfig, onPickItem, isEquippedId, slotTagById }: Props) {
  const cfg = apiConfig ?? MAPLE_API_DEFAULT;

  const PAGE_SIZE = 240;
  const CACHE_MAX_ITEMS = 2000;

  const [total, setTotal] = useState<number | null>(null);
  const [items, setItems] = useState<MapleItemSummary[]>([]);
  const [cursor, setCursor] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [cacheReady, setCacheReady] = useState(false);

  // ✅ 새로 추가: 상단 탭 + 부위 탭
  const [topTab, setTopTab] = useState<TopTab>("all");
  const [slotTab, setSlotTab] = useState<string>(""); // "" = 전체(부위 미선택)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tags = slotTagById ?? {};

    // 1) top tab 필터
    const byTopTab = items.filter((it) => {
      const id = it.id;
      const tag = tags[id];
      const equipped = isEquippedId?.(id) ?? false;

      if (topTab === "equipped") return equipped;
      if (topTab === "tagged") return !!tag;
      if (topTab === "untagged") return !tag;
      return true; // all
    });

    // 2) slot tab 필터 (tagged 탭일 때 특히 유용)
    const bySlot = slotTab
      ? byTopTab.filter((it) => (tags[it.id] ?? "") === slotTab)
      : byTopTab;

    // 3) 검색어 필터
    if (!q) return bySlot;
    return bySlot.filter((it) => {
      const name = String(it.name ?? "").toLowerCase();
      const id = String(it.id ?? "");
      return name.includes(q) || id.includes(q);
    });
  }, [items, query, topTab, slotTab, slotTagById, isEquippedId]);

  function mergeDedupe(prev: MapleItemSummary[], next: MapleItemSummary[]) {
    const map = new Map<number, MapleItemSummary>();
    for (const it of prev) map.set(it.id, it);
    for (const it of next) map.set(it.id, it);
    return Array.from(map.values());
  }

  // ✅ (1) 캐시 복원
  useEffect(() => {
    setCacheReady(false);

    setError(null);
    setLoading(false);
    setQuery("");
    setSelectedId(null);

    // 탭은 유지해도 되지만, 버전 바뀌면 slotTab은 비워두는 게 안전
    setSlotTab("");

    const key = cacheKey(cfg);
    const raw = localStorage.getItem(key);

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ItemCacheV1;
        if (parsed?.version === 1 && Array.isArray(parsed.items)) {
          setItems(parsed.items);
          setTotal(typeof parsed.total === "number" ? parsed.total : null);
          setCursor(typeof parsed.cursor === "number" ? parsed.cursor : parsed.items.length);
        } else {
          setItems([]);
          setTotal(null);
          setCursor(0);
        }
      } catch {
        setItems([]);
        setTotal(null);
        setCursor(0);
      }
    } else {
      setItems([]);
      setTotal(null);
      setCursor(0);
    }

    setCacheReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.region, cfg.version]);

  // ✅ (2) 캐시가 없을 때만 자동 로딩
  useEffect(() => {
    if (!cacheReady) return;
    if (items.length > 0) return;
    void loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheReady, items.length, cfg.region, cfg.version]);

  // ✅ (3) 캐시 저장
  useEffect(() => {
    if (!cacheReady) return;

    const key = cacheKey(cfg);
    const handle = window.setTimeout(() => {
      try {
        const trimmed = items.slice(0, CACHE_MAX_ITEMS);
        const payload: ItemCacheV1 = {
          version: 1,
          savedAt: Date.now(),
          total,
          cursor,
          items: trimmed,
        };
        localStorage.setItem(key, JSON.stringify(payload));
      } catch {}
    }, 250);

    return () => window.clearTimeout(handle);
  }, [cacheReady, items, total, cursor, cfg.region, cfg.version]);

  async function loadInitial() {
    setLoading(true);
    setError(null);

    try {
      const cnt = await fetchItemCount(cfg);
      const first = await fetchItemList(cfg, { start: 0, count: PAGE_SIZE });

      setTotal(cnt);
      setItems(first);
      setCursor(first.length);
      setSelectedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loading) return;
    if (total != null && cursor >= total) return;

    setLoading(true);
    setError(null);

    try {
      const next = await fetchItemList(cfg, { start: cursor, count: PAGE_SIZE });
      setItems((prev) => mergeDedupe(prev, next));
      setCursor((c) => c + next.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  const canLoadMore = total == null ? true : cursor < total;

  function handlePick(it: MapleItemSummary, rect: DOMRect) {
    setSelectedId(it.id);
    onPickItem?.(it, rect);
  }

  function clearCache() {
    try {
      localStorage.removeItem(cacheKey(cfg));
    } catch {}
    setTotal(null);
    setItems([]);
    setCursor(0);
    setQuery("");
    setSelectedId(null);
    void loadInitial();
  }

  function TabButton({
    active,
    children,
    onClick,
  }: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          border: active ? "1px solid #999" : "1px solid #e5e5e5",
          background: active ? "rgba(0,0,0,0.06)" : "white",
          color: active ? "#fff" : "#444",   // ✅ 추가: 글자색 고정
          borderRadius: 10,
          padding: "6px 10px",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <section className="panel">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h2 className="panelTitle" style={{ margin: 0 }}>
          전체 아이템 목록
        </h2>
        <div style={{ fontSize: 12, color: "#666" }}>
          {total == null ? "불러오는 중…" : `총 ${total.toLocaleString()}개`}
        </div>
      </div>

      {/* ✅ 상단 탭 */}
      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <TabButton active={topTab === "all"} onClick={() => setTopTab("all")}>
          전체
        </TabButton>
        <TabButton active={topTab === "tagged"} onClick={() => setTopTab("tagged")}>
          태그됨(부위확정)
        </TabButton>
        <TabButton active={topTab === "untagged"} onClick={() => setTopTab("untagged")}>
          미분류
        </TabButton>
        <TabButton active={topTab === "equipped"} onClick={() => setTopTab("equipped")}>
          착용중
        </TabButton>

        <div style={{ flex: "1 1 auto" }} />

        <button onClick={() => void loadInitial()} disabled={loading} className="button">
          새로고침(처음부터)
        </button>
        <button onClick={clearCache} disabled={loading} className="button">
          캐시 초기화
        </button>
      </div>

      {/* ✅ 부위 탭: tagged/untagged/all 어디서든 쓸 수 있지만, 특히 tagged에서 강력 */}
      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          border: "1px solid #eee",
          borderRadius: 10,
          padding: 8,
          background: "rgba(0,0,0,0.02)",
        }}
      >
        <TabButton active={slotTab === ""} onClick={() => setSlotTab("")}>
          전체 부위
        </TabButton>
        {SLOT_TABS.map((s) => (
          <TabButton key={s.key} active={slotTab === s.key} onClick={() => setSlotTab(s.key)}>
            {s.label}
          </TabButton>
        ))}
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 또는 ID 검색 (현재 불러온 범위 내 필터)"
          className="input"
          style={{ flex: "1 1 260px" }}
        />
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
            const slotTag = slotTagById?.[it.id];

            const tooltip = `${it.name}\nID: ${it.id}${slotTag ? `\n부위: ${slotTag}` : ""}`;

            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                    handlePick(it, rect);
                  }}
                  title={tooltip}
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
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "#000000",
                      }}
                    >
                      {it.name}
                    </div>

                    <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>
                      ID: {it.id}
                      {slotTag ? ` · ${slotTag}` : ""}
                      {equipped ? " · 착용중" : ""}
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
          현재 불러온 개수: {items.length.toLocaleString()} (cursor: {cursor.toLocaleString()}) · 표시:{" "}
          {filtered.length.toLocaleString()}
        </div>

        <button onClick={() => void loadMore()} disabled={loading || !canLoadMore} className="button">
          {loading ? "불러오는 중…" : canLoadMore ? "더 불러오기" : "끝"}
        </button>
      </div>
    </section>
  );
}
