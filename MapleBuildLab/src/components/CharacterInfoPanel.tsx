import React from "react";
import type { CharacterInfo } from "../types/character";
import { jobsOf } from "../data/jobs";

export default function CharacterInfoPanel(props: {
  value: CharacterInfo;
  onChange: (next: CharacterInfo) => void;
}) {
  const { value, onChange } = props;

  function handleName(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...value, name: e.target.value });
  }

  function handleLevel(e: React.ChangeEvent<HTMLInputElement>) {
    // 빈칸이면 ""로 유지, 숫자면 number로 저장
    const raw = e.target.value;
    if (raw === "") {
      onChange({ ...value, level: "" });
      return;
    }
    const n = Number(raw);
    onChange({ ...value, level: Number.isFinite(n) ? n : "" });
  }

  function handleJobGroup(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextGroup = e.target.value as CharacterInfo["jobGroup"]; // "" 또는 전사/궁수/도적/법사
    // 직업군이 바뀌면 직업은 "선택안함"으로 초기화
    onChange({
      ...value,
      jobGroup: nextGroup,
      jobId: "",
    });
  }

  function handleJob(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ ...value, jobId: e.target.value as CharacterInfo["jobId"] });
  }

  const jobOptions = value.jobGroup ? jobsOf(value.jobGroup) : [];

  return (
    <section className="panel">
      <h2 className="panelTitle">캐릭터 정보</h2>

      <div className="formGrid">
        <label className="label">캐릭터 이름</label>
        <input className="input" value={value.name} onChange={handleName} placeholder="" />

        {/* ✅ 이름만 '직업군'으로 표기 */}
        <label className="label">직업군</label>
        <select className="input" value={value.jobGroup} onChange={handleJobGroup}>
          <option value="">선택안함</option>
          <option value="전사">전사</option>
          <option value="궁수">궁수</option>
          <option value="도적">도적</option>
          <option value="법사">법사</option>
        </select>

        {/* ✅ 새로 추가: 직업 */}
        <label className="label">직업</label>
        <select
          className="input"
          value={value.jobId}
          onChange={handleJob}
          disabled={!value.jobGroup}
          title={!value.jobGroup ? "직업군을 먼저 선택하세요" : undefined}
        >
          <option value="">선택안함</option>
          {jobOptions.map((j) => (
            <option key={j.id} value={j.id}>
              {j.label}
            </option>
          ))}
        </select>

        <label className="label">레벨</label>
        <input
          className="input"
          type="number"
          min={1}
          max={200}
          value={value.level}
          onChange={handleLevel}
          placeholder=""
        />
      </div>
    </section>
  );
}
