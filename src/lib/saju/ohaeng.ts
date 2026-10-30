// 오행(五行)과 하도(河圖) 수리: 끝자리 1·6 水, 2·7 火, 3·8 木, 4·9 金, 5·0 土
export type Element = "wood" | "fire" | "earth" | "metal" | "water";

export const ELEMENTS: Element[] = ["wood", "fire", "earth", "metal", "water"];

export const ELEMENT_INFO: Record<Element, { hanja: string; hangul: string; emoji: string; digits: [number, number] }> = {
  wood: { hanja: "木", hangul: "목", emoji: "🌳", digits: [3, 8] },
  fire: { hanja: "火", hangul: "화", emoji: "🔥", digits: [2, 7] },
  earth: { hanja: "土", hangul: "토", emoji: "⛰️", digits: [5, 0] },
  metal: { hanja: "金", hangul: "금", emoji: "⚔️", digits: [4, 9] },
  water: { hanja: "水", hangul: "수", emoji: "🌊", digits: [1, 6] },
};

const BY_DIGIT: Element[] = ["earth", "water", "fire", "wood", "metal", "earth", "water", "fire", "wood", "metal"];

export const elementOfNumber = (n: number): Element => BY_DIGIT[n % 10];

/** 상생 순환: 木→火→土→金→水→木 */
export const generates = (e: Element): Element => ELEMENTS[(ELEMENTS.indexOf(e) + 1) % 5];
/** e 를 생해주는 오행 (인성 印星) */
export const generatedBy = (e: Element): Element => ELEMENTS[(ELEMENTS.indexOf(e) + 4) % 5];
/** 상극: 木剋土, 火剋金, 土剋水, 金剋木, 水剋火 */
export const controls = (e: Element): Element => ELEMENTS[(ELEMENTS.indexOf(e) + 2) % 5];
/** e 를 극하는 오행 (관성 官星) */
export const controlledBy = (e: Element): Element => ELEMENTS[(ELEMENTS.indexOf(e) + 3) % 5];

export const elementLabel = (e: Element) => `${ELEMENT_INFO[e].hanja}(${ELEMENT_INFO[e].hangul})`;
