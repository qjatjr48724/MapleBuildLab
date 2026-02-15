import "./App.css";
import React from "react";
import CharacterInfoPanel from "./components/CharacterInfoPanel";
import StatWindow from "./components/StatWindow";
import EquipmentGrid from "./components/EquipmentGrid";
import ItemListPanel from "./components/ItemListPanel";
import type { CharacterInfo } from "./types/character";

export default function App() {
  const [character, setCharacter] = React.useState<CharacterInfo>(() => ({
    name: "",
    level: "",
    jobGroup: "",
    jobId: "",
    baseStats: { STR: 0, DEX: 0, INT: 0, LUK: 0 },
  }));

  return (
    <div className="page">
      <header className="topBar">
        <h1 className="title">MapleBuildLab</h1>
        <div className="subTitle">Step 1: 캐릭터/스탯/장비 3영역 UI</div>
      </header>

      {/* ✅ 여기 한 덩어리 grid 안에서 위3개 + 아래1개 배치 */}
      <main className="layoutGrid">
        {/* 위 3개 */}
        <div className="gridItem">
          <CharacterInfoPanel value={character} onChange={setCharacter} />
        </div>

        <div className="gridItem">
          <StatWindow character={character} onChange={setCharacter} />
        </div>

        <div className="gridItem">
          <EquipmentGrid />
        </div>

        {/* 아래 1개(전체폭) */}
        <div className="gridItem fullRow">
          <ItemListPanel />
        </div>
      </main>
    </div>
  );
}
