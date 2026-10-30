import type { Draw } from "../../data/types";

export const NUMBERS = Array.from({ length: 45 }, (_, i) => i + 1);

/** 번호별 출현 횟수. 결과 배열의 index 가 번호 (0 은 사용 안 함) */
export function frequency(draws: Draw[], includeBonus = false): number[] {
  const counts = new Array(46).fill(0);
  for (const d of draws) {
    for (const n of d.nums) counts[n]++;
    if (includeBonus) counts[d.bonus]++;
  }
  return counts;
}

/** 번호별 미출현 회차 수 (최신 회차에 나왔으면 0). index 가 번호 */
export function gaps(draws: Draw[]): number[] {
  const result = new Array(46).fill(draws.length);
  for (let i = draws.length - 1, age = 0; i >= 0; i--, age++) {
    for (const n of draws[i].nums) if (result[n] === draws.length) result[n] = age;
  }
  return result;
}

export const oddCount = (nums: number[]) => nums.filter((n) => n % 2 === 1).length;
export const sum = (nums: number[]) => nums.reduce((a, b) => a + b, 0);

/** 홀수 개수(0~6)별 회차 수 */
export function oddCountDistribution(draws: Draw[]): number[] {
  const dist = new Array(7).fill(0);
  for (const d of draws) dist[oddCount(d.nums)]++;
  return dist;
}

/** 당첨번호 합계 분포. binSize 단위 구간의 시작값과 회차 수 */
export function sumDistribution(draws: Draw[], binSize = 20): { from: number; count: number }[] {
  const bins = new Map<number, number>();
  for (const d of draws) {
    const from = Math.floor(sum(d.nums) / binSize) * binSize;
    bins.set(from, (bins.get(from) ?? 0) + 1);
  }
  const keys = [...bins.keys()];
  const out = [];
  for (let from = Math.min(...keys); from <= Math.max(...keys); from += binSize) {
    out.push({ from, count: bins.get(from) ?? 0 });
  }
  return out;
}

/** 가장 긴 연속 번호 길이 (예: 3,4,5 → 3) */
export function longestRun(sorted: number[]): number {
  let best = 1;
  for (let i = 1, run = 1; i < sorted.length; i++) {
    run = sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}
