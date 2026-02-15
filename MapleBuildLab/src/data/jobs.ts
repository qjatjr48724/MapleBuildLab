// src/data/jobs.ts
// 직업군(전사/궁수/도적/법사)과 그 직업 목록을 데이터로 관리합니다.

export type JobGroup = "전사" | "궁수" | "도적" | "법사";
export type JobId =
  | "paladin_path"     // 페이지/나이트/팔라딘
  | "hero_path"        // 파이터/크루세이더/히어로
  | "darkknight_path"  // 스피어맨/용기사/다크나이트
  | "bowmaster_path"   // 헌터/레인저/보우마스터
  | "marksman_path"    // 사수/저격수/신궁
  | "nightlord_path"   // 어쌔신/허밋/나이트로드
  | "shadower_path"    // 시프/시프마스터/섀도어
  | "bishop_path"      // 클레릭/프리스트/비숍
  | "ice_lightning"    // 썬콜
  | "fire_poison";     // 불독

export type JobOption = {
  id: JobId;
  group: JobGroup;
  label: string;                 // 드롭다운에 표시될 이름
  steps: [string, string, string]; // 1~3차 직업명(나중에 스킬/숙련도 계산 확장용)
};

export const JOBS: JobOption[] = [
  // 전사
  { id: "paladin_path", group: "전사", label: "페이지/나이트/팔라딘", steps: ["페이지", "나이트", "팔라딘"] },
  { id: "hero_path", group: "전사", label: "파이터/크루세이더/히어로", steps: ["파이터", "크루세이더", "히어로"] },
  { id: "darkknight_path", group: "전사", label: "스피어맨/용기사/다크나이트", steps: ["스피어맨", "용기사", "다크나이트"] },

  // 궁수
  { id: "bowmaster_path", group: "궁수", label: "헌터/레인저/보우마스터", steps: ["헌터", "레인저", "보우마스터"] },
  { id: "marksman_path", group: "궁수", label: "사수/저격수/신궁", steps: ["사수", "저격수", "신궁"] },

  // 도적
  { id: "nightlord_path", group: "도적", label: "어쌔신/허밋/나이트로드", steps: ["어쌔신", "허밋", "나이트로드"] },
  { id: "shadower_path", group: "도적", label: "시프/시프마스터/섀도어", steps: ["시프", "시프마스터", "섀도어"] },

  // 법사
  { id: "bishop_path", group: "법사", label: "클레릭/프리스트/비숍", steps: ["클레릭", "프리스트", "비숍"] },
  { id: "ice_lightning", group: "법사", label: "썬콜", steps: ["위자드(썬/콜)", "메이지(썬/콜)", "아크메이지(썬/콜)"] },
  { id: "fire_poison", group: "법사", label: "불독", steps: ["위자드(불/독)", "메이지(불/독)", "아크메이지(불/독)"] },
];

export function jobsOf(group: JobGroup) {
  return JOBS.filter((j) => j.group === group);
}
