export interface Prize {
  count: number;
  /** 1게임당 당첨금 (원) */
  amount: number;
}

export interface Draw {
  no: number;
  /** YYYY-MM-DD */
  date: string;
  /** 오름차순 6개 */
  nums: number[];
  bonus: number;
  /** 1등~5등 */
  prizes: Prize[];
  sales: number;
}

export interface DrawData {
  updatedAt: string;
  draws: Draw[];
}
