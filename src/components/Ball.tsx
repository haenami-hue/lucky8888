import type { CSSProperties } from "react";
import { ballVar } from "../lib/lotto/ballColor";

interface Props {
  n: number;
  size?: number;
  /** 등장 애니메이션 지연 (ms). 주면 pop 애니메이션 적용 */
  delay?: number;
}

export function Ball({ n, size, delay }: Props) {
  const style = {
    "--ball-color": ballVar(n),
    ...(size ? { "--size": `${size}px` } : {}),
    ...(delay !== undefined ? { animationDelay: `${delay}ms` } : {}),
  } as CSSProperties;
  return (
    <span className={delay !== undefined ? "ball pop" : "ball"} style={style} aria-label={`${n}번`}>
      {n}
    </span>
  );
}

export function Balls({ nums, bonus, size, animate }: { nums: number[]; bonus?: number; size?: number; animate?: boolean }) {
  return (
    <div className="balls">
      {nums.map((n, i) => (
        <Ball key={n} n={n} size={size} delay={animate ? i * 90 : undefined} />
      ))}
      {bonus !== undefined && (
        <>
          <span className="plus" aria-label="보너스">+</span>
          <Ball n={bonus} size={size} delay={animate ? nums.length * 90 : undefined} />
        </>
      )}
    </div>
  );
}
