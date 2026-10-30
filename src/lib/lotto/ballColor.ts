// 동행복권 공식 공 색상 구간. 실제 색은 tokens.css 의 --ball-* 토큰.
export type BallRange = "yellow" | "blue" | "red" | "gray" | "green";

export const BALL_RANGES: { key: BallRange; label: string }[] = [
  { key: "yellow", label: "1~10" },
  { key: "blue", label: "11~20" },
  { key: "red", label: "21~30" },
  { key: "gray", label: "31~40" },
  { key: "green", label: "41~45" },
];

export function ballRange(n: number): BallRange {
  if (n <= 10) return "yellow";
  if (n <= 20) return "blue";
  if (n <= 30) return "red";
  if (n <= 40) return "gray";
  return "green";
}

export const ballVar = (n: number) => `var(--ball-${ballRange(n)})`;
