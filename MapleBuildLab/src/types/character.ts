// src/types/character.ts
import type { JobGroup, JobId } from "../data/jobs";

export type CharacterInfo = {
  name: string;           // 캐릭터 이름(빈 문자열 가능)
  level: number | "";     // 레벨은 입력칸을 비워둘 수 있으니 "" 허용
  jobGroup: JobGroup | ""; // 선택안함 허용
  jobId: JobId | "";       // 선택안함 허용
  baseStats: { STR: number; DEX: number; INT: number; LUK: number; };

};
