import React from "react";
import {
  fetchItem,
  MAPLE_API_DEFAULT,
  type MapleApiConfig,
  type MapleItemSummary,
} from "../data/maplestoryIo";

// 우리가 다룰 “아이템이 주는 스탯” (일단 핵심부터)
export type ItemStats = {
  STR: number;
  DEX: number;
  INT: number;
  LUK: number;
  WATK: number; // 물공
  MATK: number; // 마공
  ACC: number;
  AVOID: number;
  SPEED: number;
  JUMP: number;
};

export type EquippedItem = {
  slotKey: string;
  itemId: number;
  name: string;
  stats: ItemStats;
};

const emptyStats = (): ItemStats => ({
  STR: 0,
  DEX: 0,
  INT: 0,
  LUK: 0,
  WATK: 0,
  MATK: 0,
  ACC: 0,
  AVOID: 0,
  SPEED: 0,
  JUMP: 0,
});

function parseBaseStatsFromApi(detail: any): ItemStats {
  // 객체 내부를 재귀로 훑어서 key가 일치하면 숫자를 찾아내는 함수
  const deepFindNumber = (root: any, keys: string[]) => {
    const keySet = new Set(keys);

    const walk = (node: any): number | null => {
      if (!node) return null;

      if (typeof node === "object") {
        // 1) 현재 노드에서 키 직접 탐색
        for (const k of Object.keys(node)) {
          if (keySet.has(k) && typeof node[k] === "number") {
            return node[k];
          }
        }

        // 2) 자식 노드 재귀 탐색
        for (const k of Object.keys(node)) {
          const v = node[k];
          if (typeof v === "object" && v !== null) {
            const found = walk(v);
            if (typeof found === "number") return found;
          }
        }
      }

      return null;
    };

    const res = walk(root);
    return typeof res === "number" ? res : 0;
  };

  // 후보 key들을 “최대한 많이” 넣어둠 (나중에 JSON 구조 확정되면 정리 가능)
  return {
    STR: deepFindNumber(detail, ["STR", "str", "incSTR", "incStr"]),
    DEX: deepFindNumber(detail, ["DEX", "dex", "incDEX", "incDex"]),
    INT: deepFindNumber(detail, ["INT", "int", "incINT", "incInt"]),
    LUK: deepFindNumber(detail, ["LUK", "luk", "incLUK", "incLuk"]),
    WATK: deepFindNumber(detail, ["WATK", "watk", "PAD", "pad", "attack", "incPAD", "incPad"]),
    MATK: deepFindNumber(detail, ["MATK", "matk", "MAD", "mad", "magicAttack", "incMAD", "incMad"]),
    ACC: deepFindNumber(detail, ["ACC", "acc", "accuracy", "incACC", "incAcc"]),
    AVOID: deepFindNumber(detail, ["AVOID", "avoid", "EVA", "eva", "evasion", "incEVA", "incEva"]),
    SPEED: deepFindNumber(detail, ["SPEED", "speed", "incSpeed"]),
    JUMP: deepFindNumber(detail, ["JUMP", "jump", "incJump"]),
  };
}


type Props = {
  open: boolean;
  anchorRect: DOMRect | null;
  apiConfig?: MapleApiConfig;
  item: MapleItemSummary | null;

  slotOptions: { key: string; label: string }[];

  onClose: () => void;
  onConfirm: (equipped: EquippedItem) => void;
};

function clampInt(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n);
}

function decidePlacement(anchor: DOMRect) {
  const margin = 8;
  const popoverHeightGuess = 260; // 대략치(자동 배치 판단용)
  const spaceAbove = anchor.top;
  const spaceBelow = window.innerHeight - anchor.bottom;

  const placeAbove =
    spaceAbove > spaceBelow && spaceAbove > popoverHeightGuess + margin;

  return placeAbove ? "top" : "bottom";
}

