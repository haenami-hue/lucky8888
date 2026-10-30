// 60갑자(干支) 계산. 일주는 율리우스일, 연주는 입춘(2월 4일 근사) 기준.
import type { Element } from "./ohaeng";

export interface Stem { hanja: string; hangul: string; element: Element; yang: boolean }
export interface Branch { hanja: string; hangul: string; element: Element; animal: string }
export interface Pillar { stem: Stem; branch: Branch; index: number }

export const STEMS: Stem[] = [
  { hanja: "甲", hangul: "갑", element: "wood", yang: true },
  { hanja: "乙", hangul: "을", element: "wood", yang: false },
  { hanja: "丙", hangul: "병", element: "fire", yang: true },
  { hanja: "丁", hangul: "정", element: "fire", yang: false },
  { hanja: "戊", hangul: "무", element: "earth", yang: true },
  { hanja: "己", hangul: "기", element: "earth", yang: false },
  { hanja: "庚", hangul: "경", element: "metal", yang: true },
  { hanja: "辛", hangul: "신", element: "metal", yang: false },
  { hanja: "壬", hangul: "임", element: "water", yang: true },
  { hanja: "癸", hangul: "계", element: "water", yang: false },
];

export const BRANCHES: Branch[] = [
  { hanja: "子", hangul: "자", element: "water", animal: "쥐" },
  { hanja: "丑", hangul: "축", element: "earth", animal: "소" },
  { hanja: "寅", hangul: "인", element: "wood", animal: "호랑이" },
  { hanja: "卯", hangul: "묘", element: "wood", animal: "토끼" },
  { hanja: "辰", hangul: "진", element: "earth", animal: "용" },
  { hanja: "巳", hangul: "사", element: "fire", animal: "뱀" },
  { hanja: "午", hangul: "오", element: "fire", animal: "말" },
  { hanja: "未", hangul: "미", element: "earth", animal: "양" },
  { hanja: "申", hangul: "신", element: "metal", animal: "원숭이" },
  { hanja: "酉", hangul: "유", element: "metal", animal: "닭" },
  { hanja: "戌", hangul: "술", element: "earth", animal: "개" },
  { hanja: "亥", hangul: "해", element: "water", animal: "돼지" },
];

const mod = (n: number, m: number) => ((n % m) + m) % m;

function pillar(index: number): Pillar {
  const i = mod(index, 60);
  return { stem: STEMS[i % 10], branch: BRANCHES[i % 12], index: i };
}

/** y-m-d 의 율리우스일 (타임존 영향 없이 달력 날짜만 사용) */
function julianDay(y: number, m: number, d: number): number {
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000) + 2_440_588;
}

export function dayPillar(y: number, m: number, d: number): Pillar {
  return pillar(julianDay(y, m, d) + 49);
}

export function yearPillar(y: number, m: number, d: number): Pillar {
  const sajuYear = m < 2 || (m === 2 && d < 4) ? y - 1 : y;
  return pillar(sajuYear - 4);
}

export const pillarName = (p: Pillar) => `${p.stem.hanja}${p.branch.hanja}(${p.stem.hangul}${p.branch.hangul})`;
