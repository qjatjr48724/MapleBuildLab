import "./App.css";
import React from "react";
import CharacterInfoPanel from "./components/CharacterInfoPanel";
import StatWindow from "./components/StatWindow";
import EquipmentGrid from "./components/EquipmentGrid";
import type { CharacterInfo } from "./types/character";


export default function App() {
  // App이 "전체 상태"를 관리합니다.
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

      <main className="layout">
        <CharacterInfoPanel value={character} onChange={setCharacter} />
        <StatWindow character={character} onChange={setCharacter} />
        <EquipmentGrid />
      </main>
    </div>
  );
}
