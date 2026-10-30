export type Mood = "change" | "flow" | "wait";
export type Yinyang = "yang" | "harmony" | "yin";

export interface Option<T extends string> {
  value: T;
  emoji: string;
  label: string;
  desc: string;
}

export interface Question<T extends string> {
  title: string;
  hint: string;
  options: Option<T>[];
}

export const MOOD_QUESTION: Question<Mood> = {
  title: "요즘 마음은 어떤가요?",
  hint: "마음의 결에 맞는 오행과 번호 흐름을 고릅니다",
  options: [
    { value: "change", emoji: "🔥", label: "확 바꾸고 싶다", desc: "최근 자주 나온 번호 · 火 기운" },
    { value: "flow", emoji: "🌿", label: "흐름을 타고 싶다", desc: "고르게 퍼진 조합 · 土 기운" },
    { value: "wait", emoji: "🌊", label: "조용히 때를 기다린다", desc: "오래 쉰 번호 · 水 기운" },
  ],
};

export const YINYANG_QUESTION: Question<Yinyang> = {
  title: "끌리는 시간은 언제인가요?",
  hint: "음양(陰陽)의 비율을 정합니다. 홀수는 양, 짝수는 음",
  options: [
    { value: "yang", emoji: "☀️", label: "햇살 가득한 한낮", desc: "양(홀수) 4 : 음(짝수) 2" },
    { value: "harmony", emoji: "🌅", label: "노을 지는 저녁", desc: "양 3 : 음 3 조화" },
    { value: "yin", emoji: "🌙", label: "고요한 한밤", desc: "양 2 : 음 4" },
  ],
};
