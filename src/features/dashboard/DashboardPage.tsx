import { useMemo, useState } from "react";
import { Ball, Balls } from "../../components/Ball";
import { ColumnChart } from "../../components/charts/ColumnChart";
import type { Draw } from "../../data/types";
import { BALL_RANGES, ballVar } from "../../lib/lotto/ballColor";
import { NUMBERS, frequency, gaps, oddCountDistribution, sumDistribution } from "../../lib/lotto/stats";

const WINDOWS = [
  { key: "all", label: "전체", size: Infinity },
  { key: "100", label: "최근 100회", size: 100 },
  { key: "30", label: "최근 30회", size: 30 },
] as const;

const won = (v: number) =>
  v >= 1e8 ? `${(v / 1e8).toFixed(1).replace(/\.0$/, "")}억 원` : `${Math.round(v / 1e4).toLocaleString()}만 원`;

function LatestDraw({ draw }: { draw: Draw }) {
  const first = draw.prizes[0];
  return (
    <div className="hero">
      <div className="eyebrow">{draw.date.replaceAll("-", ".")} 추첨</div>
      <div className="title">{draw.no}회 당첨번호 🎉</div>
      <Balls nums={draw.nums} bonus={draw.bonus} animate />
      <div className="meta">{first.count ? `1등 ${first.count}명 · 1인당 ${won(first.amount)}` : "1등 당첨자 없음 · 당첨금 이월"}</div>
    </div>
  );
}

export function DashboardPage({ draws }: { draws: Draw[] }) {
  const [win, setWin] = useState<(typeof WINDOWS)[number]["key"]>("100");

  const stats = useMemo(() => {
    const allFreq = frequency(draws);
    const gap = gaps(draws);
    const hot = frequency(draws.slice(-50));
    const top = (arr: number[]) => NUMBERS.reduce((best, n) => (arr[n] > arr[best] ? n : best), 1);
    return {
      allFreq,
      gap,
      mostAll: top(allFreq),
      hot50: top(hot),
      hot50Count: hot[top(hot)],
      longestGap: top(gap),
      gapTop: [...NUMBERS].sort((a, b) => gap[b] - gap[a]).slice(0, 8),
      odd: oddCountDistribution(draws),
      sums: sumDistribution(draws),
    };
  }, [draws]);

  const windowDraws = useMemo(() => {
    const size = WINDOWS.find((w) => w.key === win)!.size;
    return Number.isFinite(size) ? draws.slice(-size) : draws;
  }, [draws, win]);
  const freq = useMemo(() => frequency(windowDraws), [windowDraws]);

  const latest = draws[draws.length - 1];
  const maxGap = stats.gap[stats.gapTop[0]];

  return (
    <div className="stack">
      <LatestDraw draw={latest} />

      <div className="tiles">
        <div className="card tile">
          <div className="label">역대 최다 출현</div>
          <div className="value">
            <Ball n={stats.mostAll} size={32} />
            {stats.allFreq[stats.mostAll]}
            <small>회</small>
          </div>
        </div>
        <div className="card tile">
          <div className="label">최근 50회 핫넘버</div>
          <div className="value">
            <Ball n={stats.hot50} size={32} />
            {stats.hot50Count}
            <small>회</small>
          </div>
        </div>
        <div className="card tile">
          <div className="label">가장 오래 쉰 번호</div>
          <div className="value">
            <Ball n={stats.longestGap} size={32} />
            {stats.gap[stats.longestGap]}
            <small>회째</small>
          </div>
        </div>
        <div className="card tile">
          <div className="label">누적 추첨 (2002년~)</div>
          <div className="value">
            {latest.no.toLocaleString()}
            <small>회</small>
          </div>
        </div>
      </div>

      <section className="card">
        <h2>📊 번호별 출현 횟수</h2>
        <p className="sub">막대를 누르면 자세히 볼 수 있어요 (보너스 번호 제외)</p>
        <div className="chips" role="group" aria-label="기간">
          {WINDOWS.map((w) => (
            <button key={w.key} className="chip" aria-pressed={win === w.key} onClick={() => setWin(w.key)}>
              {w.label}
            </button>
          ))}
        </div>
        <ColumnChart
          ariaLabel="번호별 출현 횟수"
          labelEvery={5}
          data={NUMBERS.map((n) => ({
            label: String(n),
            value: freq[n],
            color: ballVar(n),
            tip: `${n}번 · ${freq[n]}회 (${((freq[n] / windowDraws.length) * 100).toFixed(1)}%)`,
          }))}
        />
        <div className="legend">
          {BALL_RANGES.map((r) => (
            <span key={r.key}>
              <i style={{ background: `var(--ball-${r.key})` }} />
              {r.label}
            </span>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>🌙 오래 쉬고 있는 번호</h2>
        <p className="sub">마지막으로 나온 뒤 지난 회차 수</p>
        <div className="hbars">
          {stats.gapTop.map((n) => (
            <div className="hbar" key={n}>
              <Ball n={n} size={30} />
              <div className="track">
                <div className="fill" style={{ width: `${(stats.gap[n] / maxGap) * 100}%` }} />
              </div>
              <span className="num">{stats.gap[n]}회</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>☯️ 홀수 개수 분포</h2>
        <p className="sub">당첨번호 6개 중 홀수(양)가 몇 개였나 · 역대 {draws.length}회</p>
        <ColumnChart
          ariaLabel="홀수 개수별 회차 수"
          height={150}
          data={stats.odd.map((c, k) => ({
            label: `${k}개`,
            value: c,
            color: "var(--series-violet)",
            tip: `홀수 ${k}개 · ${c}회 (${((c / draws.length) * 100).toFixed(1)}%)`,
          }))}
        />
      </section>

      <section className="card">
        <h2>➕ 번호 합계 분포</h2>
        <p className="sub">당첨번호 6개를 더한 값 · 20 단위 구간</p>
        <ColumnChart
          ariaLabel="당첨번호 합계 구간별 회차 수"
          height={150}
          data={stats.sums.map((b) => ({
            label: String(b.from),
            value: b.count,
            color: "var(--series-pink)",
            tip: `합계 ${b.from}~${b.from + 19} · ${b.count}회`,
          }))}
        />
      </section>
    </div>
  );
}
