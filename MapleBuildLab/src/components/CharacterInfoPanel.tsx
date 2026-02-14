import React from "react";
import type { CharacterInfo } from "../types/character";
import { branchesOf } from "../data/jobs";

// 이 컴포넌트는 "입력 UI"만 담당.
// 실제 데이터(상태)는 부모(App)가 들고 있고, 여기서는 바뀐 값을 onChange로 전달합니다.
export default function CharacterInfoPanel(props: {
  value: CharacterInfo;
  onChange: (next: CharacterInfo) => void;
}) {
  const { value, onChange } = props;

  function handleName(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...value, name: e.target.value });
  }

  function handleLevel(e: React.ChangeEvent<HTMLInputElement>) {
    // input은 문자열로 들어오므로 숫자로 변환
    const n = Number(e.target.value);
    onChange({ ...value, level: Number.isFinite(n) ? n : 1 });
  }

  function handleJobGroup(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextGroup = e.target.value as CharacterInfo["jobGroup"];
    // 직업군이 바뀌면, 그 직업군에 해당하는 첫 트리로 자동 변경
    const firstBranch = branchesOf(nextGroup)[0];
    onChange({
      ...value,
      jobGroup: nextGroup,
      jobBranch: firstBranch.id,
    });
  }

  function handleJobBranch(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ ...value, jobBranch: e.target.value as CharacterInfo["jobBranch"] });
  }

  const branchOptions = branchesOf(value.jobGroup);

  return (
    <section className="panel">
      <h2 className="panelTitle">캐릭터 정보</h2>

      <div className="formGrid">
        <label className="label">캐릭터 이름</label>
        <input className="input" value={value.name} onChange={handleName} placeholder="예: 단단단창" />

        <label className="label">직업군</label>
        <select className="input" value={value.jobGroup} onChange={handleJobGroup}>
          <option value="전사">전사</option>
          <option value="궁수">궁수</option>
          <option value="도적">도적</option>
          <option value="법사">법사</option>
        </select>

        <label className="label">전직 트리</label>
        <select className="input" value={value.jobBranch} onChange={handleJobBranch}>
          {branchOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>

        <label className="label">레벨</label>
        <input className="input" type="number" min={1} max={200} value={value.level} onChange={handleLevel} />
      </div>
    </section>
  );
}
