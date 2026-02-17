import React from "react";
import {
  fetchItem,
  MAPLE_API_DEFAULT,
  type MapleApiConfig,
  type MapleItemSummary,
} from "../data/maplestoryIo";

// 우리가 다룰 “아이템이 주는 스탯”
export type ItemStats = {
  STR: number;
  DEX: number;
  INT: number;
  LUK: number;
  WATK: number;
  MATK: number;
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
  // ✅ 나중에 필요하면 tooltip 강화용으로 typeInfo도 저장 가능
  typeInfo?: any;
  requiredJobs?: string[];
  requiredLevel?: number;
  requiredGender?: number;
  isCash?: boolean;
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
  const src =
    detail?.stats ??
    detail?.equipStats ??
    detail?.equip?.stats ??
    detail?.equip ??
    detail ??
    {};

  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = src?.[k];
      if (typeof v === "number") return v;
    }
    return 0;
  };

  return {
    STR: pick("STR", "str", "incSTR", "incStr"),
    DEX: pick("DEX", "dex", "incDEX", "incDex"),
    INT: pick("INT", "int", "incINT", "incInt"),
    LUK: pick("LUK", "luk", "incLUK", "incLuk"),
    WATK: pick("WATK", "watk", "attack", "pad", "incPAD", "incPad"),
    MATK: pick("MATK", "matk", "mad", "incMAD", "incMad"),
    ACC: pick("ACC", "acc", "accuracy", "incACC", "incAcc"),
    AVOID: pick("AVOID", "avoid", "evasion", "incEVA", "incEva"),
    SPEED: pick("SPEED", "speed", "incSpeed"),
    JUMP: pick("JUMP", "jump", "incJump"),
  };
}

// ✅ typeInfo 기반으로 “장착 가능한 슬롯”을 계산
function inferAllowedSlots(detail: any): { key: string; label: string }[] {
  const ti = detail?.typeInfo ?? {};
  const overall = String(ti?.overallCategory ?? "");
  const cat = String(ti?.category ?? "");
  const sub = String(ti?.subCategory ?? "");

  if (overall === "Equip") {
    if (cat === "Accessory") {
      if (sub === "Ring") {
        return [
          { key: "ring1", label: "RING 1" },
          { key: "ring2", label: "RING 2" },
          { key: "ring3", label: "RING 3" },
          { key: "ring4", label: "RING 4" },
        ];
      }
      if (sub === "Pendant") return [{ key: "pendant", label: "PENDANT" }];
      if (sub === "Belt") return [{ key: "belt", label: "BELT" }];
      if (sub === "Medal") return [{ key: "medal", label: "MEDAL" }];
      if (sub === "Face Accessory") return [{ key: "forehead", label: "FOREHEAD" }];
      if (sub === "Eye Decoration") return [{ key: "eye_acc", label: "EYE ACC" }];
      if (sub === "Earrings" || sub === "Earring") return [{ key: "ear_acc", label: "EAR ACC" }];
    }

    if (cat === "Armor") {
      if (sub === "Hat") return [{ key: "cap", label: "CAP" }];
      if (sub === "Cape") return [{ key: "mantle", label: "MANTLE" }];
      if (sub === "Top" || sub === "Overall") return [{ key: "clothes", label: "CLOTHES" }];
      if (sub === "Bottom") return [{ key: "pants", label: "PANTS" }];
      if (sub === "Glove") return [{ key: "gloves", label: "GLOVES" }];
      if (sub === "Shoes") return [{ key: "shoes", label: "SHOES" }];
      if (sub === "Shield") return [{ key: "shield", label: "SHIELD" }];
    }

    // 무기 카테고리는 서버/버전에 따라 표기가 다양할 수 있어서 “포괄” 처리
    if (cat.includes("Weapon")) return [{ key: "weapon", label: "WEAPON" }];

    // 기타
    if (cat === "Other") {
      if (sub === "Pet Equipment") return [{ key: "pet_acc", label: "PET ACC" }];
    }
    if (cat === "Mount") {
      if (sub === "Mount") return [{ key: "taming_mob", label: "TAMING MOB" }];
    }
  }

  // 모르면 일단 weapon(임시) — but 실제로는 “모를 경우 장착 막기”가 더 안전함
  // 지금 단계에선 테스트 편의 위해 weapon으로 fallback
  return [{ key: "weapon", label: "WEAPON" }];
}

