import { useEffect, useState } from "react";
import { fetchDrawsAfter } from "./dhlottery";
import type { Draw, DrawData } from "./types";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: DrawData };

// 번들된 draws.json 이후에 앱이 직접 받아온 회차. 다음 실행 때 바로 보여주려고 저장한다.
const CACHE_KEY = "lucky-lotto.extra-draws";

function readCache(): Draw[] {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeCache(draws: Draw[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(draws));
  } catch {
    /* 저장 불가 환경 */
  }
}

/** 회차 번호가 1부터 빠짐없이 이어지도록 base 뒤에 extra 를 붙인다. */
function merge(base: Draw[], extra: Draw[]): Draw[] {
  const out = [...base];
  for (const d of [...extra].sort((a, b) => a.no - b.no)) {
    if (d.no === (out.at(-1)?.no ?? 0) + 1) out.push(d);
  }
  return out;
}

export function useDraws(): State {
  const [state, setState] = useState<State>({ status: "loading" });
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      const r = await fetch(`${import.meta.env.BASE_URL}data/draws.json`, { signal: ctrl.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const bundled = (await r.json()) as DrawData;
      // 번들 데이터 + 이전에 받아둔 회차를 먼저 보여주고, 그 사이 새 회차를 확인한다
      let draws = merge(bundled.draws, readCache());
      setState({ status: "ready", data: { ...bundled, draws } });

      const fresh = await fetchDrawsAfter(draws.at(-1)!.no, ctrl.signal).catch(() => []);
      if (fresh.length === 0) return;
      draws = merge(draws, fresh);
      writeCache(draws.slice(bundled.draws.length));
      setState({ status: "ready", data: { updatedAt: new Date().toISOString(), draws } });
    })().catch((e: Error) => {
      if (!ctrl.signal.aborted) setState({ status: "error", message: e.message });
    });
    return () => ctrl.abort();
  }, []);
  return state;
}
