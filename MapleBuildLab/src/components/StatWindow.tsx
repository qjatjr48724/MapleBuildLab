// src/components/StatWindow.tsx
import type { CharacterInfo } from "../types/character";

/**
 * StatWindow
 * - Step 1: 스탯 계산은 아직 안 함 (0으로 고정)
 * - 대신 캐릭터 정보(이름/직업군/레벨)는 App state를 받아와서 보여줌
 * - 입력이 비어 있을 때는 "—"로 표시해서 화면이 깔끔하게 보이게 함
 */
export default function StatWindow(props: {
  character: CharacterInfo;
  onChange: (next: CharacterInfo) => void;
}) {
  const { character, onChange } = props;

  function clamp0(n: number) {
    return n < 0 ? 0 : n;
  }

  function setStat(key: "STR" | "DEX" | "INT" | "LUK", value: number) {
    onChange({
      ...character,
      baseStats: {
        ...character.baseStats,
        [key]: clamp0(value),
      },
    });
  }

  function incStat(key: "STR" | "DEX" | "INT" | "LUK") {
    setStat(key, character.baseStats[key] + 1);
  }

  function decStat(key: "STR" | "DEX" | "INT" | "LUK") {
    setStat(key, character.baseStats[key] - 1);
  }

   // base(순스탯) + equip(장비스탯)을 "총합 (+장비)" 형태로 표시
  function statText(base: number, equip: number) {
    const total = base + equip;
    const sign = equip >= 0 ? "+" : ""; // 음수면 그대로 (-3)처럼 보여야 해서 부호를 자동 처리
    return `${total} (${sign}${equip})`;
  }



  


  // 이름이 빈 문자열이면 "—"로 표시
  const nameText = character.name.trim() ? character.name.trim() : "—";

  // 직업군이 선택 안 됐으면 "—"
  const jobGroupText = character.jobGroup ? character.jobGroup : "—";

  // 레벨이 ""(빈칸)일 수 있으니 안전하게 처리
  const levelText = character.level === "" ? "—" : String(character.level);

  return (
    <section className="panel">
      <h2 className="panelTitle">스탯 정보</h2>

      <div className="statWindow">
        <div className="statHeader">CHARACTER STAT</div>

        <div className="statBody">
          {/* 왼쪽: 기본 정보 + STR/DEX/INT/LUK */}
          <div className="statLeft">
            <div className="row">
              <span className="key">이름</span>
              <span className="val">{nameText}</span>
            </div>
            <div className="row">
              <span className="key">직업</span>
              <span className="val">{jobGroupText}</span>
            </div>
            <div className="row">
              <span className="key">레벨</span>
              <span className="val">{levelText}</span>
            </div>

            <div className="divider" />

            {/* Step 2에서 입력/증감 버튼을 붙일 예정(지금은 고정 표시) */}
            <div className="row">
              <span className="key">STR</span>
              <span className="val">
                <span className="statValue">{statText(character.baseStats.STR, 0)}</span>
                <button className="statArrow" type="button" onClick={() => incStat("STR")}>▲</button>
                <button className="statArrow" type="button" onClick={() => decStat("STR")}>▼</button>
              </span>
            </div>
            <div className="row">
              <span className="key">DEX</span>
              <span className="val">
                <span className="statValue">{statText(character.baseStats.DEX, 0)}</span>
                <button className="statArrow" type="button" onClick={() => incStat("DEX")}>▲</button>
                <button className="statArrow" type="button" onClick={() => decStat("DEX")}>▼</button>
              </span>
            </div>
            <div className="row">
              <span className="key">INT</span>
              <span className="val">
                <span className="statValue">{statText(character.baseStats.INT, 0)}</span>
                <button className="statArrow" type="button" onClick={() => incStat("INT")}>▲</button>
                <button className="statArrow" type="button" onClick={() => decStat("INT")}>▼</button>
              </span>
            </div>
            <div className="row">
              <span className="key">LUK</span>
              <span className="val">
                <span className="statValue">{statText(character.baseStats.LUK, 0)}</span>
                <button className="statArrow" type="button" onClick={() => incStat("LUK")}>▲</button>
                <button className="statArrow" type="button" onClick={() => decStat("LUK")}>▼</button>
              </span>
            </div>
          </div>

          {/* 오른쪽: 파생 능력치(지금은 0/100% 고정) */}
          <div className="statRight">
            <div className="row"><span className="key">공격력</span><span className="val">0 ~ 0</span></div>
            <div className="row"><span className="key">물리방어력</span><span className="val">0</span></div>
            <div className="row"><span className="key">마력</span><span className="val">0</span></div>
            <div className="row"><span className="key">마법방어력</span><span className="val">0</span></div>
            <div className="row"><span className="key">명중률</span><span className="val">0</span></div>
            <div className="row"><span className="key">회피율</span><span className="val">0</span></div>
            <div className="row"><span className="key">순마력</span><span className="val">0</span></div>
            <div className="row"><span className="key">이동속도</span><span className="val">100%</span></div>
            <div className="row"><span className="key">점프력</span><span className="val">100%</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
