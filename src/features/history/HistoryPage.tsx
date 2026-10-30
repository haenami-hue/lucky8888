import { useMemo, useState } from "react";
import { Balls } from "../../components/Ball";
import type { Draw } from "../../data/types";

const PAGE = 30;

export function HistoryPage({ draws }: { draws: Draw[] }) {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  const list = useMemo(() => {
    const desc = [...draws].reverse();
    const q = query.trim();
    if (!q) return desc;
    const n = Number(q);
    // 회차 번호로 찾거나, 1~45 사이면 그 번호가 나온 회차를 찾는다
    return desc.filter((d) => d.no === n || (n >= 1 && n <= 45 && (d.nums.includes(n) || d.bonus === n)));
  }, [draws, query]);

  return (
    <div className="stack">
      <div className="card">
        <label className="field">
          회차 또는 번호로 찾기
          <input
            inputMode="numeric"
            placeholder="예: 1200 (회차) 또는 7 (번호)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value.replace(/\D/g, ""));
              setShown(PAGE);
            }}
          />
        </label>
      </div>

      <section className="card">
        <h2>📜 회차별 당첨번호</h2>
        <p className="sub">{query ? `${list.length}개 회차` : `총 ${draws.length}회차`}</p>
        {list.slice(0, shown).map((d) => (
          <div className="draw-row" key={d.no}>
            <div className="head">
              <strong>{d.no}회</strong>
              <span>{d.date.replaceAll("-", ".")}</span>
            </div>
            <Balls nums={d.nums} bonus={d.bonus} />
            <div className="prize">
              {d.prizes[0].count ? `1등 ${d.prizes[0].count}명 · ${d.prizes[0].amount.toLocaleString()}원` : "1등 당첨자 없음 (이월)"}
            </div>
          </div>
        ))}
        {shown < list.length && (
          <button className="btn ghost block" onClick={() => setShown((s) => s + PAGE)}>
            더 보기
          </button>
        )}
      </section>
    </div>
  );
}
