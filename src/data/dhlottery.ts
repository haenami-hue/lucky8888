import type { Draw } from "./types";

// 앱이 동행복권에서 직접 새 회차를 받아온다 (docs/data-source.md 참고).
// 응답 → Draw 변환은 scripts/fetch-draws.mjs 의 toDraw 와 같게 유지할 것.
const ENDPOINT = "https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do";

type Row = Record<string, number | string>;

function toDraw(row: Row): Draw {
  const d = String(row.ltRflYmd);
  const n = (k: string) => Number(row[k]);
  return {
    no: n("ltEpsd"),
    date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
    nums: [1, 2, 3, 4, 5, 6].map((i) => n(`tm${i}WnNo`)).sort((a, b) => a - b),
    bonus: n("bnsWnNo"),
    prizes: [1, 2, 3, 4, 5].map((r) => ({ count: n(`rnk${r}WnNope`), amount: n(`rnk${r}WnAmt`) })),
    sales: n("rlvtEpsdSumNtslAmt"),
  };
}

/** lastNo 다음 회차부터 끝까지 받아 오름차순으로 돌려준다. */
export async function fetchDrawsAfter(lastNo: number, signal?: AbortSignal): Promise<Draw[]> {
  const fresh = new Map<number, Draw>();
  let cursor = lastNo;
  // srchDir=latest 는 커서 다음 회차부터 최대 10개씩 준다. 빈 응답이 올 때까지 앞으로 나아간다.
  for (let page = 0; page < 20; page++) {
    const params = new URLSearchParams({ srchDir: "latest", srchCursorLtEpsd: String(cursor) });
    const res = await fetch(`${ENDPOINT}?${params}`, { signal, credentials: "omit" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list: Row[] = (await res.json())?.data?.list ?? [];
    const rows = list.map(toDraw).filter((d) => d.no > lastNo && !fresh.has(d.no));
    if (rows.length === 0) break;
    rows.forEach((d) => fresh.set(d.no, d));
    cursor = Math.max(...rows.map((d) => d.no));
  }
  return [...fresh.values()].sort((a, b) => a.no - b.no);
}
