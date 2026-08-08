"use client";

import { CSSProperties, useCallback, useMemo, useRef, useState } from "react";
import {
  Answers,
  City,
  DEBT_DEFS,
  DebtKey,
  QUESTIONS,
  TOGGLE_DEFS,
  ToggleKey,
  ageNum,
  cityFromKey,
  cityFromPin,
  defaultAnswers,
  digitsOnly,
  fmt,
  grouped,
  model as buildModel,
  partialTotal,
  priced,
} from "@/lib/cost-model";
import { encodeAnswers } from "@/lib/token";
import { useAnimatedValue } from "./useAnimatedValue";
import { Shell } from "./Shell";
import { Result } from "./Result";

const REVEAL_MS = 2600;

const mono: CSSProperties = { fontFamily: "var(--font-mono), monospace" };
const disp: CSSProperties = { fontFamily: "var(--font-display), sans-serif" };
const INK = "#17130D";
const LINE = "#EADFCC";
const PAPER = "#FFFFFF";
const ACCENT = "#E14B33";

type Step = "landing" | "quiz" | "calc" | "result";

const CITY_CHIPS: [string, string][] = [
  ["Mumbai", "400001"],
  ["Delhi", "110001"],
  ["Bengaluru", "560001"],
  ["Hyderabad", "500001"],
  ["Pune", "411001"],
  ["Chennai", "600001"],
];

export interface KitnaChahiyeProps {
  initialAnswers?: Answers;
  initialCity?: City;
  startAtResult?: boolean;
}

