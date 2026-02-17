import "./App.css";
import React from "react";
import CharacterInfoPanel from "./components/CharacterInfoPanel";
import ItemStatPopover, { type EquippedItem } from "./components/ItemStatPopover";
import { getItemIconUrl, MAPLE_API_DEFAULT } from "./data/maplestoryIo";

import StatWindow from "./components/StatWindow";
import EquipmentGrid from "./components/EquipmentGrid";
import ItemListPanel from "./components/ItemListPanel";
import type { CharacterInfo } from "./types/character";
import type { MapleItemSummary } from "./data/maplestoryIo";

export default function App() {
  const [character, setCharacter] = React.useState<CharacterInfo>(() => ({
    name: "",
    level: "",
    jobGroup: "",
    jobId: "",
    baseStats: { STR: 0, DEX: 0, INT: 0, LUK: 0 },
  }));

  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);
  const [pickedItem, setPickedItem] = React.useState<MapleItemSummary | null>(null);

  const [equippedBySlot, setEquippedBySlot] = React.useState<Record<string, EquippedItem | undefined>>({});

  const apiConfig = MAPLE_API_DEFAULT;

  const getIconUrl = React.useCallback(
    (itemId: number) => getItemIconUrl(apiConfig, itemId, 2),
    [apiConfig]
  );

  const isEquippedId = React.useCallback(
    (id: number) => Object.values(equippedBySlot).some((x) => x?.itemId === id),
    [equippedBySlot]
  );

  return (
    <div className="page">
      <header className="topBar">
        <h1 className="title">MapleBuildLab</h1>
        <div className="subTitle">캐릭터 / 스탯 / 장비 / 아이템 목록</div>
      </header>

      <main className="layoutGrid">
        <div className="gridItem">
          <CharacterInfoPanel value={character} onChange={setCharacter} />
        </div>

        <div className="gridItem">
          {/* (현재 StatWindow가 baseStats만 보고 있다면, 추후 equipped 합산도 연결 가능) */}
          <StatWindow character={character} onChange={setCharacter} />
        </div>

        <div className="gridItem">
          <EquipmentGrid equippedBySlot={equippedBySlot} getIconUrl={getIconUrl} />
        </div>

        <div className="gridItem fullRow">
          <ItemListPanel
            apiConfig={apiConfig}
            onPickItem={(item, rect) => {
              setPickedItem(item);
              setAnchorRect(rect);
              setPopoverOpen(true);
            }}
            isEquippedId={isEquippedId}
          />
        </div>
      </main>

      <ItemStatPopover
        open={popoverOpen}
        anchorRect={anchorRect}
        apiConfig={apiConfig}
        item={pickedItem}
        onClose={() => setPopoverOpen(false)}
        onConfirm={(equipped) => {
          setEquippedBySlot((prev) => ({
            ...prev,
            [equipped.slotKey]: equipped,
          }));
          setPopoverOpen(false);
        }}
      />
    </div>
  );
}
