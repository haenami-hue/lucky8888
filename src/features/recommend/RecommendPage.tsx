import { useMemo, useState } from "react";
import { Ball, Balls } from "../../components/Ball";
import type { Draw } from "../../data/types";
import { ELEMENT_INFO, elementLabel } from "../../lib/saju/ohaeng";
import { nextDrawDate, recommend, type Recommendation, type YMD } from "./engine";
import { FIGURE_GROUPS, FIGURES } from "./figures";
import { MOOD_QUESTION, YINYANG_QUESTION, type Mood, type Question, type Yinyang } from "./questions";

type Step = "mood" | "yinyang" | "birth" | "result";
const STEPS: Step[] = ["mood", "yinyang", "birth"];
const BIRTH_KEY = "lucky-lotto.birth";

function loadBirth(): string {
  try {
    return localStorage.getItem(BIRTH_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveBirth(value: string) {
  try {
    if (value) localStorage.setItem(BIRTH_KEY, value);
    else localStorage.removeItem(BIRTH_KEY);
  } catch {
    /* 저장 불가 환경이면 무시 */
  }
}

function parseBirth(value: string): YMD | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return undefined;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  // 2월 30일 같은 없는 날짜와 범위 밖 연도는 거른다
  const t = new Date(Date.UTC(y, mo - 1, d));
  if (y < 1900 || y > new Date().getFullYear() || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return undefined;
  return { y, m: mo, d };
}

/** 숫자만 받아 YYYY-MM-DD 로 하이픈을 자동으로 넣는다 (브라우저 날짜 칸은 지역마다 mm/dd/yyyy 로 보여서 쓰지 않음) */
function formatBirthInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join("-");
}

function BirthInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const invalid = value.length === 10 && !parseBirth(value);
  return (
    <label className="field">
      {label}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="YYYY-MM-DD (예: 1985-03-14)"
        maxLength={10}
        value={value}
        aria-invalid={invalid}
        onChange={(e) => onChange(formatBirthInput(e.target.value))}
      />
      {invalid && <span className="field-error">없는 날짜예요. 다시 확인해 주세요.</span>}
    </label>
  );
}

/** 문장 속 대상 이름을 굵게+밑줄로 강조 */
function highlight(text: string, word?: string) {
  if (!word) return text;
  return text.split(word).flatMap((part, i) => (i === 0 ? [part] : [<strong key={i} className="subject-name">{word}</strong>, part]));
}

function QuestionStep<T extends string>({ q, value, onPick }: { q: Question<T>; value?: T; onPick: (v: T) => void }) {
  return (
    <>
      <h2 className="q-title">{q.title}</h2>
      <p className="q-hint">{q.hint}</p>
      <div className="options">
        {q.options.map((o) => (
          <button key={o.value} className="option" aria-pressed={value === o.value} onClick={() => onPick(o.value)}>
            <span className="emoji">{o.emoji}</span>
            <span>
              <strong>{o.label}</strong>
              <span className="desc">{o.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

const GAME_TAGS = ["A", "B", "C", "D", "E"];

const IS_MOBILE = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** 문자·메신저로 보낼 결과 요약. 받는 사람이 앱 없이 읽어도 이해되게 쓴다 */
function shareText(rec: Recommendation): string {
  const { y, m, d } = rec.drawDate;
  // lines[1] = 일간 풀이, lines[2] = 추첨일과의 관계 (생년월일이 있을 때만)
  const fortune = rec.me ? rec.fortune.lines.slice(1, 3) : [];
  return [
    `🍀 행운로또 ${rec.drawNo}회 (${y}.${m}.${d} 추첨)`,
    rec.subject ? `🔮 ${rec.subject}의 사주로 뽑은 행운번호예요!` : "🔮 사주로 뽑은 행운번호예요!",
    ...(fortune.length ? ["", ...fortune] : []),
    "",
    ...rec.games.map((g, i) => `${GAME_TAGS[i]}  ${g.nums.map((n) => String(n).padStart(2, "0")).join(" ")}`),
    "",
    `행운의 기운: ${rec.luckyElements.map((e) => elementLabel(e)).join(" · ")}`,
    `👉 나도 뽑아보기 ${location.origin}${location.pathname}`,
    "※ 재미로 보는 번호예요. 당첨을 보장하지 않아요.",
  ].join("\n");
}

/** 클립보드 복사. navigator.clipboard 는 HTTPS 에서만 되므로 http 테스트 주소용 예전 방식도 시도 */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    // iOS 는 readonly 칸을 select() 로 선택하지 못해 contentEditable + setSelectionRange 를 쓴다
    ta.contentEditable = "true";
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.opacity = "0";
    ta.style.fontSize = "16px"; // iOS 확대 방지
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

function Result({ rec, onReroll, onRestart }: { rec: Recommendation; onReroll: () => void; onRestart: () => void }) {
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const text = shareText(rec);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2500);
  };
  const copy = async () => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
    flash(ok ? "✅ 복사됐어요. 카톡이나 문자에 붙여 넣으세요." : "복사하지 못했어요. 위 내용을 길게 눌러 복사해 주세요.");
  };
  const share = async () => {
    if (!navigator.share) {
      // http 주소이거나 공유를 지원하지 않는 브라우저
      flash((await copyText(text)) ? "공유 창을 열 수 없어 대신 복사했어요. 카톡에 붙여 넣으세요." : "공유 창을 열 수 없어요. 위 내용을 길게 눌러 복사해 주세요.");
      return;
    }
    try {
      await navigator.share({ text });
    } catch (e) {
      if ((e as Error).name !== "AbortError") await copy();
    }
  };
  // "sms:?&body=" 는 iOS·안드로이드 모두에서 받는 사람 칸을 비운 채 본문만 채운다
  const sendSms = () => {
    location.href = `sms:?&body=${encodeURIComponent(text)}`;
  };

  return (
    <div className="stack">
      <div className="hero violet">
        <div className="eyebrow">
          {rec.drawDate.y}.{rec.drawDate.m}.{rec.drawDate.d}(토) 추첨
        </div>
        <div className="title">{rec.drawNo}회 행운번호 🔮</div>
        <Balls nums={rec.games[0].nums} animate />
        <div className="meta">
          행운의 기운{" "}
          {rec.luckyElements.map((e) => `${ELEMENT_INFO[e].emoji} ${elementLabel(e)}`).join(" · ")}
        </div>
      </div>

      <section className="card fortune">
        <h2>✨ {rec.fortune.title}</h2>
        <p className="sub">
          추첨일 일진 {rec.drawPillar.stem.hanja}
          {rec.drawPillar.branch.hanja}
          {rec.me && (
            <>
              {" · "}
              {rec.subject ? <strong className="subject-name">{rec.subject}</strong> : "나"}의 일주 {rec.me.day.stem.hanja}
              {rec.me.day.branch.hanja}
            </>
          )}
        </p>
        {rec.fortune.lines.map((l) => (
          <p key={l}>{highlight(l, rec.subject)}</p>
        ))}
      </section>

      <section className="card">
        <h2>🎟️ 추천 5게임</h2>
        <p className="sub">번호를 왜 골랐는지 "풀이 보기"를 눌러 확인하세요</p>
        {rec.games.map((g, i) => (
          <div className="game" key={g.nums.join()}>
            <span className="tag">{GAME_TAGS[i]}</span>
            <Balls nums={g.nums} animate />
            <div className="game-summary">
              {g.summary.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
            <details>
              <summary>풀이 보기</summary>
              {g.nums.map((n) => (
                <div className="note-row" key={n}>
                  <Ball n={n} />
                  <ul>
                    {rec.notes[n].map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </details>
          </div>
        ))}
      </section>

      <section className="card stack">
        <h2>{rec.subject ? <>💌 <span className="subject-name">{rec.subject}</span>에게 결과 보내기</> : "💌 결과 보내기"}</h2>
        <pre className="share-preview">{text}</pre>
        {IS_MOBILE && (
          <button className="btn block" onClick={sendSms}>
            💬 문자로 보내기
          </button>
        )}
        <div className="btn-row">
          <button className="btn ghost" onClick={share}>
            📤 공유하기
          </button>
          <button className="btn ghost" onClick={copy}>
            {copied ? "✅ 복사됨" : "📋 복사하기"}
          </button>
        </div>
      </section>
      {/* .card 의 backdrop-filter 안에 두면 fixed 기준이 카드가 되므로 카드 밖에 둔다 */}
      {notice && (
        <p className="toast" role="status">
          {notice}
        </p>
      )}

      <button className="btn block" onClick={onReroll}>
        🎲 다시 뽑기
      </button>
      <button className="btn ghost block" onClick={onRestart}>
        ↩️ 질문부터 다시
      </button>
    </div>
  );
}

export function RecommendPage({ draws }: { draws: Draw[] }) {
  const [step, setStep] = useState<Step>("mood");
  const [mood, setMood] = useState<Mood>();
  const [yinyang, setYinyang] = useState<Yinyang>();
  const [birth, setBirth] = useState(loadBirth);
  // 이번에 사주를 볼 대상. subject 가 없으면 나 자신
  const [target, setTarget] = useState<{ birth: string; subject?: string }>({ birth: "" });
  const [seed, setSeed] = useState(0);

  const rec = useMemo(() => {
    if (step !== "result" || !mood || !yinyang) return null;
    return recommend({
      draws,
      mood,
      yinyang,
      birth: parseBirth(target.birth),
      subject: target.subject,
      drawDate: nextDrawDate(new Date(), draws.at(-1)?.date),
    });
    // seed 는 "다시 뽑기" 때 새로 계산하기 위한 의존성
  }, [step, mood, yinyang, target, draws, seed]);

  const finish = (value: string, subject?: string) => {
    // 다른 사람·위인의 생일은 내 생일 저장값을 덮어쓰지 않는다
    if (!subject) {
      setBirth(value);
      saveBirth(value);
    }
    setTarget({ birth: value, subject });
    setStep("result");
  };

  if (step === "result" && rec) {
    return (
      <Result
        rec={rec}
        onReroll={() => setSeed((s) => s + 1)}
        onRestart={() => {
          setMood(undefined);
          setYinyang(undefined);
          setStep("mood");
        }}
      />
    );
  }

  return (
    <div className="stack">
      <div className="progress" aria-label={`${STEPS.indexOf(step) + 1} / ${STEPS.length} 단계`}>
        {STEPS.map((s, i) => (
          <span key={s} className={i <= STEPS.indexOf(step) ? "on" : ""} />
        ))}
      </div>

      {step === "mood" && (
        <QuestionStep
          q={MOOD_QUESTION}
          value={mood}
          onPick={(v) => {
            setMood(v);
            setStep("yinyang");
          }}
        />
      )}

      {step === "yinyang" && (
        <>
          <QuestionStep
            q={YINYANG_QUESTION}
            value={yinyang}
            onPick={(v) => {
              setYinyang(v);
              setStep("birth");
            }}
          />
          <button className="btn ghost block" onClick={() => setStep("mood")}>
            ← 이전 질문
          </button>
        </>
      )}

      {step === "birth" && (
        <BirthStep initial={birth} onDone={finish} onBack={() => setStep("yinyang")} />
      )}
    </div>
  );
}

type BirthMode = "me" | "other" | "figure";
const BIRTH_MODES: { value: BirthMode; label: string }[] = [
  { value: "me", label: "🙋 나" },
  { value: "other", label: "💝 다른 사람" },
  { value: "figure", label: "🏛️ 부자·위인" },
];

function BirthStep({
  initial,
  onDone,
  onBack,
}: {
  initial: string;
  onDone: (v: string, subject?: string) => void;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<BirthMode>("me");
  const [value, setValue] = useState(initial);
  const [other, setOther] = useState("");
  const [otherName, setOtherName] = useState("");

  return (
    <>
      <h2 className="q-title">누구의 사주로 뽑을까요?</h2>
      <p className="q-hint">생년월일(양력)로 일간(日干)을 계산해요. 이 기기에만 저장되고 어디에도 보내지 않아요.</p>
      <div className="chips seg">
        {BIRTH_MODES.map((m) => (
          <button key={m.value} className="chip" aria-pressed={mode === m.value} onClick={() => setMode(m.value)}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === "me" && (
        <div className="card stack">
          <BirthInput label="내 생년월일" value={value} onChange={setValue} />
          <button className="btn block" disabled={!parseBirth(value)} onClick={() => onDone(value)} style={{ opacity: parseBirth(value) ? 1 : 0.5 }}>
            🔮 내 사주로 번호 뽑기
          </button>
          <button className="btn ghost block" onClick={() => onDone("")}>
            건너뛰고 바로 뽑기
          </button>
        </div>
      )}

      {mode === "other" && (
        <div className="card stack">
          <p className="sub">가족, 친구, 좋아하는 스타… 생일만 알면 그 사람의 기운으로 뽑아 드려요.</p>
          <label className="field">
            이름 또는 별명 (선택)
            <input type="text" value={otherName} maxLength={12} placeholder="예: 우리 엄마, 최애" onChange={(e) => setOtherName(e.target.value)} />
          </label>
          <BirthInput label="생년월일" value={other} onChange={setOther} />
          <button
            className="btn block"
            disabled={!parseBirth(other)}
            onClick={() => onDone(other, otherName.trim() || "그 사람")}
            style={{ opacity: parseBirth(other) ? 1 : 0.5 }}
          >
            🔮 이 사주로 번호 뽑기
          </button>
        </div>
      )}

      {mode === "figure" && (
        <>
          <p className="q-hint">부자와 위인의 기운을 빌려 볼까요?</p>
          {FIGURE_GROUPS.map((g) => (
            <section key={g.value} className="stack">
              <h3 className="figure-group">{g.label}</h3>
              <div className="options">
                {FIGURES.filter((f) => f.group === g.value).map((f) => (
                  <button key={f.name} className="option compact" onClick={() => onDone(f.birth, f.name)}>
                    <span className="emoji">{f.emoji}</span>
                    <span>
                      <strong>{f.name}</strong>
                      <span className="desc">
                        {f.desc} · {f.birth.replaceAll("-", ".")}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      <button className="btn ghost block" onClick={onBack}>
        ← 이전 질문
      </button>
    </>
  );
}
