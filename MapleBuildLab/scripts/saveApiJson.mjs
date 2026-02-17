// scripts/saveApiJson.mjs
// 실행: node scripts/saveApiJson.mjs
// 수정: 아래 API_URL / OUTPUT_PATH만 바꿔가며 사용

import fs from "node:fs/promises";

// ✅ 여기만 수정해서 사용하세요
const API_URL = "https://maplestory.io/api/GMS/200/item/list?startPosition=0&overallCategoryFilter=equip&categoryFilter=armor&subCategoryFilter=hat";
const OUTPUT_PATH = "./api_result_hat.json";

// (선택) 필요하면 헤더 추가
const HEADERS = {
  // "Accept": "application/json",
};

async function main() {
  console.log("▶ Fetch:", API_URL);

  const res = await fetch(API_URL, {
    method: "GET",
    headers: HEADERS,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}\n${text}`);
  }

  const data = await res.json();

  // 보기 좋게 pretty print로 저장
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2), "utf-8");

  console.log(`✅ saved: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("❌ error:", err);
  process.exit(1);
});
