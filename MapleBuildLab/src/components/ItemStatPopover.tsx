import React from "react";
import type { MapleItemSummary } from "../data/maplestoryIo";

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

type Props = {
  open: boolean;
  anchorRect: DOMRect | null;
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

  const placeAbove = spaceAbove > spaceBelow && spaceAbove > popoverHeightGuess + margin;

  return placeAbove ? "top" : "bottom";
}

export default function ItemStatPopover({
  open,
  anchorRect,
  item,
  slotOptions,
  onClose,
  onConfirm,
}: Props) {
  const [slotKey, setSlotKey] = React.useState(slotOptions[0]?.key ?? "weapon");
  const [stats, setStats] = React.useState<ItemStats>(emptyStats());

  // 팝업 열릴 때 초기화
  React.useEffect(() => {
    if (!open || !item) return;
    setSlotKey(slotOptions[0]?.key ?? "weapon");
    setStats(emptyStats());
  }, [open, item, slotOptions]);

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
    window.innerWidth - 340 // 팝업 폭 정도 고려
  );

  const top =
    placement === "top"
      ? Math.max(8, anchorRect.top - 8) // 아래에서 transform으로 올림
      : Math.min(window.innerHeight - 8, anchorRect.bottom + 8);

  const transform =
    placement === "top" ? "translateY(-100%)" : "translateY(0)";

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
                <div className="statKey">{label}</div>
                <div className="statControls">
                  <button type="button" className="miniBtn" onClick={() => bump(key, -1)}>
                    −
                  </button>
                  <input
                    className="statInput"
                    value={String(stats[key])}
                    onChange={(e) => setField(key, clampInt(e.target.value))}
                  />
                  <button type="button" className="miniBtn" onClick={() => bump(key, +1)}>
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
