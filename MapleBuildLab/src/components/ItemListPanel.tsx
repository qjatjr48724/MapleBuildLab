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

export default function ItemListPanel({ apiConfig, onPickItem, isEquippedId }: Props) {
  const cfg = apiConfig ?? MAPLE_API_DEFAULT;

  // ✅ 페이지당 로딩 개수
  const PAGE_SIZE = 240;

  // ✅ 캐시 최대 저장 개수 (localStorage 용량 방지)
  const CACHE_MAX_ITEMS = 2000;

  const [total, setTotal] = useState<number | null>(null);
  const [items, setItems] = useState<MapleItemSummary[]>([]);
  const [cursor, setCursor] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // ✅ “캐시 복원이 끝났다”는 신호 (이게 핵심)
  const [cacheReady, setCacheReady] = useState(false);

  const filtered = useMemo(() => {
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

  // ✅ (1) 캐시 복원: region/version이 바뀔 때마다 1회
  useEffect(() => {
    setCacheReady(false);

    setError(null);
    setLoading(false);
    setQuery("");
    setSelectedId(null);

    const key = cacheKey(cfg);
    const raw = localStorage.getItem(key);

    console.log("[cache] restore", { key, hasRaw: !!raw });

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ItemCacheV1;

        if (parsed?.version === 1 && Array.isArray(parsed.items)) {
          setItems(parsed.items);
          setTotal(typeof parsed.total === "number" ? parsed.total : null);
          setCursor(typeof parsed.cursor === "number" ? parsed.cursor : parsed.items.length);

          console.log("[cache] restored items =", parsed.items.length, "cursor =", parsed.cursor);
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

    // ✅ 복원이 끝난 뒤에만 cacheReady=true
    setCacheReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.region, cfg.version]);

  // ✅ (2) 자동 초기 로딩: “캐시 복원 끝 + 캐시가 비어있을 때만”
  // ---- 이게 너가 찾던 "기존 자동 로딩 useEffect"이고,
  // ---- 기존에는 타이밍 문제로 캐시를 240개로 덮어쓰곤 했어.
  useEffect(() => {
    if (!cacheReady) return;
    if (items.length > 0) return; // 캐시가 있으면 자동 로딩 X
    void loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheReady, items.length, cfg.region, cfg.version]);

  // ✅ (3) 캐시 저장: “복원 끝난 이후”에만 저장
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

        console.log("[cache] save", { key, items: trimmed.length, cursor, total });

        localStorage.setItem(key, JSON.stringify(payload));
      } catch {
        // localStorage 용량 초과 등은 조용히 무시
      }
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

      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 또는 ID 검색 (현재 불러온 범위 내 필터)"
          className="input"
          style={{ flex: "1 1 260px" }}
        />

        <button onClick={() => void loadInitial()} disabled={loading} className="button">
          새로고침(처음부터)
        </button>

        <button onClick={clearCache} disabled={loading} className="button">
          캐시 초기화
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

            const tooltip = `${it.name}\nID: ${it.id}`;

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
          현재 불러온 개수: {items.length.toLocaleString()} (cursor: {cursor.toLocaleString()})
        </div>

        <button onClick={() => void loadMore()} disabled={loading || !canLoadMore} className="button">
          {loading ? "불러오는 중…" : canLoadMore ? "더 불러오기" : "끝"}
        </button>
      </div>
    </section>
  );
}
