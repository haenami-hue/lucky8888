// 질문 답변 + 사주(일간) + 추첨일 일진 → 번호 가중치 → 5게임과 풀이.
// 규칙 설명: docs/recommend-logic.md
import type { Draw } from "../../data/types";
import { generateGames } from "../../lib/lotto/generate";
import { frequency, gaps, longestRun, oddCount, sum } from "../../lib/lotto/stats";
import { dayPillar, pillarName, yearPillar, type Pillar } from "../../lib/saju/ganzhi";
import {
  ELEMENTS,
  ELEMENT_INFO,
  controlledBy,
  controls,
  elementLabel,
  elementOfNumber,
  generatedBy,
  generates,
  type Element,
} from "../../lib/saju/ohaeng";
import type { Mood, Yinyang } from "./questions";

export interface YMD { y: number; m: number; d: number }

export interface RecommendInput {
  draws: Draw[];
  mood: Mood;
  yinyang: Yinyang;
  birth?: YMD;
  /** 다른 사람·위인의 생년월일일 때 그 이름. 없으면 "당신" */
  subject?: string;
  drawDate: YMD;
}

export interface Game {
  nums: number[];
  summary: string[];
}

export interface Recommendation {
  drawNo: number;
  drawDate: YMD;
  drawPillar: Pillar;
  me?: { day: Pillar; year: Pillar };
  subject?: string;
  fortune: { title: string; lines: string[] };
  luckyElements: Element[];
  games: Game[];
  /** 번호별 풀이 (게임에 등장한 번호만) */
  notes: Record<number, string[]>;
}

const STEM_IMAGE: Record<string, string> = {
  甲: "곧게 뻗은 큰 나무",
  乙: "바람에도 꺾이지 않는 풀꽃",
  丙: "세상을 비추는 태양",
  丁: "어둠을 밝히는 촛불",
  戊: "듬직한 큰 산",
  己: "만물을 기르는 논밭",
  庚: "단단한 바위와 쇠",
  辛: "빛나는 보석",
  壬: "넓고 깊은 바다",
  癸: "대지를 적시는 단비",
};

const MOOD_ELEMENT: Record<Mood, Element> = { change: "fire", flow: "earth", wait: "water" };
const ODD_TARGET: Record<Yinyang, number> = { yang: 4, harmony: 3, yin: 2 };
const YINYANG_TEXT: Record<Yinyang, string> = {
  yang: "한낮의 양(陽) 기운",
  harmony: "저녁노을 같은 음양 조화",
  yin: "한밤의 음(陰) 기운",
};

/** 받침 유무로 조사 고르기: josa("아인슈타인", "이", "가") → "아인슈타인이" */
function josa(word: string, withFinal: string, withoutFinal: string): string {
  // "火(화)" 처럼 괄호로 끝나면 괄호 안 글자로 판단
  const last = word.endsWith(")") ? word.at(-2)! : word.at(-1)!;
  const code = last.charCodeAt(0) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return word + (hasFinal ? withFinal : withoutFinal);
}

