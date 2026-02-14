// src/data/jobs.ts
// 직업군/전직 트리 목록을 "데이터"로 정의합니다.
// UI는 이 데이터를 읽어서 옵션을 만들 거예요.

export type JobGroup = "전사" | "궁수" | "도적" | "법사";

export type JobBranchId =
  | "warrior_paladin"
  | "warrior_hero"
  | "warrior_darkknight"
  | "archer_bowmaster"
  | "archer_marksman"
  | "thief_nightlord"
  | "thief_shadower"
  | "mage_bishop"
  | "mage_ice_lightning"
  | "mage_fire_poison";

export type JobBranch = {
  id: JobBranchId;
  group: JobGroup;
  label: string;                 // 옵션에 보여줄 문구
  steps: [string, string, string]; // 1~3차 직업명(나중에 표시/필터에 활용 가능)
};

export const JOB_BRANCHES: JobBranch[] = [
  // 전사
  { id: "warrior_paladin", group: "전사", label: "페이지/나이트/팔라딘", steps: ["페이지", "나이트", "팔라딘"] },
  { id: "warrior_hero", group: "전사", label: "파이터/크루세이더/히어로", steps: ["파이터", "크루세이더", "히어로"] },
  { id: "warrior_darkknight", group: "전사", label: "스피어맨/용기사/다크나이트", steps: ["스피어맨", "용기사", "다크나이트"] },

  // 궁수
  { id: "archer_bowmaster", group: "궁수", label: "헌터/레인저/보우마스터", steps: ["헌터", "레인저", "보우마스터"] },
  { id: "archer_marksman", group: "궁수", label: "사수/저격수/신궁", steps: ["사수", "저격수", "신궁"] },

  // 도적
  { id: "thief_nightlord", group: "도적", label: "어쌔신/허밋/나이트로드", steps: ["어쌔신", "허밋", "나이트로드"] },
  { id: "thief_shadower", group: "도적", label: "시프/시프마스터/섀도어", steps: ["시프", "시프마스터", "섀도어"] },

  // 법사
  { id: "mage_bishop", group: "법사", label: "클레릭/프리스트/비숍", steps: ["클레릭", "프리스트", "비숍"] },
  { id: "mage_ice_lightning", group: "법사", label: "썬콜", steps: ["위자드(썬/콜)", "메이지(썬/콜)", "아크메이지(썬/콜)"] },
  { id: "mage_fire_poison", group: "법사", label: "불독", steps: ["위자드(불/독)", "메이지(불/독)", "아크메이지(불/독)"] },
];

export function branchesOf(group: JobGroup) {
  return JOB_BRANCHES.filter((b) => b.group === group);
}
