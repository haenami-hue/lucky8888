import { useEffect, useState } from "react";

// 홈 화면 설치 안내. Android 크롬은 설치 창을 바로 띄우고, iOS 사파리는 방법을 알려 준다.
// 이미 설치해 앱으로 열었거나 한 번 닫은 사람에게는 보이지 않는다.
const DISMISS_KEY = "lucky-lotto.install-dismissed";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
// 카카오톡 등 앱 안 브라우저는 설치를 지원하지 않으므로 iOS 안내도 사파리일 때만
const isIosSafari = () => /iPhone|iPad|iPod/.test(navigator.userAgent) && !/CriOS|FxiOS|KAKAOTALK|NAVER|Instagram/i.test(navigator.userAgent);

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function InstallBanner() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(() => isStandalone() || wasDismissed());

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || (!prompt && !isIosSafari())) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* 저장 불가 환경 */
    }
  };
  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    if ((await prompt.userChoice).outcome === "accepted") setHidden(true);
    setPrompt(null);
  };

  return (
    <div className="card install-banner" role="region" aria-label="앱 설치 안내">
      <span className="ico" aria-hidden>
        📲
      </span>
      <div>
        <strong>홈 화면에 앱 추가</strong>
        <span>
          {prompt ? "매주 당첨번호를 한 번에 확인해요." : "공유 버튼(⬆️) → \"홈 화면에 추가\""}
        </span>
      </div>
      {prompt && (
        <button className="btn" onClick={install}>
          설치
        </button>
      )}
      <button className="close" onClick={dismiss} aria-label="설치 안내 닫기">
        ✕
      </button>
    </div>
  );
}
