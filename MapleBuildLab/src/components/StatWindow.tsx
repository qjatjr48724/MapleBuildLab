import type { CharacterInfo } from "../types/character";

// Step 1: 아직 계산은 안 하고 "모양"만 만듭니다.
export default function StatWindow(props: { character: CharacterInfo }) {
  const { character } = props;

  return (
    <section className="panel">
      <h2 className="panelTitle">스탯 정보</h2>

      <div className="statWindow">
        <div className="statHeader">CHARACTER STAT</div>

        <div className="statBody">
          <div className="statLeft">
            <div className="row"><span className="key">이름</span><span className="val">{character.name || "—"}</span></div>
            <div className="row"><span className="key">직업</span><span className="val">{character.jobGroup}</span></div>
            <div className="row"><span className="key">레벨</span><span className="val">{character.level}</span></div>

            <div className="divider" />

            <div className="row"><span className="key">STR</span><span className="val">0 (+0)</span></div>
            <div className="row"><span className="key">DEX</span><span className="val">0 (+0)</span></div>
            <div className="row"><span className="key">INT</span><span className="val">0 (+0)</span></div>
            <div className="row"><span className="key">LUK</span><span className="val">0 (+0)</span></div>
          </div>

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
