// 동행복권 로또6/45 회차별 당첨결과를 수집해 public/data/draws.json 에 저장한다.
// 이미 저장된 회차는 건너뛰고 새 회차만 받아온다 (증분 수집).
//   node scripts/fetch-draws.mjs          증분 수집
//   node scripts/fetch-draws.mjs --full   처음부터 다시 수집
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ENDPOINT = "https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do";
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/data/draws.json");
const DELAY_MS = 300;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(params) {
  const url = `${ENDPOINT}?${new URLSearchParams(params)}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json?.data?.list ?? [];
    } catch (err) {
      if (attempt >= 3) throw new Error(`${url} 요청 실패: ${err.message}`);
      await sleep(1000 * attempt);
    }
  }
}

function toDraw(row) {
  const d = String(row.ltRflYmd);
  return {
    no: row.ltEpsd,
    date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
    nums: [row.tm1WnNo, row.tm2WnNo, row.tm3WnNo, row.tm4WnNo, row.tm5WnNo, row.tm6WnNo].sort((a, b) => a - b),
    bonus: row.bnsWnNo,
    prizes: [1, 2, 3, 4, 5].map((r) => ({ count: row[`rnk${r}WnNope`], amount: row[`rnk${r}WnAmt`] })),
    sales: row.rlvtEpsdSumNtslAmt,
  };
}

async function loadExisting() {
  if (process.argv.includes("--full")) return [];
  try {
    return JSON.parse(await readFile(OUT, "utf8")).draws ?? [];
  } catch {
    return [];
  }
}

async function main() {
  const existing = await loadExisting();
  const known = new Set(existing.map((d) => d.no));
  const lastKnown = existing.reduce((m, d) => Math.max(m, d.no), 0);

  // srchDir=latest 는 커서 다음 회차부터 최대 10개를 내림차순으로 준다.
  // 마지막으로 알고 있는 회차를 커서로 두고 빈 응답이 올 때까지 앞으로 나아간다.
  // 커서 0 은 받지 않으므로 처음 수집할 때는 1회 기준 center 조회(1~10회)로 시작한다.
  const fresh = [];
  let cursor = lastKnown;
  while (true) {
    const list = cursor === 0
      ? await fetchPage({ srchDir: "center", srchLtEpsd: "1" })
      : await fetchPage({ srchDir: "latest", srchCursorLtEpsd: String(cursor) });
    const rows = list.filter((r) => !known.has(r.ltEpsd));
    if (rows.length === 0) break;
    fresh.push(...rows.map(toDraw));
    rows.forEach((r) => known.add(r.ltEpsd));
    cursor = Math.max(...list.map((r) => r.ltEpsd));
    process.stdout.write(`\r${cursor}회까지 수집`);
    await sleep(DELAY_MS);
  }
  if (fresh.length) process.stdout.write("\n");

  const draws = [...existing, ...fresh].sort((a, b) => a.no - b.no);
  const missing = [];
  for (let i = 1; i <= (draws.at(-1)?.no ?? 0); i++) if (!known.has(i)) missing.push(i);
  if (missing.length) throw new Error(`누락된 회차: ${missing.join(", ")}`);

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), draws }));
  console.log(`새 회차 ${fresh.length}개 추가, 총 ${draws.length}회차 (최신 ${draws.at(-1)?.no}회)`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