type Props = {
  open: boolean;
  anchorRect: DOMRect | null;
  apiConfig?: MapleApiConfig;
  item: MapleItemSummary | null;

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
  const popoverHeightGuess = 280;
  const spaceAbove = anchor.top;
  const spaceBelow = window.innerHeight - anchor.bottom;

  const placeAbove = spaceAbove > spaceBelow && spaceAbove > popoverHeightGuess + margin;
  return placeAbove ? "top" : "bottom";
}

export default function ItemStatPopover({
  open,
  anchorRect,
  apiConfig,
  item,
  onClose,
  onConfirm,
}: Props) {
  const cfg = apiConfig ?? MAPLE_API_DEFAULT;

  const [allowedSlots, setAllowedSlots] = React.useState<{ key: string; label: string }[]>([
    { key: "weapon", label: "WEAPON" },
  ]);

  const [slotKey, setSlotKey] = React.useState("weapon");
  const [stats, setStats] = React.useState<ItemStats>(emptyStats());

  const [loadingBase, setLoadingBase] = React.useState(false);
  const [baseError, setBaseError] = React.useState<string | null>(null);

  const [meta, setMeta] = React.useState<{
    typeInfo?: any;
    requiredJobs?: string[];
    requiredLevel?: number;
    requiredGender?: number;
    isCash?: boolean;
  }>({});

  React.useEffect(() => {
    if (!open || !item) return;

    let cancelled = false;

    setLoadingBase(true);
    setBaseError(null);

    (async () => {
      try {
        const detail = await fetchItem(cfg, item.id);

        if (cancelled) return;

        // ✅ allowed 슬롯 계산 (typeInfo 기반)
        const slots = inferAllowedSlots(detail);
        setAllowedSlots(slots);
        setSlotKey(slots[0]?.key ?? "weapon");

        // ✅ 기본 스탯
        const parsed = parseBaseStatsFromApi(detail);
        setStats(parsed);

        // ✅ 메타 저장(툴팁 등)
        setMeta({
          typeInfo: detail?.typeInfo,
          requiredJobs: detail?.requiredJobs,
          requiredLevel: detail?.requiredLevel,
          requiredGender: detail?.requiredGender,
          isCash: detail?.isCash,
        });
      } catch (e) {
        if (cancelled) return;
        setBaseError(e instanceof Error ? e.message : "기본 스탯 조회 실패");
        setAllowedSlots([{ key: "weapon", label: "WEAPON" }]);
        setSlotKey("weapon");
        setStats(emptyStats());
        setMeta({});
      } finally {
        if (!cancelled) setLoadingBase(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, item, cfg.region, cfg.version]);

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

  const left = Math.min(Math.max(8, anchorRect.left), window.innerWidth - 340);

  const top =
    placement === "top"
      ? Math.max(8, anchorRect.top - 8)
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

  const singleSlot = allowedSlots.length === 1;

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
          <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
            기본 스탯 불러오는 중...
          </div>
        )}
        {baseError && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#fca5a5" }}>
            기본 스탯 로드 실패: {baseError}
          </div>
        )}

        {/* ✅ 슬롯 선택: 반지처럼 여러 슬롯 가능할 때만 보여줌 */}
        <div className="popoverRow">
          <label className="popoverLabel">장착 슬롯</label>

          {singleSlot ? (
            <div style={{ color: "#111", fontWeight: 700 }}>
              {allowedSlots[0]?.label ?? "-"}
            </div>
          ) : (
            <select
              className="popoverSelect"
              value={slotKey}
              onChange={(e) => setSlotKey(e.target.value)}
              style={{
                color: "#111",
                background: "#f3f4f6",
              }}
            >
              {allowedSlots.map((s) => (
                <option key={s.key} value={s.key} style={{ color: "#111" }}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
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

        <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
          {/* ✅ typeInfo 정보 표시(디버그/검증용) */}
          {meta.typeInfo?.overallCategory ? (
            <div>
              {meta.typeInfo?.overallCategory} / {meta.typeInfo?.category} / {meta.typeInfo?.subCategory}
            </div>
          ) : null}
          {Array.isArray(meta.requiredJobs) && meta.requiredJobs.length > 0 ? (
            <div>요구 직업: {meta.requiredJobs.join(", ")}</div>
          ) : null}
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
                typeInfo: meta.typeInfo,
                requiredJobs: meta.requiredJobs,
                requiredLevel: meta.requiredLevel,
                requiredGender: meta.requiredGender,
                isCash: meta.isCash,
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