const digitsText = (e: Element) => ELEMENT_INFO[e].digits.join("·");
const ymdText = ({ y, m, d }: YMD) => `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;

/**
 * 오늘(KST) 기준으로 아직 살 수 있는 다음 토요일 추첨일.
 * 토요일 20시에 판매가 마감되므로 그 이후, 또는 그날 결과가 이미 들어왔으면 다음 주.
 */
export function nextDrawDate(now = new Date(), latestDrawDate?: string): YMD {
  const kst = new Date(now.getTime() + 9 * 3_600_000);
  const dow = kst.getUTCDay();
  let add = (6 - dow + 7) % 7;
  if (add === 0 && kst.getUTCHours() >= 20) add = 7;
  let t = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + add));
  if (latestDrawDate && t.toISOString().slice(0, 10) <= latestDrawDate) t = new Date(t.getTime() + 7 * 86_400_000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

function relationText(me: Element, day: Element, who: string): string {
  if (day === me) return `같은 기운이 모이는 날이에요. ${who}의 힘이 단단해지는 한 주입니다.`;
  if (generates(day) === me) return `추첨일이 ${josa(who, "을", "를")} 생(生)해 주는 날! 귀인의 도움이 깃드는 한 주입니다.`;
  if (generates(me) === day) return `${who}의 기운이 흘러가 꽃피우는 날. 나눔이 복으로 돌아오는 한 주입니다.`;
  if (controls(me) === day) return `${josa(who, "이", "가")} 다스리는 기운은 사주에서 재성(財星), 곧 재물입니다. 재물운이 비치는 날이에요!`;
  return `${josa(who, "을", "를")} 단련시키는 기운이 도는 날이에요. 욕심은 덜고 소소한 즐거움으로 즐기세요.`;
}

export function recommend(input: RecommendInput): Recommendation {
  const { draws, mood, yinyang, birth, subject, drawDate } = input;
  const who = subject ?? "당신";
  const latest = draws[draws.length - 1];
  const weeks = Math.round(
    (Date.UTC(drawDate.y, drawDate.m - 1, drawDate.d) - Date.parse(latest.date)) / (7 * 86_400_000),
  );
  const drawNo = latest.no + Math.max(weeks, 1);

  const drawPillar = dayPillar(drawDate.y, drawDate.m, drawDate.d);
  const dayElement = drawPillar.stem.element;
  const moodElement = MOOD_ELEMENT[mood];
  const me = birth ? { day: dayPillar(birth.y, birth.m, birth.d), year: yearPillar(birth.y, birth.m, birth.d) } : undefined;
  const myElement = me?.day.stem.element;

  // 오행별 배수
  const elementWeight = Object.fromEntries(ELEMENTS.map((e) => [e, 1])) as Record<Element, number>;
  elementWeight[dayElement] *= 1.2;
  elementWeight[moodElement] *= 1.2;
  if (myElement) {
    elementWeight[generatedBy(myElement)] *= 1.5;
    elementWeight[myElement] *= 1.25;
    elementWeight[controlledBy(myElement)] *= 0.75;
  }

  const recent = draws.slice(-50);
  const recentFreq = frequency(recent);
  const maxFreq = Math.max(...recentFreq);
  const gap = gaps(draws);
  const maxGap = Math.max(...gap.slice(1));

  const weights = new Array(46).fill(0);
  for (let n = 1; n <= 45; n++) {
    let w = elementWeight[elementOfNumber(n)];
    if (mood === "change") w *= 0.6 + 1.4 * (recentFreq[n] / maxFreq);
    if (mood === "wait") w *= 0.6 + 1.4 * (gap[n] / maxGap);
    weights[n] = w;
  }

  const [minSum, maxSum] = mood === "flow" ? [100, 175] : [80, 200];
  const accept = (nums: number[]) => {
    if (oddCount(nums) !== ODD_TARGET[yinyang]) return false;
    if (longestRun(nums) > 2) return false;
    const s = sum(nums);
    if (s < minSum || s > maxSum) return false;
    if (mood === "flow") {
      const low = nums.filter((n) => n <= 22).length;
      if (low < 2 || low > 4) return false;
    }
    return true;
  };

  const games = generateGames(weights, accept, 5).map((nums) => {
    const counts = ELEMENTS.map((e) => ({ e, c: nums.filter((n) => elementOfNumber(n) === e).length })).filter((x) => x.c);
    const odd = oddCount(nums);
    return {
      nums,
      summary: [
        `양 ${odd} : 음 ${6 - odd} · ${YINYANG_TEXT[yinyang]}`,
        `오행 ${counts.map((x) => `${ELEMENT_INFO[x.e].hanja}${x.c}`).join(" ")}`,
        `합계 ${sum(nums)}`,
      ],
    };
  });

  const notes: Record<number, string[]> = {};
  for (const n of new Set(games.flatMap((g) => g.nums))) {
    const e = elementOfNumber(n);
    const list = [`끝자리 ${n % 10} → ${ELEMENT_INFO[e].emoji} ${elementLabel(e)}`];
    if (myElement && e === generatedBy(myElement)) list.push(`${who}의 ${ELEMENT_INFO[myElement].hanja} 기운을 키워 주는 귀인의 수`);
    else if (myElement && e === myElement) list.push(`${josa(who, "과", "와")} 같은 기운, 든든한 동료의 수`);
    if (e === dayElement) list.push(`추첨일 ${drawPillar.stem.hanja}${ELEMENT_INFO[e].hanja} 기운과 공명`);
    if (e === moodElement) list.push(`지금 마음이 부르는 ${ELEMENT_INFO[e].hanja} 기운`);
    if (mood === "change" && recentFreq[n] >= 8) list.push(`최근 50회 중 ${recentFreq[n]}번 출현한 뜨거운 번호`);
    if (mood === "wait" && gap[n] >= 10) list.push(`${gap[n]}회째 쉬며 기운을 모으는 중`);
    notes[n] = list;
  }

  const luckyElements = [...new Set([myElement ? generatedBy(myElement) : dayElement, moodElement])];
  const lines = [
    `추첨일 ${ymdText(drawDate)}(토)은 ${pillarName(drawPillar)}일, 그날의 주인공은 ${drawPillar.stem.hanja}${ELEMENT_INFO[dayElement].hanja} ${ELEMENT_INFO[dayElement].emoji}입니다.`,
  ];
  if (me && myElement) {
    const support = generatedBy(myElement);
    lines.push(
      `${who}의 일간은 ${me.day.stem.hanja}${ELEMENT_INFO[myElement].hanja}, ${STEM_IMAGE[me.day.stem.hanja]}의 기운을 타고난 ${me.year.branch.animal}띠예요.`,
      relationText(myElement, dayElement, who),
      `${josa(elementLabel(myElement), "을", "를")} 키워 주는 ${elementLabel(support)}, 곧 끝자리 ${digitsText(support)}인 번호를 귀인수로 삼았습니다.`,
    );
  } else {
    lines.push(`생년월일을 넣으면 당신의 일간(日干)으로 귀인수를 찾아 드려요.`);
  }
  lines.push(
    `마음의 기운은 ${elementLabel(moodElement)}, 끝자리 ${digitsText(moodElement)}인 번호에 힘을 실었습니다.`,
  );

  return {
    drawNo,
    drawDate,
    drawPillar,
    me,
    subject: me ? subject : undefined,
    fortune: { title: `${drawNo}회 행운 풀이`, lines },
    luckyElements,
    games,
    notes,
  };
}
