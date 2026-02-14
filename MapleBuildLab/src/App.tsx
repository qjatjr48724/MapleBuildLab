import "./App.css";
import React from "react";
import CharacterInfoPanel from "./components/CharacterInfoPanel";
import StatWindow from "./components/StatWindow";
import EquipmentGrid from "./components/EquipmentGrid";
import type { CharacterInfo } from "./types/character";
import { JOB_BRANCHES } from "./data/jobs";

export default function App() {
  // App이 "전체 상태"를 관리합니다.
  const [character, setCharacter] = React.useState<CharacterInfo>(() => ({
    name: "단단단창",
    level: 27,
    jobGroup: "전사",
    jobBranch: JOB_BRANCHES.find((b) => b.id === "warrior_darkknight")?.id ?? "warrior_darkknight",
  }));

  return (
    <div className="page">
      <header className="topBar">
        <h1 className="title">MapleBuildLab</h1>
        <div className="subTitle">Step 1: 캐릭터/스탯/장비 3영역 UI</div>
      </header>

      <main className="layout">
        <CharacterInfoPanel value={character} onChange={setCharacter} />
        <StatWindow character={character} />
        <EquipmentGrid />
      </main>
    </div>
  );
}
