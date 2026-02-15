import "./App.css";
import React from "react";
import CharacterInfoPanel from "./components/CharacterInfoPanel";
import StatWindow from "./components/StatWindow";
import EquipmentGrid from "./components/EquipmentGrid";
import ItemListPanel from "./components/ItemListPanel";

import ItemStatPopover, { type EquippedItem } from "./components/ItemStatPopover";
import { getItemIconUrl, MAPLE_API_DEFAULT, type MapleItemSummary } from "./data/maplestoryIo";

import type { CharacterInfo } from "./types/character";

export default function App() {
  const [character, setCharacter] = React.useState<CharacterInfo>(() => ({
    name: "",
    level: "",
    jobGroup: "",
    jobId: "",
    baseStats: { STR: 0, DEX: 0, INT: 0, LUK: 0 },
  }));

  // ✅ 팝업 관련 상태
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);
  const [pickedItem, setPickedItem] = React.useState<MapleItemSummary | null>(null);

  // ✅ 슬롯별 장착 아이템 상태
  const [equippedBySlot, setEquippedBySlot] = React.useState<
    Record<string, EquippedItem | undefined>
  >({});

  // ✅ (Step4 준비) 장착 아이템이 올려주는 STR/DEX/INT/LUK 합산
  const itemBonus = React.useMemo(() => {
    const sum = { STR: 0, DEX: 0, INT: 0, LUK: 0 };
    for (const eq of Object.values(equippedBySlot)) {
      if (!eq) continue;
      sum.STR += eq.stats.STR;
      sum.DEX += eq.stats.DEX;
      sum.INT += eq.stats.INT;
      sum.LUK += eq.stats.LUK;
    }
    return sum;
  }, [equippedBySlot]);

  return (
    <div className="page">
      <header className="topBar">
        <h1 className="title">MapleBuildLab</h1>
        <div className="subTitle">Step 1: 캐릭터/스탯/장비 3영역 UI</div>
      </header>

      <main className="layoutGrid">
        {/* 상단 3개 */}
        <div className="gridItem">
          <CharacterInfoPanel value={character} onChange={setCharacter} />
        </div>

        <div className="gridItem">
          {/* ⚠️ Step4에서 StatWindow에 itemBonus 반영할 때 아래 prop을 사용할 예정 */}
          <StatWindow
            character={character}
            onChange={setCharacter}
            // itemBonus={itemBonus}  // <- StatWindow 수정 후 이 줄 주석 해제
          />
        </div>

        <div className="gridItem">
          {/* ✅ 장착 아이템 아이콘 반영 */}
          <EquipmentGrid
            equippedBySlot={equippedBySlot}
            getIconUrl={(itemId) => getItemIconUrl(MAPLE_API_DEFAULT, itemId, 2)}
          />
        </div>

        {/* 하단 전체폭: 아이템 목록 */}
        <div className="gridItem fullRow">
          <ItemListPanel
            onPickItem={(item, rect) => {
              setPickedItem(item);
              setAnchorRect(rect);
              setPopoverOpen(true);
            }}
            isEquippedId={(id) => Object.values(equippedBySlot).some((x) => x?.itemId === id)}
          />
        </div>
      </main>

      {/* ✅ 클릭 위치 근처 팝업 */}
      <ItemStatPopover
        open={popoverOpen}
        anchorRect={anchorRect}
        item={pickedItem}
        slotOptions={[
          { key: "cap", label: "모자" },
          { key: "medal", label: "훈장" },
          { key: "forehead", label: "얼굴장식" },
          { key: "eye_acc", label: "눈장식" },
          { key: "ear_acc", label: "귀장식" },
          { key: "weapon", label: "무기" },
          { key: "shield", label: "보조장비(방패)" },
          { key: "pendant", label: "목걸이" },
          { key: "clothes", label: "상의" },
          { key: "pants", label: "하의" },
          { key: "mantle", label: "망토" },
          { key: "gloves", label: "장갑" },
          { key: "belt", label: "벨트" },
          { key: "shoes", label: "신발" },
          { key: "ring1", label: "반지1" },
          { key: "ring2", label: "반지2" },
          { key: "ring3", label: "반지3" },
          { key: "ring4", label: "반지4" },
          { key: "taming_mob", label: "탑승" },
          { key: "saddle", label: "안장" },
          { key: "mob_equip", label: "몹장비" },
          { key: "pet_acc", label: "펫장신구" },
        ]}
        onClose={() => setPopoverOpen(false)}
        onConfirm={(equipped) => {
          setEquippedBySlot((prev) => ({ ...prev, [equipped.slotKey]: equipped }));
          setPopoverOpen(false);
        }}
      />
    </div>
  );
}
