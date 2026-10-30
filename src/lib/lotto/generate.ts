// 가중 무작위 추출로 6개 번호 조합을 만들고 조건 필터를 통과한 것만 고른다.

/** weights[n] 이 번호 n 의 가중치 (index 0 무시) */
export function weightedPick(weights: number[], count: number, rng: () => number): number[] {
  const pool = weights.map((w, n) => ({ n, w: n === 0 ? 0 : w }));
  const picked: number[] = [];
  while (picked.length < count) {
    const total = pool.reduce((s, p) => s + p.w, 0);
    let r = rng() * total;
    const hit = pool.find((p) => p.w > 0 && (r -= p.w) <= 0) ?? pool.findLast((p) => p.w > 0)!;
    picked.push(hit.n);
    hit.w = 0;
  }
  return picked.sort((a, b) => a - b);
}

/**
 * 조건을 만족하는 서로 다른 조합 games 개를 만든다.
 * 조건이 너무 빡빡해 시도 횟수를 넘기면 마지막 후보를 그대로 쓴다.
 */
export function generateGames(
  weights: number[],
  accept: (nums: number[]) => boolean,
  games: number,
  rng: () => number = Math.random,
  maxTries = 5000,
): number[][] {
  const out: number[][] = [];
  const seen = new Set<string>();
  while (out.length < games) {
    let nums = weightedPick(weights, 6, rng);
    for (let t = 0; t < maxTries && (!accept(nums) || seen.has(nums.join())); t++) {
      nums = weightedPick(weights, 6, rng);
    }
    seen.add(nums.join());
    out.push(nums);
  }
  return out;
}
