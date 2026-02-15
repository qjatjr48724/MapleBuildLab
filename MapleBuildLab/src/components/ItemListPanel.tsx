// src/components/ItemListPanel.tsx
import { useMemo, useState } from "react";
import type { ItemSearchResult } from "../types/item";
import { fetchItem, getItemIconUrl, MAPLE_API_DEFAULT } from "../data/maplestoryIo";

export default function ItemListPanel() {
  const [itemIdText, setItemIdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // “불러온 아이템들”을 임시 목록으로 보여줌 (나중에 전체 검색으로 대체)
  const [items, setItems] = useState<ItemSearchResult[]>([]);

  const itemId = useMemo(() => {
    const n = Number(itemIdText);
    return Number.isFinite(n) ? n : NaN;
  }, [itemIdText]);

  async function onAddById() {
    setError(null);

    if (!Number.isFinite(itemId) || itemId <= 0) {
      setError("아이템 ID를 올바르게 입력해줘 (양수 숫자).");
      return;
    }

    setLoading(true);
    try {
      const data = await fetchItem(MAPLE_API_DEFAULT, itemId);
      const iconUrl = getItemIconUrl(MAPLE_API_DEFAULT, itemId, 2);

      setItems((prev) => {
        // 중복 방지
        if (prev.some((x) => x.id === itemId)) return prev;
        return [{ id: itemId, name: data.name, iconUrl }, ...prev];
      });
      setItemIdText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2 className="panelTitle">전체 아이템 목록 (임시: ID로 불러오기)</h2>

      <div className="row" style={{ gap: 8, alignItems: "center" }}>
        <input
          value={itemIdText}
          onChange={(e) => setItemIdText(e.target.value)}
          placeholder="아이템 ID 입력 (예: 1002001)"
          className="input"
        />
        <button onClick={onAddById} className="button" disabled={loading}>
          {loading ? "불러오는 중..." : "불러오기"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="itemList">
        {items.map((it) => (
          <button key={it.id} className="itemRow" type="button">
            <img src={it.iconUrl} alt={it.name} width={32} height={32} />
            <div className="itemMeta">
              <div className="itemName">{it.name}</div>
              <div className="itemId">ID: {it.id}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
