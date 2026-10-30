// 세로 막대 차트. 탭/호버로 툴팁, 최댓값에만 직접 라벨.
import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";

export interface Column {
  label: string;
  value: number;
  color: string;
  tip: string;
}

interface Props {
  data: Column[];
  height?: number;
  /** x축 라벨을 몇 개마다 하나씩 표시할지 */
  labelEvery?: number;
  ariaLabel: string;
}

function niceStep(max: number, ticks = 4): number {
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const norm = raw / mag;
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
}

const compact = (v: number) => (v >= 1000 ? `${+(v / 1000).toFixed(1)}K` : String(v));

export function ColumnChart({ data, height = 170, labelEvery = 1, ariaLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [active, setActive] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const padL = 30;
  const padT = 18;
  const padB = 20;
  const plotW = Math.max(width - padL, 10);
  const plotH = height - padT - padB;
  const max = Math.max(...data.map((d) => d.value), 1);
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const band = plotW / data.length;
  const barW = Math.max(Math.min(24, band - 2), 2);
  const r = Math.min(4, barW / 2);
  const y = (v: number) => padT + plotH - (v / top) * plotH;
  const maxIndex = data.findIndex((d) => d.value === max);

  const pick = (e: PointerEvent<SVGSVGElement>) => {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left - padL;
    const i = Math.floor(x / band);
    setActive(i >= 0 && i < data.length ? i : null);
  };

  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);

  return (
    <div ref={ref} className={`chart${active !== null ? " has-active" : ""}`}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        onPointerDown={pick}
        onPointerMove={pick}
        onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
      >
        <g className="grid">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={width} y1={y(t)} y2={y(t)} />
              <text x={padL - 6} y={y(t)} dy="0.32em" textAnchor="end">
                {compact(t)}
              </text>
            </g>
          ))}
        </g>
        {data.map((d, i) => {
          const x = padL + i * band + (band - barW) / 2;
          const h = Math.max(y(0) - y(d.value), 0);
          const yt = y(d.value);
          const rr = Math.min(r, h);
          const path = `M${x},${y(0)} V${yt + rr} Q${x},${yt} ${x + rr},${yt} H${x + barW - rr} Q${x + barW},${yt} ${x + barW},${yt + rr} V${y(0)} Z`;
          return (
            <g key={d.label}>
              <path className={`bar${active === i ? " active" : ""}`} d={path} fill={d.color} />
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={height - 6} textAnchor="middle">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
        <line className="baseline" x1={padL} x2={width} y1={y(0)} y2={y(0)} />
        {active === null && maxIndex >= 0 && (
          <text className="direct-label" x={padL + maxIndex * band + band / 2} y={y(max) - 6} textAnchor="middle">
            {compact(max)}
          </text>
        )}
      </svg>
      {active !== null && (
        <div
          className="tooltip"
          style={{ left: Math.min(Math.max(padL + active * band + band / 2, 56), width - 56), top: y(data[active].value) }}
        >
          {data[active].tip}
        </div>
      )}
    </div>
  );
}
