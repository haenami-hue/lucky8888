import { useEffect, useState } from "react";
import { InstallBanner } from "../components/InstallBanner";
import { useDraws } from "../data/useDraws";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { HistoryPage } from "../features/history/HistoryPage";
import { RecommendPage } from "../features/recommend/RecommendPage";

const TABS = [
  { key: "recommend", label: "번호 추천", ico: "🔮" },
  { key: "stats", label: "통계", ico: "📊" },
  { key: "history", label: "회차", ico: "📜" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const THEME_KEY = "lucky-lotto.theme";

// 탭을 URL hash 에 두어 Android 뒤로가기 버튼이 이전 탭으로 돌아가게 한다.
function useHashTab(): [Tab, (t: Tab) => void] {
  const read = (): Tab => {
    const h = location.hash.slice(1);
    return TABS.some((t) => t.key === h) ? (h as Tab) : "recommend";
  };
  const [tab, setTab] = useState<Tab>(read);
  useEffect(() => {
    const onHash = () => setTab(read());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return [tab, (t) => (location.hash = t)];
}

function useTheme(): [boolean, () => void] {
  const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [theme, setTheme] = useState<string | null>(() => {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  });
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }, [theme]);
  const dark = theme ? theme === "dark" : systemDark();
  const toggle = () => {
    const next = dark ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* 저장 불가 환경 */
    }
  };
  return [dark, toggle];
}

export function App() {
  const state = useDraws();
  const [tab, setTab] = useHashTab();
  const [dark, toggleTheme] = useTheme();
  // 로고를 누를 때마다 바꿔 추천 화면을 처음 질문부터 새로 그린다
  const [homeKey, setHomeKey] = useState(0);
  const goHome = () => {
    setHomeKey((k) => k + 1);
    setTab("recommend");
    window.scrollTo(0, 0);
  };

  // 블록으로 감싼다: 최신 크롬의 scrollTo 는 Promise 를 반환해 cleanup 으로 오인된다
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  return (
    <>
      <div className="bg-blobs" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="app">
        <header className="app-header">
          <button className="brand-btn" onClick={goHome} aria-label="첫 화면으로">
            <h1 className="brand">행운로또 🍀</h1>
            <div className="brand-sub">
              {state.status === "ready" ? `${state.data.draws.at(-1)!.no}회까지 반영` : "로또 6/45 통계 · 사주 추천"}
            </div>
          </button>
          <button className="theme-btn" onClick={toggleTheme} aria-label={dark ? "밝은 화면" : "어두운 화면"}>
            {dark ? "☀️" : "🌙"}
          </button>
        </header>

        <main>
          <InstallBanner />
          {state.status === "loading" && <div className="center">🎱 당첨 데이터를 불러오는 중…</div>}
          {state.status === "error" && (
            <div className="center">
              데이터를 불러오지 못했어요 ({state.message})
              <br />
              인터넷 연결을 확인해 주세요.
            </div>
          )}
          {state.status === "ready" && (
            <>
              {tab === "recommend" && <RecommendPage key={homeKey} draws={state.data.draws} />}
              {tab === "stats" && <DashboardPage draws={state.data.draws} />}
              {tab === "history" && <HistoryPage draws={state.data.draws} />}
            </>
          )}
          <p className="disclaimer">
            로또는 매 회차 독립적인 무작위 추첨입니다. 통계와 사주 풀이는 재미를 위한 것이며 당첨 확률을 높여 주지 않아요.
            <br />
            복권은 만 19세 이상만 살 수 있어요. 적당히 즐겨 주세요 🍀
            <br />
            도박 문제 상담 <a href="tel:1336">☎ 1336</a> (한국도박문제예방치유원, 24시간)
          </p>
        </main>
      </div>

      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button key={t.key} aria-current={tab === t.key ? "page" : undefined} onClick={() => setTab(t.key)}>
            <span className="ico">{t.ico}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </>
  );
}
