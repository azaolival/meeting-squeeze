"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Design Tokens — GSD Suite Palette ───────────────────────────────────────
const C = {
  dark:     "#0f172a", darkMid:  "#1e293b", darkSub: "#334155",
  bg:       "#f8fafc", white:    "#ffffff",
  border:   "#e2e8f0", borderMd: "#cbd5e1",
  text:     "#0f172a", text2:    "#475569", text3: "#94a3b8", text4: "#64748b",
  red:      "#ef4444", redBg:    "#fef2f2", redBd:    "#fecaca",
  amber:    "#b45309", amberBg:  "#fffbeb", amberBd:  "#fde68a",
  blue:     "#0891b2", blueBg:   "#e0f9ff", blueBd:   "#bae6fd",
  indigo:   "#6366f1", indigoBg: "#eef2ff", indigoBd: "#c7d2fe",
  green:    "#059669", greenBg:  "#ecfdf5", greenBd:  "#a7f3d0",
  purple:   "#7c3aed", purpleBg: "#faf5ff", purpleBd: "#ddd6fe",
};
const FONT = "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "var(--font-mono), 'Fira Code', 'Courier New', monospace";

// ─── Utilities ────────────────────────────────────────────────────────────────
function fmt(n)    { return Number(n || 0).toLocaleString(); }
function wc(t)     { return t ? t.trim().split(/\s+/).filter(Boolean).length : 0; }
function fmtSec(s) { const m = Math.floor(s / 60); return `${m}:${(s % 60).toString().padStart(2, "0")}`; }
function genId()   { return `ms_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }
function titleOf(t) {
  if (!t) return "Untitled Session";
  const s = t.trim().split(/[.!?\n]/)[0].trim();
  return s.length > 65 ? s.slice(0, 65) + "…" : s || "Untitled Session";
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
function fmtDateShort(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function ratio(orig, sq) {
  if (!orig || !sq) return null;
  const r = Math.round((1 - wc(sq) / wc(orig)) * 100);
  return r > 0 ? r : null;
}

const DEFAULT_SETTINGS = {
  provider:      "groq",
  groqKey:       "",
  groqModel:     "llama-3.3-70b-versatile",
  anthropicKey:  "",
  claudeModel:   "claude-sonnet-4-6",
  squeezeFormat: "bullets",
};

const LS = {
  sessions: {
    load: () => { try { return JSON.parse(localStorage.getItem("ms_sessions") || "[]"); } catch { return []; } },
    save: (s) => { try { localStorage.setItem("ms_sessions", JSON.stringify(s)); } catch {} },
  },
  settings: {
    load: () => {
      try {
        const saved = JSON.parse(localStorage.getItem("ms_settings") || "{}");
        if (saved.model && !saved.claudeModel) { saved.claudeModel = saved.model; delete saved.model; }
        return { ...DEFAULT_SETTINGS, ...saved };
      } catch { return DEFAULT_SETTINGS; }
    },
    save: (s) => { try { localStorage.setItem("ms_settings", JSON.stringify(s)); } catch {} },
  },
};

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ tab, setTab, sessionCount, totalWords, lastSession }) {
  const stats = [
    { label: "Sessions",       value: sessionCount || 0,                     color: sessionCount > 0 ? "#38bdf8" : C.text4 },
    { label: "Words Captured", value: totalWords > 0 ? fmt(totalWords) : 0,  color: totalWords > 0  ? "#fde047" : C.text4 },
    { label: "Last Session",   value: lastSession ? fmtDateShort(lastSession) : "—", color: C.text4 },
  ];
  const tabs = [
    { id: "record",   label: "Record" },
    { id: "sessions", label: sessionCount > 0 ? `Sessions  ${sessionCount}` : "Sessions" },
    { id: "settings", label: "Settings" },
  ];
  return (
    <div style={{ background: C.dark, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 0, borderBottom: `1px solid ${C.darkMid}`, overflowX: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 30, flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: C.white, fontFamily: MONO, letterSpacing: "-0.02em" }}>MeetingSqueeze</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.text3, background: C.darkMid, padding: "2px 7px", borderRadius: 4, fontFamily: MONO, letterSpacing: "0.04em" }}>GSD SUITE</span>
        </div>
        {stats.map((s, i, arr) => (
          <div key={s.label} style={{ textAlign: "center", padding: "0 20px", borderRight: i < arr.length - 1 ? `1px solid ${C.darkMid}` : "none", flexShrink: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: MONO }}>{s.value}</div>
            <div style={{ fontSize: 10, color: C.text4, marginTop: 3, fontFamily: FONT }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", padding: "0 20px", gap: 2 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 18px", background: tab === t.id ? C.bg : "transparent", border: "none",
            borderRadius: tab === t.id ? "8px 8px 0 0" : 6,
            color: tab === t.id ? C.text : C.text3,
            fontFamily: MONO, fontSize: 11, fontWeight: 700, cursor: "pointer",
            letterSpacing: "0.05em", transition: "color .15s, background .15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Record View ──────────────────────────────────────────────────────────────
function RecordView({ recStatus, liveTranscript, elapsed, currentSqueeze, squeezeError,
  settings, hasKey, pasteMode, pasteText, setPasteMode, setPasteText,
  onStart, onStop, onSqueeze, onPasteSqueeze, onSave, onDiscard }) {

  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const transcriptRef = useRef(null);

  useEffect(() => {
    if (transcriptRef.current && recStatus === "recording") {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [liveTranscript, recStatus]);

  useEffect(() => { setTranscriptOpen(false); }, [currentSqueeze]);

  const words = wc(liveTranscript);
  const sqWords = wc(currentSqueeze);
  const compression = ratio(liveTranscript, currentSqueeze);

  const providerLabel = settings.provider === "anthropic" ? "Claude" : "Groq";

  // ── Left panel ──────────────────────────────────────────────────────────────
  const LeftPanel = () => (
    <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Status pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {recStatus === "recording" && <span className="rec-dot" style={{ width: 9, height: 9, borderRadius: "50%", background: C.red, display: "inline-block", flexShrink: 0 }} />}
          {recStatus === "squeezing" && <span className="spin" style={{ width: 13, height: 13, border: `2px solid ${C.purpleBd}`, borderTopColor: C.purple, borderRadius: "50%", display: "inline-block", flexShrink: 0 }} />}
          <span style={{
            fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: "0.07em",
            padding: "3px 10px", borderRadius: 5,
            ...(recStatus === "idle"      ? { color: C.text3,   background: C.bg       } : {}),
            ...(recStatus === "starting"  ? { color: C.amber,   background: C.amberBg  } : {}),
            ...(recStatus === "recording" ? { color: C.red,     background: C.redBg    } : {}),
            ...(recStatus === "captured"  ? { color: C.blue,    background: C.blueBg   } : {}),
            ...(recStatus === "squeezing" ? { color: C.purple,  background: C.purpleBg } : {}),
            ...(recStatus === "squeezed"  ? { color: C.green,   background: C.greenBg  } : {}),
          }}>
            {{ idle: "READY", starting: "STARTING…", recording: "RECORDING", captured: "CAPTURED", squeezing: "SQUEEZING…", squeezed: "SQUEEZED" }[recStatus] || recStatus.toUpperCase()}
          </span>
        </div>

        {/* ── IDLE ── */}
        {recStatus === "idle" && (
          <>
            <button onClick={onStart} style={{
              padding: "14px 20px", background: C.green, color: C.white, border: "none",
              borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: MONO,
              letterSpacing: "0.05em", boxShadow: `0 2px 10px ${C.greenBd}`, transition: "box-shadow .15s, transform .1s",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 18px ${C.greenBd}`; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 2px 10px ${C.greenBd}`; e.currentTarget.style.transform = "none"; }}>
              ● START CAPTURE
            </button>

            <button onClick={() => { setPasteMode(m => !m); }} style={{
              padding: "11px 20px", background: pasteMode ? C.indigoBg : "transparent",
              color: pasteMode ? C.indigo : C.text3,
              border: `1.5px solid ${pasteMode ? C.indigoBd : C.border}`,
              borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: MONO,
              letterSpacing: "0.04em", transition: "all .15s",
            }}>
              ⌨ PASTE TRANSCRIPT
            </button>

            {!hasKey && (
              <div style={{ padding: "10px 13px", background: C.amberBg, border: `1px solid ${C.amberBd}`, borderRadius: 8, fontSize: 11, color: C.amber, fontFamily: FONT, lineHeight: 1.6 }}>
                Add your {settings.provider === "anthropic" ? "Anthropic" : "Groq"} API key in Settings to enable Squeeze.
              </div>
            )}

            {hasKey && (
              <div style={{ padding: "10px 13px", background: C.greenBg, border: `1px solid ${C.greenBd}`, borderRadius: 8, fontSize: 11, color: C.green, fontFamily: MONO }}>
                ✓ {providerLabel} connected — Squeeze ready
              </div>
            )}

            <div style={{ padding: 13, background: C.indigoBg, border: `1px solid ${C.indigoBd}`, borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.indigo, fontFamily: MONO, marginBottom: 7, letterSpacing: "0.05em" }}>TIPS</div>
              {["Use Chrome or Edge (required for mic)", "Put call on speaker — mic picks up both sides", "Or paste any transcript to squeeze instantly"].map((tip, i) => (
                <div key={i} style={{ fontSize: 11, color: C.indigo, fontFamily: FONT, lineHeight: 1.6, display: "flex", gap: 6, marginBottom: 2 }}>
                  <span style={{ flexShrink: 0 }}>→</span><span>{tip}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── RECORDING ── */}
        {recStatus === "recording" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[{ label: "Duration", value: fmtSec(elapsed) }, { label: "Words", value: fmt(words) }].map(s => (
                <div key={s.label} style={{ background: C.redBg, border: `1px solid ${C.redBd}`, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.red, fontFamily: MONO }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: C.text3, fontFamily: FONT, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={onStop} style={{
              padding: "14px 20px", background: C.red, color: C.white, border: "none",
              borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: MONO,
              letterSpacing: "0.05em", boxShadow: `0 2px 10px ${C.redBd}`, transition: "box-shadow .15s, transform .1s",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 18px ${C.redBd}`; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 2px 10px ${C.redBd}`; e.currentTarget.style.transform = "none"; }}>
              ■ STOP CAPTURE
            </button>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: MONO, textAlign: "center" }}>🎙 Listening…</div>
          </>
        )}

        {recStatus === "starting" && (
          <div style={{ fontSize: 12, color: C.amber, fontFamily: MONO }}>Requesting microphone access…</div>
        )}

        {/* ── CAPTURED ── */}
        {recStatus === "captured" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[{ label: "Duration", value: fmtSec(elapsed), c: C.blue, bg: C.blueBg, bd: C.blueBd },
                { label: "Words",    value: fmt(words),       c: C.blue, bg: C.blueBg, bd: C.blueBd }].map(s => (
                <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.bd}`, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.c, fontFamily: MONO }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: C.text3, fontFamily: FONT, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {squeezeError && (
              <div style={{ padding: "10px 13px", background: C.redBg, border: `1px solid ${C.redBd}`, borderRadius: 8, fontSize: 11, color: C.red, fontFamily: FONT, lineHeight: 1.6 }}>{squeezeError}</div>
            )}
            {!hasKey && (
              <div style={{ padding: "10px 13px", background: C.amberBg, border: `1px solid ${C.amberBd}`, borderRadius: 8, fontSize: 11, color: C.amber, fontFamily: FONT, lineHeight: 1.6 }}>
                Add your {settings.provider === "anthropic" ? "Anthropic" : "Groq"} API key in Settings to enable Squeeze.
              </div>
            )}
            <button onClick={onSqueeze} disabled={!hasKey} style={{
              padding: "16px 20px", background: hasKey ? C.indigo : C.border, color: hasKey ? C.white : C.text3,
              border: "none", borderRadius: 9, fontSize: 14, fontWeight: 800, cursor: hasKey ? "pointer" : "not-allowed",
              fontFamily: MONO, letterSpacing: "0.06em", boxShadow: hasKey ? `0 2px 10px ${C.indigoBd}` : "none",
              transition: "box-shadow .15s, transform .1s",
            }}
            onMouseEnter={e => { if (hasKey) { e.currentTarget.style.boxShadow = `0 4px 18px ${C.indigoBd}`; e.currentTarget.style.transform = "translateY(-1px)"; }}}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = hasKey ? `0 2px 10px ${C.indigoBd}` : "none"; e.currentTarget.style.transform = "none"; }}>
              ✦ SQUEEZE IT
            </button>
            <button onClick={onDiscard} style={{ padding: "8px 20px", background: "transparent", color: C.text3, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: MONO }}>
              Discard & Start Over
            </button>
          </>
        )}

        {/* ── SQUEEZING ── */}
        {recStatus === "squeezing" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[{ label: "Duration", value: fmtSec(elapsed) }, { label: "Words", value: fmt(words) }].map(s => (
                <div key={s.label} style={{ background: C.purpleBg, border: `1px solid ${C.purpleBd}`, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.purple, fontFamily: MONO }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: C.text3, fontFamily: FONT, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "14px", background: C.purpleBg, border: `1px solid ${C.purpleBd}`, borderRadius: 8, fontSize: 12, color: C.purple, fontFamily: MONO, textAlign: "center" }}>
              Running {providerLabel}…<br />
              <span style={{ fontSize: 10, color: C.text3, fontFamily: FONT }}>
                {settings.provider === "anthropic" ? settings.claudeModel : settings.groqModel}
              </span>
            </div>
          </>
        )}

        {/* ── SQUEEZED ── */}
        {recStatus === "squeezed" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Duration",    value: fmtSec(elapsed),                       c: C.green,  bg: C.greenBg,  bd: C.greenBd  },
                { label: "Raw Words",   value: fmt(words),                             c: C.blue,   bg: C.blueBg,   bd: C.blueBd   },
                { label: "Squeezed",    value: fmt(sqWords),                           c: C.indigo, bg: C.indigoBg, bd: C.indigoBd },
                { label: "Compression", value: compression ? `${compression}%` : "—", c: C.purple, bg: C.purpleBg, bd: C.purpleBd },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.bd}`, borderRadius: 8, padding: "9px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: s.c, fontFamily: MONO }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: C.text3, fontFamily: FONT, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={onSave} style={{
              padding: "14px 20px", background: C.green, color: C.white, border: "none",
              borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: MONO,
              letterSpacing: "0.06em", boxShadow: `0 2px 10px ${C.greenBd}`, transition: "box-shadow .15s, transform .1s",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 18px ${C.greenBd}`; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 2px 10px ${C.greenBd}`; e.currentTarget.style.transform = "none"; }}>
              ✓ SAVE SESSION
            </button>
            <button onClick={onDiscard} style={{ padding: "8px 20px", background: "transparent", color: C.text3, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: MONO }}>
              Discard & Start Over
            </button>
          </>
        )}
      </div>
    </div>
  );

  // ── Right panel ─────────────────────────────────────────────────────────────
  const RightPanel = () => {

    // Idle + no paste mode: value prop hero
    if (recStatus === "idle" && !pasteMode) {
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 0 }}>
          <div style={{ maxWidth: 560, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🎙</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: FONT, marginBottom: 10, lineHeight: 1.3 }}>
              Never leave a meeting without the intel.
            </div>
            <div style={{ fontSize: 14, color: C.text3, fontFamily: FONT, marginBottom: 36, lineHeight: 1.7 }}>
              Record any meeting, capture the transcript live, then let AI compress it to the decisions, action items, and blockers that actually matter.
            </div>

            {/* 3-step flow */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 36 }}>
              {[
                { step: "01", label: "Record", desc: "Hit Start Capture. Put call on speaker — mic picks up both sides.", color: C.green, bg: C.greenBg, bd: C.greenBd },
                { step: "02", label: "Transcribe", desc: "Words stream in real time via Web Speech API. No lag.", color: C.blue, bg: C.blueBg, bd: C.blueBd },
                { step: "03", label: "Squeeze", desc: "AI compresses the transcript to only what matters.", color: C.indigo, bg: C.indigoBg, bd: C.indigoBd },
              ].map(s => (
                <div key={s.step} style={{ padding: "16px 14px", background: s.bg, border: `1px solid ${s.bd}`, borderRadius: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: s.color, fontFamily: MONO, letterSpacing: "0.08em", marginBottom: 6 }}>{s.step}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: FONT, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: C.text3, fontFamily: FONT, lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
              <div style={{ fontSize: 12, color: C.text3, fontFamily: FONT, marginBottom: 12 }}>Already have a transcript? Skip the recording.</div>
              <button onClick={() => setPasteMode(true)} style={{
                padding: "10px 22px", background: C.indigoBg, color: C.indigo,
                border: `1.5px solid ${C.indigoBd}`, borderRadius: 8, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: MONO, letterSpacing: "0.04em", transition: "all .15s",
              }}>
                ⌨ Paste & Squeeze →
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Idle + paste mode: textarea
    if (recStatus === "idle" && pasteMode) {
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24, gap: 14, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT }}>Paste Transcript</div>
              <div style={{ fontSize: 12, color: C.text3, fontFamily: FONT, marginTop: 2 }}>Paste any meeting notes, transcript, or raw text — then squeeze it.</div>
            </div>
            <button onClick={() => { setPasteMode(false); setPasteText(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 13, fontFamily: MONO }}>✕ Cancel</button>
          </div>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder="Paste your meeting transcript here…&#10;&#10;Example:&#10;Hey everyone thanks for joining. So the Q3 pipeline looks strong — Rocket deal closes end of month. CrossCountry hit a blocker on the Encompass config, John needs to fix by Friday…"
            autoFocus
            style={{
              flex: 1, resize: "none", padding: "14px 16px", border: `1.5px solid ${C.border}`, borderRadius: 10,
              fontSize: 13, fontFamily: FONT, color: C.text, background: C.white, outline: "none",
              lineHeight: 1.7, boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = C.indigoBd}
            onBlur={e => e.target.style.borderColor = C.border}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => onPasteSqueeze(pasteText)}
              disabled={!pasteText.trim() || !hasKey}
              style={{
                padding: "13px 28px", background: pasteText.trim() && hasKey ? C.indigo : C.border,
                color: pasteText.trim() && hasKey ? C.white : C.text3, border: "none", borderRadius: 9,
                fontSize: 13, fontWeight: 800, cursor: pasteText.trim() && hasKey ? "pointer" : "not-allowed",
                fontFamily: MONO, letterSpacing: "0.06em", boxShadow: pasteText.trim() && hasKey ? `0 2px 10px ${C.indigoBd}` : "none",
                transition: "all .15s",
              }}
            >
              ✦ SQUEEZE IT
            </button>
            {pasteText.trim() && (
              <span style={{ fontSize: 11, color: C.text3, fontFamily: MONO }}>{fmt(wc(pasteText))} words</span>
            )}
            {!hasKey && pasteText.trim() && (
              <span style={{ fontSize: 11, color: C.amber, fontFamily: FONT }}>Add API key in Settings first</span>
            )}
          </div>
        </div>
      );
    }

    // Recording: live transcript
    if (recStatus === "recording") {
      return (
        <div ref={transcriptRef} style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <div style={{ fontSize: 14, fontFamily: FONT, lineHeight: 1.85, color: C.text, whiteSpace: "pre-wrap" }}>
            {liveTranscript || <span style={{ color: C.text3, fontStyle: "italic" }}>Listening… start speaking.</span>}
          </div>
        </div>
      );
    }

    // Captured: transcript with squeeze prompt
    if (recStatus === "captured") {
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: C.indigoBg, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: C.indigo, fontFamily: FONT, fontWeight: 600 }}>Transcript captured — hit Squeeze It to extract key business points</span>
            <span style={{ fontSize: 11, color: C.text3, fontFamily: MONO, marginLeft: "auto" }}>{fmt(words)} words</span>
          </div>
          <div ref={transcriptRef} style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            <div style={{ fontSize: 13, fontFamily: FONT, lineHeight: 1.85, color: C.text, whiteSpace: "pre-wrap" }}>{liveTranscript}</div>
          </div>
        </div>
      );
    }

    // Squeezing: transcript + spinner overlay
    if (recStatus === "squeezing") {
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", opacity: 0.4 }}>
            <div style={{ fontSize: 13, fontFamily: FONT, lineHeight: 1.85, color: C.text, whiteSpace: "pre-wrap" }}>{liveTranscript}</div>
          </div>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <span className="spin" style={{ width: 32, height: 32, border: `3px solid ${C.purpleBd}`, borderTopColor: C.purple, borderRadius: "50%", display: "inline-block" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, fontFamily: MONO }}>Squeezing with {providerLabel}…</div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: FONT }}>Extracting decisions, actions, blockers</div>
          </div>
        </div>
      );
    }

    // Squeezed: HERO result
    if (recStatus === "squeezed" && currentSqueeze) {
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Result header */}
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: C.greenBg, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.green, fontFamily: MONO, letterSpacing: "0.06em" }}>✓ SQUEEZE RESULT</span>
            {compression && <span style={{ fontSize: 10, color: C.indigo, background: C.indigoBg, padding: "2px 8px", borderRadius: 4, fontFamily: MONO, fontWeight: 700 }}>{compression}% compressed</span>}
            <button onClick={() => navigator.clipboard.writeText(currentSqueeze).catch(() => {})}
              style={{ marginLeft: "auto", padding: "5px 12px", background: C.white, border: `1px solid ${C.greenBd}`, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", color: C.green, fontFamily: MONO }}>
              Copy
            </button>
          </div>

          {/* Squeeze output — THE HERO */}
          <div className="fade-in" style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
            <div style={{ fontSize: 15, fontFamily: FONT, lineHeight: 2, color: C.text, whiteSpace: "pre-wrap", maxWidth: 680 }}>
              {currentSqueeze}
            </div>

            {/* Collapsible raw transcript */}
            <div style={{ marginTop: 32, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <button onClick={() => setTranscriptOpen(o => !o)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.text3, fontFamily: MONO, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10 }}>{transcriptOpen ? "▲" : "▼"}</span>
                Raw Transcript  <span style={{ color: C.text3, fontWeight: 400 }}>({fmt(words)} words)</span>
              </button>
              {transcriptOpen && (
                <div className="fade-in" style={{ marginTop: 14, fontSize: 12, fontFamily: FONT, lineHeight: 1.8, color: C.text2, whiteSpace: "pre-wrap", maxWidth: 680 }}>
                  {liveTranscript}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <LeftPanel />
      <RightPanel />
    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({ session, onOpen, onDelete }) {
  const [hover, setHover] = useState(false);
  const r = ratio(session.transcript, session.squeeze);
  return (
    <div onClick={() => onOpen(session)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: C.white, border: `1.5px solid ${hover ? C.borderMd : C.border}`,
        borderRadius: 10, padding: "14px 16px", cursor: "pointer",
        boxShadow: hover ? "0 4px 14px rgba(0,0,0,0.09)" : "0 1px 3px rgba(0,0,0,0.05)",
        transform: hover ? "translateY(-1px)" : "none",
        transition: "box-shadow .15s, transform .12s, border-color .15s",
      }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FONT, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.title}</div>
          <div style={{ fontSize: 11, color: C.text3, fontFamily: MONO, marginTop: 3 }}>
            {fmtDateShort(session.date)} · {fmtSec(session.duration)} · {fmt(session.wordCount)} words
            {r ? <span style={{ color: C.indigo }}> · {r}% compressed</span> : ""}
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); if (window.confirm("Delete this session?")) onDelete(session.id); }}
          style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 16, lineHeight: 1, padding: "2px 4px", borderRadius: 4 }}
          onMouseEnter={e => e.currentTarget.style.color = C.red}
          onMouseLeave={e => e.currentTarget.style.color = C.text3}>×</button>
      </div>
      {session.squeeze && (
        <div style={{ fontSize: 11, color: C.text2, fontFamily: FONT, lineHeight: 1.55, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
          {session.squeeze}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
        {session.squeeze
          ? <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.greenBg, padding: "2px 8px", borderRadius: 4, fontFamily: MONO }}>✓ Squeezed</span>
          : <span style={{ fontSize: 10, fontWeight: 700, color: C.text3, background: C.bg, padding: "2px 8px", borderRadius: 4, fontFamily: MONO, border: `1px solid ${C.border}` }}>Transcript only</span>
        }
        <span style={{ fontSize: 10, color: C.text3, fontFamily: MONO, marginLeft: "auto" }}>
          {session.squeezeFormat === "bullets" ? "• bullets" : "¶ paragraph"}
        </span>
      </div>
    </div>
  );
}

// ─── Sessions View ────────────────────────────────────────────────────────────
function SessionsView({ sessions, onOpenSession, onDeleteSession }) {
  const [search, setSearch] = useState("");
  const filtered = sessions.filter(s => {
    if (!search.trim()) return true;
    return (s.title + s.transcript + (s.squeeze || "")).toLowerCase().includes(search.toLowerCase());
  });
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "10px 20px", flexShrink: 0 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions…"
          style={{ width: "100%", maxWidth: 480, padding: "8px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: FONT, color: C.text, background: C.bg, outline: "none" }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {sessions.length === 0 ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: C.text3 }}>
            <div style={{ fontSize: 36 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text2 }}>No sessions yet</div>
            <div style={{ fontSize: 12, fontFamily: FONT, color: C.text3 }}>Record a meeting or paste a transcript to get started.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: C.text3, fontSize: 13, fontFamily: MONO }}>No sessions match "{search}"</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 760 }}>
            {filtered.map(s => <SessionCard key={s.id} session={s} onOpen={onOpenSession} onDelete={onDeleteSession} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Session Modal ────────────────────────────────────────────────────────────
function SessionModal({ session, onClose, onDelete }) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const r = ratio(session.transcript, session.squeeze);
  const copy = (text) => { navigator.clipboard.writeText(text).catch(() => {}); };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
      <div className="fade-in" style={{ background: C.white, borderRadius: 12, width: "100%", maxWidth: 780, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: FONT, marginBottom: 4 }}>{session.title}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[fmtDate(session.date), fmtSec(session.duration), `${fmt(session.wordCount)} words`, r ? `${r}% compressed` : null].filter(Boolean).map((b, i) => (
                  <span key={i} style={{ fontSize: 11, color: i === 3 ? C.indigo : C.text3, fontFamily: MONO }}>{b}</span>
                ))}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 20, lineHeight: 1, padding: 4, flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.text3}>×</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {session.squeeze && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.green, fontFamily: MONO, letterSpacing: "0.06em", marginBottom: 14 }}>✓ SQUEEZE RESULT</div>
              <div style={{ fontSize: 14, fontFamily: FONT, lineHeight: 1.9, color: C.text, whiteSpace: "pre-wrap", maxWidth: 680, marginBottom: 28 }}>{session.squeeze}</div>
            </>
          )}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            <button onClick={() => setTranscriptOpen(o => !o)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.text3, fontFamily: MONO, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10 }}>{transcriptOpen ? "▲" : "▼"}</span>
              Raw Transcript  <span style={{ color: C.text3, fontWeight: 400 }}>({fmt(session.wordCount)} words)</span>
            </button>
            {transcriptOpen && (
              <div className="fade-in" style={{ marginTop: 14, fontSize: 12, fontFamily: FONT, lineHeight: 1.8, color: C.text2, whiteSpace: "pre-wrap", maxWidth: 680 }}>
                {session.transcript}
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, flexShrink: 0 }}>
          {session.squeeze && (
            <button onClick={() => copy(session.squeeze)} style={{ padding: "8px 16px", background: C.greenBg, border: `1px solid ${C.greenBd}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.green, fontFamily: MONO }}>Copy Squeeze</button>
          )}
          <button onClick={() => copy(session.transcript)} style={{ padding: "8px 16px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", color: C.text2, fontFamily: MONO }}>Copy Transcript</button>
          <button onClick={() => { if (window.confirm("Delete this session?")) { onDelete(session.id); onClose(); } }}
            style={{ marginLeft: "auto", padding: "8px 16px", background: C.redBg, border: `1px solid ${C.redBd}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.red, fontFamily: MONO }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────
function SettingsView({ settings, onSave, onClearAll }) {
  const [draft, setDraft]         = useState({ ...settings });
  const [showGroqKey, setShowGroqKey]             = useState(false);
  const [showAnthropicKey, setShowAnthropicKey]   = useState(false);
  const [saved, setSaved]         = useState(false);

  const upd = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const save = () => { onSave(draft); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const inp = { width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: FONT, color: C.text, background: C.bg, outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: 12, fontWeight: 700, color: C.text, fontFamily: FONT, marginBottom: 6 };
  const box = { padding: 20, background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 16 };

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: 24 }}>
      <div style={{ maxWidth: 580 }}>
        <div style={box}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT, marginBottom: 4 }}>API Provider</div>
          <div style={{ fontSize: 12, color: C.text3, fontFamily: FONT, marginBottom: 16, lineHeight: 1.6 }}>Groq is free — perfect for beta. Switch to Anthropic when ready for production quality.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { id: "groq",      label: "Groq",      badge: "FREE", bc: C.green,  bbg: C.greenBg,  desc: "Llama 3.3 70B — free tier, no credit card." },
              { id: "anthropic", label: "Anthropic", badge: "PAID", bc: C.amber,  bbg: C.amberBg,  desc: "claude-sonnet-4-6 — highest quality, ~2¢/squeeze." },
            ].map(p => {
              const active = draft.provider === p.id;
              return (
                <button key={p.id} onClick={() => upd("provider", p.id)} style={{
                  padding: "14px 16px", textAlign: "left", background: active ? p.bbg : C.bg,
                  border: `2px solid ${active ? p.bc : C.border}`, borderRadius: 9, cursor: "pointer", transition: "all .15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: active ? p.bc : C.text, fontFamily: FONT }}>{p.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: p.bc, background: p.bbg, padding: "1px 7px", borderRadius: 4, fontFamily: MONO }}>{p.badge}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.text3, fontFamily: FONT, lineHeight: 1.5 }}>{p.desc}</div>
                </button>
              );
            })}
          </div>

          {draft.provider === "groq" && (
            <>
              <div style={{ fontSize: 12, color: C.text3, fontFamily: FONT, marginBottom: 10, lineHeight: 1.6 }}>
                Get a free key at <strong style={{ color: C.green }}>console.groq.com</strong> → API Keys → Create key.
              </div>
              <label style={lbl}>Groq API Key</label>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <input type={showGroqKey ? "text" : "password"} value={draft.groqKey} onChange={e => upd("groqKey", e.target.value)} placeholder="gsk_…" style={{ ...inp, paddingRight: 70 }} />
                <button onClick={() => setShowGroqKey(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: C.text3, fontFamily: MONO }}>{showGroqKey ? "Hide" : "Show"}</button>
              </div>
              {draft.groqKey && <div style={{ fontSize: 11, color: C.green, fontFamily: MONO, marginBottom: 12 }}>✓ Key entered</div>}
              <label style={lbl}>Groq Model</label>
              <select value={draft.groqModel} onChange={e => upd("groqModel", e.target.value)} style={inp}>
                <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
                <option value="llama3-8b-8192">llama3-8b-8192 (Fastest)</option>
                <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (Long context)</option>
              </select>
            </>
          )}

          {draft.provider === "anthropic" && (
            <>
              <div style={{ fontSize: 12, color: C.text3, fontFamily: FONT, marginBottom: 10, lineHeight: 1.6 }}>
                Get a key at <strong style={{ color: C.amber }}>console.anthropic.com</strong> → API Keys. Requires $5 minimum credit.
              </div>
              <label style={lbl}>Anthropic API Key</label>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <input type={showAnthropicKey ? "text" : "password"} value={draft.anthropicKey} onChange={e => upd("anthropicKey", e.target.value)} placeholder="sk-ant-…" style={{ ...inp, paddingRight: 70 }} />
                <button onClick={() => setShowAnthropicKey(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: C.text3, fontFamily: MONO }}>{showAnthropicKey ? "Hide" : "Show"}</button>
              </div>
              {draft.anthropicKey && <div style={{ fontSize: 11, color: C.green, fontFamily: MONO, marginBottom: 12 }}>✓ Key entered</div>}
              <label style={lbl}>Claude Model</label>
              <select value={draft.claudeModel} onChange={e => upd("claudeModel", e.target.value)} style={inp}>
                <option value="claude-sonnet-4-6">claude-sonnet-4-6 (Recommended)</option>
                <option value="claude-haiku-4-5-20251001">claude-haiku-4-5 (Faster, lower cost)</option>
                <option value="claude-opus-4-7">claude-opus-4-7 (Highest quality)</option>
              </select>
            </>
          )}
        </div>

        <div style={box}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT, marginBottom: 14 }}>Squeeze Format</div>
          {[
            { id: "bullets",   label: "Bullet Points", desc: "Key points, decisions, and action items as • bullets. Fast to scan." },
            { id: "paragraph", label: "Paragraphs",     desc: "Dense prose summary in 2–3 compact paragraphs. Better for narrative flow." },
          ].map(opt => (
            <label key={opt.id} style={{ display: "flex", gap: 12, cursor: "pointer", padding: "10px 14px", borderRadius: 8, background: draft.squeezeFormat === opt.id ? C.indigoBg : "transparent", border: `1px solid ${draft.squeezeFormat === opt.id ? C.indigoBd : "transparent"}`, marginBottom: 8, transition: "background .15s" }}>
              <input type="radio" name="squeezeFormat" value={opt.id} checked={draft.squeezeFormat === opt.id} onChange={() => upd("squeezeFormat", opt.id)} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: draft.squeezeFormat === opt.id ? C.indigo : C.text, fontFamily: FONT }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: C.text3, fontFamily: FONT, marginTop: 2 }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={save} style={{ padding: "10px 24px", background: saved ? C.green : C.indigo, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: MONO, letterSpacing: "0.04em", transition: "background .2s" }}>
            {saved ? "✓ Saved" : "Save Settings"}
          </button>
          <button onClick={() => { if (window.confirm("Delete all sessions? This cannot be undone.")) onClearAll(); }}
            style={{ padding: "10px 20px", background: C.redBg, color: C.red, border: `1px solid ${C.redBd}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: MONO }}>
            Clear All Sessions
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [tab,             setTab]             = useState("record");
  const [sessions,        setSessions]        = useState([]);
  const [settings,        setSettings]        = useState(DEFAULT_SETTINGS);
  const [recStatus,       setRecStatus]       = useState("idle");
  const [liveTranscript,  setLiveTranscript]  = useState("");
  const [elapsed,         setElapsed]         = useState(0);
  const [currentSqueeze,  setCurrentSqueeze]  = useState(null);
  const [squeezeError,    setSqueezeError]    = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [pasteMode,       setPasteMode]       = useState(false);
  const [pasteText,       setPasteText]       = useState("");

  const recognitionRef = useRef(null);
  const timerRef       = useRef(null);
  const finalRef       = useRef("");
  const isRecordingRef = useRef(false);

  useEffect(() => {
    setSessions(LS.sessions.load());
    setSettings(LS.settings.load());
  }, []);

  // Core squeeze function — used by both recording flow and paste flow
  const doSqueeze = useCallback(async (transcript) => {
    const apiKey = settings.provider === "anthropic" ? settings.anthropicKey : settings.groqKey;
    const model  = settings.provider === "anthropic" ? settings.claudeModel  : settings.groqModel;
    if (!transcript?.trim() || !apiKey) return;

    setCurrentSqueeze(null);
    setSqueezeError(null);
    setRecStatus("squeezing");

    try {
      const res = await fetch("/api/squeeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, apiKey, format: settings.squeezeFormat, model, provider: settings.provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setCurrentSqueeze(data.squeeze);
      setRecStatus("squeezed");
    } catch (err) {
      setSqueezeError(err.message);
      setRecStatus(finalRef.current.trim() || liveTranscript.trim() ? "captured" : "idle");
    }
  }, [settings, liveTranscript]);

  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition requires Chrome or Edge. Please open this app in Chrome.");
      return;
    }
    finalRef.current = "";
    setLiveTranscript("");
    setCurrentSqueeze(null);
    setSqueezeError(null);
    setElapsed(0);
    setPasteMode(false);
    setRecStatus("starting");

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let restarts = 0;

    rec.onstart = () => {
      isRecordingRef.current = true;
      setRecStatus("recording");
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    };
    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) { finalRef.current += t + " "; }
        else { interim += t; }
      }
      setLiveTranscript(finalRef.current + interim);
    };
    rec.onend = () => {
      if (isRecordingRef.current && restarts < 200) { restarts++; try { rec.start(); } catch {} }
    };
    rec.onerror = (e) => { if (e.error !== "aborted" && e.error !== "no-speech") console.warn("SpeechRecognition:", e.error); };
    rec.start();
    recognitionRef.current = rec;
  }, []);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    if (recognitionRef.current) { recognitionRef.current.abort(); recognitionRef.current = null; }
    clearInterval(timerRef.current);
    const text = finalRef.current.trim();
    setLiveTranscript(text || "");
    setRecStatus(text.length > 0 ? "captured" : "idle");
  }, []);

  const squeezeTranscript = useCallback(() => {
    doSqueeze(finalRef.current.trim() || liveTranscript.trim());
  }, [doSqueeze, liveTranscript]);

  const squeezeFromPaste = useCallback((text) => {
    const t = text.trim();
    if (!t) return;
    finalRef.current = t;
    setLiveTranscript(t);
    setElapsed(0);
    setPasteMode(false);
    doSqueeze(t);
  }, [doSqueeze]);

  const saveSession = useCallback(() => {
    const transcript = finalRef.current.trim() || liveTranscript.trim();
    const session = {
      id: genId(), title: titleOf(transcript), date: new Date().toISOString(),
      duration: elapsed, transcript, squeeze: currentSqueeze,
      squeezeFormat: settings.squeezeFormat,
      wordCount: wc(transcript), squeezeWordCount: wc(currentSqueeze),
    };
    const updated = [session, ...sessions];
    setSessions(updated);
    LS.sessions.save(updated);
    finalRef.current = "";
    setLiveTranscript("");
    setCurrentSqueeze(null);
    setElapsed(0);
    setRecStatus("idle");
    setTab("sessions");
  }, [sessions, liveTranscript, elapsed, currentSqueeze, settings]);

  const discard = useCallback(() => {
    isRecordingRef.current = false;
    if (recognitionRef.current) { recognitionRef.current.abort(); recognitionRef.current = null; }
    clearInterval(timerRef.current);
    finalRef.current = "";
    setLiveTranscript("");
    setCurrentSqueeze(null);
    setSqueezeError(null);
    setElapsed(0);
    setRecStatus("idle");
    setPasteMode(false);
    setPasteText("");
  }, []);

  const deleteSession = useCallback((id) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    LS.sessions.save(updated);
  }, [sessions]);

  const saveSettings = useCallback((s) => { setSettings(s); LS.settings.save(s); }, []);
  const clearAll     = useCallback(() => { setSessions([]); LS.sessions.save([]); }, []);

  const hasKey     = settings.provider === "anthropic" ? !!settings.anthropicKey : !!settings.groqKey;
  const totalWords = sessions.reduce((acc, s) => acc + (s.wordCount || 0), 0);
  const lastSession = sessions.length > 0 ? sessions[0].date : null;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: C.bg }}>
      <Header tab={tab} setTab={setTab} sessionCount={sessions.length} totalWords={totalWords} lastSession={lastSession} />
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {tab === "record" && (
          <RecordView
            recStatus={recStatus} liveTranscript={liveTranscript} elapsed={elapsed}
            currentSqueeze={currentSqueeze} squeezeError={squeezeError}
            settings={settings} hasKey={hasKey}
            pasteMode={pasteMode} pasteText={pasteText}
            setPasteMode={setPasteMode} setPasteText={setPasteText}
            onStart={startRecording} onStop={stopRecording}
            onSqueeze={squeezeTranscript} onPasteSqueeze={squeezeFromPaste}
            onSave={saveSession} onDiscard={discard}
          />
        )}
        {tab === "sessions" && (
          <SessionsView sessions={sessions} onOpenSession={setSelectedSession} onDeleteSession={deleteSession} />
        )}
        {tab === "settings" && (
          <SettingsView settings={settings} onSave={saveSettings} onClearAll={clearAll} />
        )}
      </div>
      {selectedSession && (
        <SessionModal session={selectedSession} onClose={() => setSelectedSession(null)} onDelete={deleteSession} />
      )}
    </div>
  );
}