export default function ItemStatPopover({
  open,
  anchorRect,
  apiConfig,
  item,
  slotOptions,
  onClose,
  onConfirm,
}: Props) {
  const [slotKey, setSlotKey] = React.useState(slotOptions[0]?.key ?? "weapon");
  const [stats, setStats] = React.useState<ItemStats>(emptyStats());
  const cfg = apiConfig ?? MAPLE_API_DEFAULT;
  const [baseStats, setBaseStats] = React.useState<ItemStats>(emptyStats());
  const [loadingBase, setLoadingBase] = React.useState(false);
  const [baseError, setBaseError] = React.useState<string | null>(null);

  // 팝업 열릴 때 초기화
  // 팝업 열릴 때: 아이템 상세를 가져와서 "기본 스탯"을 채웁니다.
  React.useEffect(() => {
    if (!open || !item) return;

    let cancelled = false;

    setSlotKey(slotOptions[0]?.key ?? "weapon");
    setLoadingBase(true);
    setBaseError(null);

    (async () => {
      try {
        const detail = await fetchItem(cfg, item.id);
        console.log("[ItemStatPopover] fetchItem ok:", { requestedId: (item as any).id, item });
        console.log("[ItemStatPopover] detail sample:", detail);


        // ✅ maplestory.io 상세 응답을 우리가 쓰는 ItemStats로 변환
        const parsed = parseBaseStatsFromApi(detail);
        console.log("[base] parsed =", parsed);
        console.log("[base] detail keys =", Object.keys(detail ?? {}));

        if (cancelled) return;
        setBaseStats(parsed);
        // ✅ 수정 가능한 값(stats)의 초기값 = 기본 스탯
        setStats(parsed);
      } catch (e) {
        console.error("[ItemStatPopover] fetchItem failed:", e);
        if (cancelled) return;
        setBaseError(e instanceof Error ? e.message : "기본 스탯 조회 실패");
        // 실패해도 입력은 가능하게 0으로
        setBaseStats(emptyStats());
        setStats(emptyStats());
      } finally {
        if (!cancelled) setLoadingBase(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, item, slotOptions, cfg.region, cfg.version]);

  // ESC 닫기
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !anchorRect || !item) return null;

  const placement = decidePlacement(anchorRect);

  const left = Math.min(
    Math.max(8, anchorRect.left),
    window.innerWidth - 340, // 팝업 폭 정도 고려
  );

  const top =
    placement === "top"
      ? Math.max(8, anchorRect.top - 8) // 아래에서 transform으로 올림
      : Math.min(window.innerHeight - 8, anchorRect.bottom + 8);

  const transform = placement === "top" ? "translateY(-100%)" : "translateY(0)";

  const setField = (key: keyof ItemStats, next: number) => {
    setStats((prev) => ({ ...prev, [key]: next }));
  };

  const bump = (key: keyof ItemStats, delta: number) => {
    setStats((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + delta }));
  };

  const onClickBackdrop: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="popoverBackdrop" onMouseDown={onClickBackdrop}>
      <div
        className="popover"
        style={{
          position: "fixed",
          left,
          top,
          transform,
          width: 320,
        }}
      >
        <div className="popoverHeader">
          <div className="popoverTitle">{item.name}</div>
          <button className="popoverClose" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {loadingBase && (
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            기본 스탯 불러오는 중...
          </div>
        )}
        {baseError && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#fca5a5" }}>
            기본 스탯 로드 실패: {baseError}
          </div>
        )}

        <div className="popoverRow">
          <label className="popoverLabel">장착 슬롯</label>
          <select
            className="popoverSelect"
            value={slotKey}
            onChange={(e) => setSlotKey(e.target.value)}
          >
            {slotOptions.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="popoverGrid">
          {(
            [
              ["STR", "STR"],
              ["DEX", "DEX"],
              ["INT", "INT"],
              ["LUK", "LUK"],
              ["WATK", "물공"],
              ["MATK", "마공"],
              ["ACC", "명중"],
              ["AVOID", "회피"],
              ["SPEED", "이속"],
              ["JUMP", "점프"],
            ] as const
          ).map(([k, label]) => {
            const key = k as keyof ItemStats;
            return (
              <div key={k} className="statRow">
                <div className="statKey">
                    <div>{label}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                        기본 {baseStats[key]} · Δ {stats[key] - baseStats[key] >= 0 ? "+" : ""}
                        {stats[key] - baseStats[key]}
                    </div>
                </div>
                <div className="statControls">
                  <button
                    type="button"
                    className="miniBtn"
                    onClick={() => bump(key, -1)}
                  >
                    −
                  </button>
                  <input
                    className="statInput"
                    value={String(stats[key])}
                    onChange={(e) => setField(key, clampInt(e.target.value))}
                  />
                  <button
                    type="button"
                    className="miniBtn"
                    onClick={() => bump(key, +1)}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="popoverFooter">
          <button className="button" onClick={onClose} type="button">
            취소
          </button>
          <button
            className="buttonPrimary"
            type="button"
            onClick={() =>
              onConfirm({
                slotKey,
                itemId: item.id,
                name: item.name,
                stats,
              })
            }
          >
            확인(장착)
          </button>
        </div>
      </div>
    </div>
  );
}