export function KitnaChahiye({ initialAnswers, initialCity, startAtResult }: KitnaChahiyeProps) {
  const [step, setStep] = useState<Step>(startAtResult ? "result" : "landing");
  const [qi, setQi] = useState(0);
  const [seen, setSeen] = useState(startAtResult ? 8 : 0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? defaultAnswers());
  // The raw pincode lives only in component state — it never leaves the device
  // and is never written to the URL. A shared link resolves its city from the
  // key; a fresh quiz starts empty so nothing is pre-filled.
  const [pin, setPin] = useState<string>("");
  const [calcStep, setCalcStep] = useState(0);
  const revealBigRef = useRef(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // City comes from the live pincode during the quiz, or from the link's stored
  // key when arriving at a shared result.
  const city: City = useMemo(() => {
    if (startAtResult && initialCity) return initialCity;
    return cityFromPin(pin);
  }, [pin, startAtResult, initialCity]);

  const m = useMemo(() => buildModel(answers, city), [answers, city]);
  const target = useMemo(() => partialTotal(m, seen), [m, seen]);
  const meter = useAnimatedValue(target, 520, 0);

  // Keep the stored city key in sync with the resolved city so the token carries
  // the city, not the pincode.
  const answersForShare: Answers = useMemo(() => {
    const key = city.known ? pin.slice(0, 2) : "";
    return { ...answers, cityKey: key };
  }, [answers, city, pin]);

  const writeShareUrl = useCallback(() => {
    try {
      const token = encodeAnswers(answersForShare);
      window.history.replaceState(null, "", "/r/" + token);
    } catch {
      /* sandboxed history */
    }
  }, [answersForShare]);

  // --- Navigation ---------------------------------------------------------
  const go = useCallback((next: number) => {
    setStep("quiz");
    setQi(next);
    setSeen((s) => Math.max(s, next));
  }, []);

  const start = () => go(0);

  const back = () => {
    if (qi === 0) setStep("landing");
    else go(qi - 1);
  };

  const showResult = useCallback(() => {
    revealBigRef.current = true;
    setStep("result");
    writeShareUrl();
  }, [writeShareUrl]);

  const runCalc = () => {
    clearTimers();
    setStep("calc");
    setCalcStep(0);
    timers.current.push(setTimeout(() => setCalcStep(1), REVEAL_MS * 0.3));
    timers.current.push(setTimeout(() => setCalcStep(2), REVEAL_MS * 0.62));
    timers.current.push(setTimeout(() => showResult(), REVEAL_MS));
  };

  const next = () => (qi === 8 ? runCalc() : go(qi + 1));

  const restart = () => {
    clearTimers();
    revealBigRef.current = false;
    setStep("landing");
    setQi(0);
    setSeen(0);
    try {
      window.history.replaceState(null, "", "/");
    } catch {
      /* sandboxed */
    }
  };

  // --- Answer mutations ---------------------------------------------------
  const setOption = (key: string, i: number) => setAnswers((a) => ({ ...a, [key]: i }));

  const flip = (k: ToggleKey) => setAnswers((a) => ({ ...a, t: { ...a.t, [k]: !a.t[k] } }));

  const setDebt = (k: DebtKey, fields: Partial<Answers["d"][DebtKey]>) =>
    setAnswers((a) => ({ ...a, d: { ...a.d, [k]: { ...a.d[k], ...fields } } }));

  const clearDebt = () =>
    setAnswers((a) => ({
      ...a,
      d: {
        edu: { on: false, emi: "", yrs: "" },
        vehicle: { on: false, emi: "", yrs: "" },
        card: { on: false, emi: "", yrs: "" },
        other: { on: false, emi: "", yrs: "" },
      },
    }));

  // --- Render -------------------------------------------------------------
  if (step === "result") {
    return (
      <Shell>
        <Result answers={startAtResult ? answers : answersForShare} city={city} revealBig={revealBigRef.current} onRestart={restart} />
      </Shell>
    );
  }

  if (step === "calc") {
    return (
      <Shell>
        <Calculating pin={pin} state={city.state} calcStep={calcStep} />
      </Shell>
    );
  }

  if (step === "landing") {
    return (
      <Shell>
        <Landing onStart={start} />
      </Shell>
    );
  }

  const q = QUESTIONS[qi];

  return (
    <Shell>
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        {/* Sticky header: progress dots + running meter */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 5,
            background: "var(--cream)",
            borderBottom: "1px solid #EADFCC",
            padding: "14px 20px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                style={{
                  height: 6,
                  borderRadius: 999,
                  transition: "all .25s ease-out",
                  width: i === qi ? 20 : 6,
                  background: i === qi ? INK : i < seen ? "#B9AE9B" : LINE,
                }}
              />
            ))}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "#B9AE9B", marginBottom: 1 }}>
              So far
            </div>
            <div
              className="tnum"
              style={{ ...disp, fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1, color: meter > 0 ? INK : "#DFD3BC" }}
            >
              {fmt(meter)}
            </div>
          </div>
        </header>

        {/* Body */}
        <div style={{ flex: 1, padding: "28px 20px 24px" }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#B9AE9B", marginBottom: 10 }}>
            {q.eyebrow}
          </div>
          <h2 style={{ ...disp, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05, fontSize: 30, color: INK, margin: "0 0 6px" }}>
            {q.title}
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: "#938876", margin: "0 0 24px" }}>{q.sub}</p>

          {q.key === "who" && (
            <WhoScreen
              age={answers.age}
              pin={pin}
              city={city}
              onAge={(v) => setAnswers((a) => ({ ...a, age: digitsOnly(v).slice(0, 2) }))}
              onBlurAge={() => setAnswers((a) => ({ ...a, age: digitsOnly(a.age) ? String(ageNum(a.age)) : "" }))}
              onPin={(v) => setPin(digitsOnly(v).slice(0, 6))}
              onPickCity={(code) => setPin(code)}
            />
          )}

          {q.opts && <PlainScreen qKey={q.key} answers={answers} city={city} onPick={(i) => setOption(q.key, i)} />}

          {q.debt && <DebtScreen answers={answers} onToggle={setDebt} onClear={clearDebt} />}

          {q.key === "comfort" && <TogglesScreen answers={answers} city={city} onFlip={flip} />}
        </div>

        {/* Sticky footer */}
        <footer
          style={{
            position: "sticky",
            bottom: 0,
            background: "var(--cream)",
            borderTop: "1px solid #EADFCC",
            padding: "14px 20px 18px",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <button
            onClick={back}
            style={{
              appearance: "none",
              cursor: "pointer",
              minHeight: 56,
              padding: "0 22px",
              borderRadius: 999,
              border: "2px solid #EADFCC",
              background: "transparent",
              color: "#463E31",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            Back
          </button>
          <button
            onClick={next}
            style={{
              appearance: "none",
              border: "none",
              cursor: "pointer",
              flex: 1,
              minHeight: 56,
              borderRadius: 999,
              background: INK,
              color: "#FFFBF2",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {qi === 8 ? "Show me the number" : "Next"}
          </button>
        </footer>
      </div>
    </Shell>
  );
}

// --- Landing ---------------------------------------------------------------

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 24px 28px",
      }}
    >
      <div>
        <div style={{ ...disp, fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", color: INK, marginBottom: 40 }}>Kitna Chahiye</div>
        <h1 style={{ ...disp, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 0.95, fontSize: 56, color: INK, margin: "0 0 20px", textWrap: "pretty" as CSSProperties["textWrap"] }}>
          How much does your life actually cost?
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "#6F6557", margin: 0, maxWidth: "19em" }}>
          Nine questions.
          <br />
          Then the salary you need to pay for it.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <button
          onClick={onStart}
          style={{
            appearance: "none",
            border: "none",
            cursor: "pointer",
            width: "100%",
            minHeight: 60,
            borderRadius: 999,
            background: INK,
            color: "#FFFBF2",
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          Find out
        </button>
        <div style={{ ...mono, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#938876" }}>
          <span>Under 3 minutes</span>
          <span>No signup</span>
          <span>Free</span>
        </div>
      </div>
    </div>
  );
}

// --- Screen one: who -------------------------------------------------------

const fieldLabel: CSSProperties = { fontSize: 13, fontWeight: 700, color: "#463E31", marginBottom: 10 };
const numInput: CSSProperties = {
  width: "100%",
  minHeight: 60,
  padding: "0 20px",
  borderRadius: 16,
  border: "2px solid #EADFCC",
  background: PAPER,
  ...mono,
  fontSize: 24,
  letterSpacing: "0.14em",
  color: INK,
  outline: "none",
};

function FocusInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props;
  return (
    <input
      {...rest}
      style={style}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#17130D")}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#EADFCC";
        rest.onBlur?.(e);
      }}
    />
  );
}

function WhoScreen({
  age,
  pin,
  city,
  onAge,
  onBlurAge,
  onPin,
  onPickCity,
}: {
  age: string;
  pin: string;
  city: City;
  onAge: (v: string) => void;
  onBlurAge: () => void;
  onPin: (v: string) => void;
  onPickCity: (code: string) => void;
}) {
  const cityLine =
    pin.length < 6
      ? "Six digits. We use it for rent and electricity, and it never leaves your device."
      : city.known
        ? `${city.name}, ${city.state}. Using local rent and tariff data.`
        : "We do not have that pincode yet. Pick the closest city.";
  const showChips = pin.length === 6 && !city.known;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <div style={fieldLabel}>Your age</div>
        <FocusInput
          value={age}
          onChange={(e) => onAge(e.target.value)}
          onBlur={onBlurAge}
          inputMode="numeric"
          maxLength={2}
          placeholder="26"
          style={numInput}
        />
        <div style={{ marginTop: 12, fontSize: 14, color: "#6F6557", lineHeight: 1.5 }}>
          It sets what a comfortable month looks like at your stage, and it never leaves your device.
        </div>
      </div>
      <div>
        <div style={fieldLabel}>Your pincode</div>
        <FocusInput
          value={pin}
          onChange={(e) => onPin(e.target.value)}
          inputMode="numeric"
          maxLength={6}
          placeholder="560001"
          style={numInput}
        />
        <div style={{ marginTop: 12, fontSize: 14, color: "#6F6557", lineHeight: 1.5 }}>{cityLine}</div>
        {showChips && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {CITY_CHIPS.map(([label, code]) => (
              <button
                key={label}
                onClick={() => onPickCity(code)}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  minHeight: 44,
                  padding: "0 16px",
                  borderRadius: 999,
                  border: "1px solid #EADFCC",
                  background: "#F6EFE2",
                  color: "#463E31",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Single-choice screens -------------------------------------------------

function PlainScreen({
  qKey,
  answers,
  city,
  onPick,
}: {
  qKey: (typeof QUESTIONS)[number]["key"];
  answers: Answers;
  city: City;
  onPick: (i: number) => void;
}) {
  const q = QUESTIONS.find((x) => x.key === qKey)!;
  const selected = answers[qKey as keyof Answers] as unknown as number;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {q.opts!.map((o, i) => {
        const on = selected === i;
        return (
          <button
            key={i}
            onClick={() => onPick(i)}
            style={{
              appearance: "none",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              minHeight: 64,
              padding: "14px 18px",
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              transition: "all .15s ease-out",
              border: `2px solid ${on ? INK : LINE}`,
              background: on ? PAPER : "transparent",
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: INK }}>{o.label}</span>
              <span style={{ fontSize: 13, color: "#938876" }}>{o.sub}</span>
            </span>
            <span style={{ ...mono, fontSize: 13, flexShrink: 0, color: on ? INK : "#B9AE9B" }}>{fmt(priced(qKey, i, city))}</span>
          </button>
        );
      })}
    </div>
  );
}

// --- Screen eight: debt ----------------------------------------------------

function DebtScreen({
  answers,
  onToggle,
  onClear,
}: {
  answers: Answers;
  onToggle: (k: DebtKey, fields: Partial<Answers["d"][DebtKey]>) => void;
  onClear: () => void;
}) {
  const anyOn = DEBT_DEFS.some((d) => answers.d[d.k].on);
  const rows = [{ k: "none" as const, label: "Nothing", sub: "Loan free! :))", v: 0, years: false }, ...DEBT_DEFS];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((d) => {
        const isNone = d.k === "none";
        const row = isNone ? { on: false, emi: "", yrs: "" } : answers.d[d.k as DebtKey];
        const on = isNone ? !anyOn : row.on;
        return (
          <div key={d.k} style={{ borderRadius: 18, transition: "all .15s ease-out", border: `2px solid ${on ? INK : LINE}`, background: on ? PAPER : "transparent" }}>
            <button
              onClick={() => (isNone ? onClear() : onToggle(d.k as DebtKey, { on: !row.on }))}
              style={{
                appearance: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                minHeight: 64,
                padding: "14px 18px",
                border: "none",
                background: "transparent",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: INK }}>{d.label}</span>
                <span style={{ fontSize: 13, color: "#938876" }}>{d.sub}</span>
              </span>
              <span
                style={{
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all .15s ease-out",
                  border: `2px solid ${on ? INK : "#DFD3BC"}`,
                  background: on ? INK : "transparent",
                  color: "#FFFBF2",
                }}
              >
                {on ? "\u2713" : ""}
              </span>
            </button>
            {!isNone && (answers.d[d.k as DebtKey].on) && (
              <div className="kc-in" style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#463E31", marginBottom: 8 }}>How much do you pay a month?</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 52, padding: "0 16px", borderRadius: 14, border: "1px solid #EADFCC", background: PAPER }}>
                    <span style={{ ...mono, fontSize: 18, color: "#938876" }}>{"\u20B9"}</span>
                    <input
                      value={grouped(answers.d[d.k as DebtKey].emi)}
                      onChange={(e) => onToggle(d.k as DebtKey, { emi: digitsOnly(e.target.value).slice(0, 7) })}
                      inputMode="numeric"
                      placeholder={(d as { v: number }).v.toLocaleString("en-IN")}
                      style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", ...mono, fontSize: 18, color: INK }}
                    />
                  </div>
                </div>
                {(d as { years?: boolean }).years && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, color: "#6F6557" }}>Years left on it?</span>
                    <input
                      value={answers.d[d.k as DebtKey].yrs}
                      onChange={(e) => onToggle(d.k as DebtKey, { yrs: digitsOnly(e.target.value).slice(0, 2) })}
                      inputMode="numeric"
                      maxLength={2}
                      placeholder="7"
                      style={{
                        width: 66,
                        minHeight: 44,
                        padding: "0 12px",
                        borderRadius: 12,
                        border: "1px solid #EADFCC",
                        background: PAPER,
                        ...mono,
                        fontSize: 16,
                        color: INK,
                        outline: "none",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ ...mono, fontSize: 11, color: "#B9AE9B" }}>optional</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Screen nine: comfort toggles ------------------------------------------

function TogglesScreen({ answers, city, onFlip }: { answers: Answers; city: City; onFlip: (k: ToggleKey) => void }) {
  const m = buildModel(answers, city);
  const costIdx = 0.78 + 0.22 * city.idx;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {TOGGLE_DEFS.map((t) => {
        const on = answers.t[t.key];
        const amt =
          t.v === "pct20"
            ? on
              ? "+ " + fmt(m.save)
              : "+ a quarter of the rest"
            : "+ " + fmt(Math.round(((t.v as number) * costIdx) / 100) * 100) + " a month";
        return (
          <button
            key={t.key}
            onClick={() => onFlip(t.key)}
            style={{
              appearance: "none",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              padding: 22,
              borderRadius: 24,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              transition: "all .2s ease-out",
              border: `2px solid ${on ? INK : LINE}`,
              background: on ? PAPER : "transparent",
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ ...disp, fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, color: INK }}>{t.label}</span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: "#6F6557" }}>{t.sub}</span>
              <span style={{ ...mono, fontSize: 12, marginTop: 2, color: on ? ACCENT : "#B9AE9B" }}>{amt}</span>
            </span>
            <span style={{ flexShrink: 0, width: 52, height: 32, borderRadius: 999, padding: 3, transition: "background .2s ease-out", background: on ? INK : "#DFD3BC" }}>
              <span style={{ display: "block", width: 26, height: 26, borderRadius: 999, background: "#FFFFFF", transition: "transform .2s ease-out", transform: on ? "translateX(20px)" : "translateX(0)" }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

// --- Calculating -----------------------------------------------------------

function Calculating({ pin, state, calcStep }: { pin: string; state: string; calcStep: number }) {
  const texts = [
    "Checking rents around " + (pin || "your pincode") + ".",
    "Pulling electricity tariffs for " + state + ".",
    "Working out your tax.",
  ];
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 28px" }}>
      <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#B9AE9B", marginBottom: 20 }}>Working it out</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {texts.map((t, i) => {
          const done = i < calcStep;
          const active = i === calcStep;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 16,
                lineHeight: 1.4,
                transition: "opacity .4s ease-out",
                color: i <= calcStep ? "#17130D" : "#B9AE9B",
                opacity: i <= calcStep ? 1 : 0.35,
              }}
            >
              <span style={{ ...mono, fontSize: 13, color: done ? "#1E8E5A" : ACCENT }}>{done ? "\u2713" : active ? "\u2192" : "\u00B7"}</span>
              <span>{t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { cityFromKey };
