// "부자·위인의 사주로 뽑기" 프리셋. 한국인을 먼저 보여 주고, 작고한 인물만 넣는다.
// 날짜는 양력(그레고리력). 일진 계산이 그레고리력 기준이라 1582년 이전 출생 인물은 넣지 않는다.
// 이병철의 1910-02-12 는 음력인지 양력인지 확인되지 않았다 (정주영은 양력 확인).
// 수익화할 때는 재벌 창업주(후손이 그룹 경영 중)를 빼는 것을 검토할 것.

export type FigureGroup = "rich" | "hero";

export interface Figure {
  name: string;
  emoji: string;
  group: FigureGroup;
  /** YYYY-MM-DD (양력) */
  birth: string;
  desc: string;
}

export const FIGURE_GROUPS: { value: FigureGroup; label: string }[] = [
  { value: "rich", label: "💰 부자" },
  { value: "hero", label: "🦸 위인" },
];

export const FIGURES: Figure[] = [
  { name: "정주영", emoji: "🚢", group: "rich", birth: "1915-11-25", desc: "쌀가게 배달원에서 현대그룹을 세운 창업주" },
  { name: "이병철", emoji: "🏭", group: "rich", birth: "1910-02-12", desc: "삼성그룹을 세운 창업주" },
  { name: "록펠러", emoji: "🛢️", group: "rich", birth: "1839-07-08", desc: "석유왕, 역사상 최고 부자로 꼽히는 인물" },
  { name: "카네기", emoji: "🏗️", group: "rich", birth: "1835-11-25", desc: "강철왕, 재산 대부분을 기부한 자선가" },

  { name: "아인슈타인", emoji: "🧠", group: "hero", birth: "1879-03-14", desc: "상대성이론의 천재 물리학자" },
  { name: "뉴턴", emoji: "🍎", group: "hero", birth: "1643-01-04", desc: "만유인력을 발견한 과학자" },
  { name: "에디슨", emoji: "💡", group: "hero", birth: "1847-02-11", desc: "전구를 실용화한 발명왕" },
  { name: "모차르트", emoji: "🎼", group: "hero", birth: "1756-01-27", desc: "신동으로 불린 천재 작곡가" },
];
