// src/types/character.ts
import type { JobBranchId, JobGroup } from "../data/jobs";

export type CharacterInfo = {
  name: string;
  level: number;
  jobGroup: JobGroup;
  jobBranch: JobBranchId;
};
