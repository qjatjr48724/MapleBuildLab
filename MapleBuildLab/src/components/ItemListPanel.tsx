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
  // 다음 단계(팝업/장착)에서 사용 예정
  onPickItem?: (item: MapleItemSummary, rect: DOMRect) => void;
  // 다음 단계(“착용중 표시”)에서 사용할 예정
  isEquippedId?: (itemId: number) => boolean;
};

export default function ItemListPanel({ apiConfig, onPickItem, isEquippedId }: Props) {
  const cfg = apiConfig ?? MAPLE_API_DEFAULT;

  const PAGE_SIZE = 60;

  const [total, setTotal] = useState<number | null>(null);
  const [items, setItems] = useState<MapleItemSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((it) => {
      const name = String(it.name ?? "").toLowerCase();
      const id = String(it.id ?? "");
      return name.includes(q) || id.includes(q);
    });
  }, [items, query]);

  async function loadInitial() {
    setLoading(true);
    setError(null);
    try {
      const [cnt, list] = await Promise.all([
        fetchItemCount(cfg),
        fetchItemList(cfg, { start: 0, count: PAGE_SIZE }),
      ]);
      setTotal(cnt);
      setItems(list);
      setSelectedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchItemList(cfg, { start: items.length, count: PAGE_SIZE });
      setItems((prev) => [...prev, ...next]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // region/version이 바뀌면 초기화 + 재로드
    setItems([]);
    setTotal(null);
    setQuery("");
    setSelectedId(null);
    void loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.region, cfg.version]);

  const canLoadMore = total == null ? true : items.length < total;

  function handlePick(it: MapleItemSummary, rect: DOMRect) {
  setSelectedId(it.id);
  onPickItem?.(it, rect);
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

      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 또는 ID 검색 (현재 불러온 범위 내 필터)"
          className="input"
        />
        <button onClick={() => void loadInitial()} disabled={loading} className="button">
          새로고침
        </button>
      </div>

      {error && (
        <div className="error" style={{ marginTop: 10 }}>
          오류: {error}
          <div style={{ marginTop: 6, color: "#666", fontSize: 12 }}>
            ※ item/list 쿼리 파라미터가 서버 구현과 다를 수 있어. 실패하면 에러 문구를 그대로 보내줘.
          </div>
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

                // ✅ 4~5열 느낌: 화면/패널 폭에 따라 자동
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            }}
            >
            {filtered.map((it) => {
                const isSel = it.id === selectedId;
                const equipped = isEquippedId?.(it.id) ?? false;

                // ✅ 툴팁에 보여줄 텍스트 (일단 이름 + ID)
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
                        ? "rgba(76, 175, 80, 0.18)" // 착용중
                        : isSel
                        ? "rgba(255, 235, 59, 0.22)" // 선택됨
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
                        {/* ✅ 이름은 보여주되 길면 줄임 */}
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

                        {/* ✅ ID는 숨기고 싶으면 이 줄을 지워도 됨(툴팁에는 남아있음) */}
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
          현재 불러온 개수: {items.length.toLocaleString()}
        </div>

        <button onClick={() => void loadMore()} disabled={loading || !canLoadMore} className="button">
          {loading ? "불러오는 중…" : canLoadMore ? "더 불러오기" : "끝"}
        </button>
      </div>
    </section>
  );
}
