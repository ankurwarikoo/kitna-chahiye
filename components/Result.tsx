"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import {
  Answers,
  City,
  breakdownRows,
  fmt,
  gapLine,
  insightLine,
  lakh,
  logPos,
  MEDIAN_TAKE_HOME,
  model as buildModel,
} from "@/lib/cost-model";
import { useAnimatedValue } from "./useAnimatedValue";

const mono: CSSProperties = { fontFamily: "var(--font-mono), monospace" };
const disp: CSSProperties = { fontFamily: "var(--font-display), sans-serif" };
const ACCENT = "#E14B33";

const eyebrow: CSSProperties = {
  ...mono,
  fontSize: 10,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "#B9AE9B",
};

export interface ResultProps {
  answers: Answers;
  city: City;
  /** count the big number up from zero (post-calculating reveal) */
  revealBig?: boolean;
  onRestart: () => void;
}

export function Result({ answers, city, revealBig = false, onRestart }: ResultProps) {
  const m = useMemo(() => buildModel(answers, city), [answers, city]);
  const big = useAnimatedValue(m.total, 1100, revealBig ? 0 : m.total);

  const rows = useMemo(() => breakdownRows(answers, m), [answers, m]);
  const insight = useMemo(() => insightLine(answers, m), [answers, m]);
  const gap = useMemo(() => gapLine(m), [m]);

  const [openRow, setOpenRow] = useState<string | null>(null);
  const [openSrc, setOpenSrc] = useState<string | null>(null);
  const [corrOpen, setCorrOpen] = useState(false);
  const [corrVal, setCorrVal] = useState("");
  const [corrSent, setCorrSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const toggleRow = (k: string) => {
    setOpenRow((cur) => (cur === k ? null : k));
    setOpenSrc(null);
  };

  const copy = async () => {
    // The address bar already holds the canonical /r/<token> link (written on
    // reveal, or the URL the shared link was opened with).
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      /* no clipboard permission — the address bar still holds the link */
    }
    setCopied(true);
  };

  const resultCity = city.known ? city.name : "Your city";

  return (
    <div style={{ background: "var(--cream)", paddingBottom: 40 }}>
      {/* a. The number */}
      <section style={{ display: "flex", flexDirection: "column", padding: "36px 24px 0", animation: "kc-in .5s ease-out both" }}>
        <div style={{ ...eyebrow, fontSize: 11, color: "#938876", marginBottom: 18 }}>{resultCity} · what your life costs</div>
        <div
          className="tnum"
          style={{ ...disp, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 0.88, fontSize: 72, color: ACCENT }}
        >
          {fmt(big)}
        </div>
        <div style={{ ...disp, fontWeight: 800, letterSpacing: "-0.03em", fontSize: 26, color: "#17130D", marginTop: 8 }}>
          a month, in hand.
        </div>
        <div style={{ height: 1, background: "#EADFCC", margin: "26px 0 18px" }} />
        <div style={{ fontSize: 17, lineHeight: 1.55, color: "#463E31" }}>
          That is a <strong style={{ fontWeight: 800 }}>{lakh(m.salary)}</strong> salary, before tax and PF.
        </div>
        <div style={{ ...mono, fontSize: 11, color: "#B9AE9B", marginTop: 10 }}>
          Gross to in-hand assumed at 93% · updated Jun 2026
        </div>
      </section>

      {/* b. Where it goes */}
      <section style={{ padding: "28px 20px 0" }}>
        <div style={{ ...eyebrow, marginBottom: 14 }}>Where it goes</div>
        <div style={{ display: "flex", height: 22, borderRadius: 999, overflow: "hidden", gap: 2, marginBottom: 18 }}>
          {rows.map((r) => (
            <div
              key={r.k}
              onClick={() => toggleRow(r.k)}
              style={{
                cursor: "pointer",
                transition: "all .2s ease-out",
                width: ((r.amt / m.total) * 100).toFixed(2) + "%",
                background: r.color,
                opacity: openRow && openRow !== r.k ? 0.35 : 1,
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {rows.map((r) => {
            const open = openRow === r.k;
            const srcOpen = openSrc === r.k;
            return (
              <div key={r.k} style={{ borderBottom: "1px solid #EADFCC" }}>
                <div
                  onClick={() => toggleRow(r.k)}
                  style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "15px 0", minHeight: 52 }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, background: r.color }} />
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", color: "#17130D" }}>{r.label}</span>
                  <span style={{ ...mono, fontSize: 12, color: "#B9AE9B" }}>{Math.round((r.amt / m.total) * 100)}%</span>
                  <span className="tnum" style={{ ...mono, fontSize: 15, color: "#17130D" }}>
                    {fmt(r.amt)}
                  </span>
                </div>
                {open && (
                  <div className="kc-in" style={{ padding: "0 0 18px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: "#6F6557" }}>{r.note}</div>
                    <button
                      onClick={() => setOpenSrc((cur) => (cur === r.k ? null : r.k))}
                      style={{
                        appearance: "none",
                        cursor: "pointer",
                        alignSelf: "flex-start",
                        minHeight: 30,
                        padding: "0 12px",
                        borderRadius: 999,
                        border: "1px solid #EADFCC",
                        background: "#F6EFE2",
                        ...mono,
                        fontSize: 11,
                        color: "#6F6557",
                      }}
                    >
                      {r.src}
                    </button>
                    {srcOpen && (
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: "#938876", borderLeft: "2px solid #EADFCC", paddingLeft: 12 }}>
                        {r.srcDetail}
                      </div>
                    )}
                    {r.isRent && (
                      <div>
                        <button
                          onClick={() => setCorrOpen((v) => !v)}
                          style={{
                            appearance: "none",
                            cursor: "pointer",
                            background: "none",
                            border: "none",
                            padding: 0,
                            fontSize: 13,
                            color: "#6F6557",
                            textDecoration: "underline",
                            textUnderlineOffset: 3,
                          }}
                        >
                          This isn&apos;t right for my area
                        </button>
                        {corrOpen && (
                          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <input
                              value={corrVal}
                              onChange={(e) => setCorrVal(e.target.value)}
                              placeholder="What do you actually pay?"
                              style={{
                                flex: 1,
                                minWidth: 0,
                                minHeight: 44,
                                padding: "0 14px",
                                borderRadius: 12,
                                border: "1px solid #EADFCC",
                                background: "#FFFFFF",
                                fontSize: 14,
                                color: "#17130D",
                                outline: "none",
                              }}
                            />
                            <button
                              onClick={() => {
                                setCorrSent(true);
                                setCorrVal("");
                              }}
                              style={{
                                appearance: "none",
                                border: "none",
                                cursor: "pointer",
                                minHeight: 44,
                                padding: "0 16px",
                                borderRadius: 12,
                                background: "#17130D",
                                color: "#FFFBF2",
                                fontSize: 14,
                                fontWeight: 700,
                              }}
                            >
                              {corrSent ? "Thanks" : "Send"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* c. The gap */}
      <section style={{ padding: "44px 20px 0" }}>
        <div style={{ ...eyebrow, marginBottom: 16 }}>The gap</div>
        <div style={{ position: "relative", height: 118, marginBottom: 8 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 64, height: 2, background: "#EADFCC" }} />
          <div style={{ position: "absolute", top: 52, transform: "translateX(-50%)", left: logPos(MEDIAN_TAKE_HOME) }}>
            <div style={{ width: 2, height: 26, background: "#938876", margin: "0 auto" }} />
          </div>
          <div
            style={{ position: "absolute", top: 80, transform: "translateX(-50%)", textAlign: "center", width: 130, left: logPos(MEDIAN_TAKE_HOME) }}
          >
            <div style={{ ...mono, fontSize: 13, color: "#6F6557" }}>{fmt(MEDIAN_TAKE_HOME)}</div>
            <div style={{ fontSize: 11, color: "#938876", lineHeight: 1.3, marginTop: 2 }}>median urban salaried</div>
          </div>
          <div style={{ position: "absolute", top: 6, transform: "translateX(-50%)", textAlign: "center", width: 120, left: logPos(m.total) }}>
            <div style={{ fontSize: 11, color: "#938876", marginBottom: 3 }}>you need</div>
            <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: ACCENT }}>{fmt(m.total)}</div>
          </div>
          <div style={{ position: "absolute", top: 44, width: 2, height: 22, transform: "translateX(-50%)", left: logPos(m.total), background: ACCENT }} />
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "#463E31", margin: "16px 0 0" }}>{gap}</p>
        <div style={{ ...mono, fontSize: 11, color: "#B9AE9B", marginTop: 8 }}>Salaried income distribution, urban India · 2026</div>
      </section>

      {/* d. One line they did not expect */}
      <section style={{ margin: "44px 20px 0", padding: "28px 24px", borderRadius: 28, background: "#17130D" }}>
        <div style={{ ...eyebrow, color: "#938876", marginBottom: 14 }}>One thing you didn&apos;t ask about</div>
        <div style={{ ...disp, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, fontSize: 26, color: "#FFFBF2" }}>{insight}</div>
      </section>

      {/* e. Share */}
      <section style={{ padding: "44px 20px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={copy}
            style={{
              appearance: "none",
              border: "none",
              cursor: "pointer",
              width: "100%",
              minHeight: 58,
              borderRadius: 999,
              background: "#17130D",
              color: "#FFFBF2",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {copied ? "Link copied" : "Copy my link"}
          </button>
          <button
            onClick={onRestart}
            style={{
              appearance: "none",
              cursor: "pointer",
              width: "100%",
              minHeight: 52,
              borderRadius: 999,
              border: "2px solid #EADFCC",
              background: "transparent",
              color: "#463E31",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            Change my answers
          </button>
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: "#B9AE9B", marginTop: 14 }}>The link carries your answers, not your pincode.</div>
      </section>

      {/* f. Footer */}
      <footer style={{ marginTop: 44, padding: "24px 20px 0", borderTop: "1px solid #EADFCC" }}>
        <a href="#methodology" style={{ fontSize: 13, color: "#6F6557", textDecoration: "underline", textUnderlineOffset: 3 }}>
          Methodology and sources
        </a>
      </footer>
    </div>
  );
}
