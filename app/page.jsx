"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Design Tokens — GSD Suite Palette ───────────────────────────────────────
const C = {
  dark:      "#0f172a",
  darkMid:   "#1e293b",
  darkSub:   "#334155",
  bg:        "#f8fafc",
  white:     "#ffffff",
  border:    "#e2e8f0",
  borderMd:  "#cbd5e1",
  text:      "#0f172a",
  text2:     "#475569",
  text3:     "#94a3b8",
  text4:     "#64748b",
  red:       "#ef4444",  redBg:     "#fef2f2",  redBd:    "#fecaca",
  amber:     "#b45309",  amberBg:   "#fffbeb",  amberBd:  "#fde68a",
  blue:      "#0891b2",  blueBg:    "#e0f9ff",  blueBd:   "#bae6fd",
  indigo:    "#6366f1",  indigoBg:  "#eef2ff",  indigoBd: "#c7d2fe",
  green:     "#059669",  greenBg:   "#ecfdf5",  greenBd:  "#a7f3d0",
  purple:    "#7c3aed",  purpleBg:  "#faf5ff",  purpleBd: "#ddd6fe",
};
const FONT = "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "var(--font-mono), 'Fira Code', 'Courier New', monospace";

// ─── Utilities ────────────────────────────────────────────────────────────────
function fmt(n)          { return Number(n || 0).toLocaleString(); }
function wc(t)           { return t ? t.trim().split(/\s+/).filter(Boolean).length : 0; }
function fmtSec(s)       { const m = Math.floor(s / 60); return `${m}:${(s % 60).toString().padStart(2, "0")}`; }
function genId()         { return `ms_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }
function titleOf(t)      {
  if (!t) return "Untitled Session";
  const s = t.trim().split(/[.!?\n]/)[0].trim();
  return s.length > 65 ? s.slice(0, 65) + "…" : s || "Untitled Session";
}
function fmtDate(iso)    {
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
  anthropicKey:  "",
  squeezeFormat: "bullets",
  model:         "claude-sonnet-4-6",
};

const LS = {
  sessions: {
    load: () => { try { return JSON.parse(localStorage.getItem("ms_sessions") || "[]"); } catch { return []; } },
    save: (s) => { try { localStorage.setItem("ms_sessions", JSON.stringify(s)); } catch {} },
  },
  settings: {
    load: () => { try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem("ms_settings") || "{}") }; } catch { return DEFAULT_SETTINGS; } },
    save: (s) => { try { localStorage.setItem("ms_settings", JSON.stringify(s)); } catch {} },
  },
};

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ tab, setTab, sessionCount, totalWords, lastSession }) {
  const stats = [
    { label: "Sessions",      value: sessionCount || 0,               color: sessionCount > 0 ? "#38bdf8" : C.text4 },
    { label: "Words Captured", value: totalWords > 0 ? fmt(totalWords) : 0, color: totalWords > 0 ? "#fde047" : C.text4 },
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
          <span style={{ fontSize: 15, fontWeight: 800, color: C.white, fontFamily: MONO, letterSpacing: "-0.02em" }}>
            MeetingSqueeze
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.text3, background: C.darkMid, padding: "2px 7px", borderRadius: 4, fontFamily: MONO, letterSpacing: "0.04em" }}>
            GSD SUITE
          </span>
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
function RecordView({ recStatus, liveTranscript, elapsed, currentSqueeze, squeezeError, settings, onStart, onStop, onSqueeze, onSave, onDiscard }) {
  const [transcriptTab, setTranscriptTab] = useState("transcript");
  const transcriptRef = useRef(null);

  useEffect(() => {
    if (transcriptRef.current && recStatus === "recording") {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [liveTranscript, recStatus]);

  useEffect(() => {
    if (currentSqueeze) setTranscriptTab("squeeze");
  }, [currentSqueeze]);

  const words = wc(liveTranscript);
  const sqWords = wc(currentSqueeze);
  const compression = ratio(liveTranscript, currentSqueeze);

  const statusMeta = {
    idle:      { color: C.text3,   bg: C.bg,       label: "Ready" },
    starting:  { color: C.amber,   bg: C.amberBg,  label: "Starting…" },
    recording: { color: C.red,     bg: C.redBg,    label: "Recording" },
    captured:  { color: C.blue,    bg: C.blueBg,   label: "Captured" },
    squeezing: { color: C.purple,  bg: C.purpleBg, label: "Squeezing…" },
    squeezed:  { color: C.green,   bg: C.greenBg,  label: "Squeezed" },
  }[recStatus] || { color: C.text3, bg: C.bg, label: recStatus };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* ── Left: Controls ─────────────────────────────────────────────── */}
      <div style={{ width: 320, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Status badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {recStatus === "recording" && (
              <span className="rec-dot" style={{ width: 10, height: 10, borderRadius: "50%", background: C.red, flexShrink: 0, display: "inline-block" }} />
            )}
            {recStatus === "squeezing" && (
              <span className="spin" style={{ width: 14, height: 14, border: `2px solid ${C.purpleBd}`, borderTopColor: C.purple, borderRadius: "50%", flexShrink: 0, display: "inline-block" }} />
            )}
            <span style={{ fontSize: 11, fontWeight: 700, color: statusMeta.color, background: statusMeta.bg, padding: "3px 10px", borderRadius: 5, fontFamily: MONO, letterSpacing: "0.06em" }}>
              {statusMeta.label.toUpperCase()}
            </span>
          </div>

          {/* Idle: start controls */}
          {recStatus === "idle" && (
            <>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FONT, marginBottom: 6 }}>Capture Mode</div>
                <div style={{ fontSize: 12, color: C.text2, fontFamily: FONT, lineHeight: 1.6 }}>
                  Microphone input via Web Speech API. Put your meeting on speaker — the mic picks up both your voice and call audio.
                </div>
              </div>

              <button onClick={onStart} style={{
                padding: "14px 20px", background: C.green, color: C.white, border: "none",
                borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: MONO,
                letterSpacing: "0.06em", boxShadow: `0 2px 10px ${C.greenBd}`,
                transition: "box-shadow .15s, transform .1s",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 18px ${C.greenBd}`; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 2px 10px ${C.greenBd}`; e.currentTarget.style.transform = "none"; }}>
                ● START CAPTURE
              </button>

              <div style={{ padding: 14, background: C.indigoBg, border: `1px solid ${C.indigoBd}`, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.indigo, fontFamily: MONO, marginBottom: 8, letterSpacing: "0.05em" }}>TIPS</div>
                {[
                  "Use Chrome or Edge for best results",
                  "Put your call on speaker — mic picks up both sides",
                  "Screen share audio mode coming in v2",
                  "Browser will ask mic permission on first use",
                ].map((tip, i) => (
                  <div key={i} style={{ fontSize: 11, color: C.indigo, fontFamily: FONT, lineHeight: 1.6, display: "flex", gap: 6, marginBottom: 3 }}>
                    <span style={{ flexShrink: 0 }}>→</span><span>{tip}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Recording: live stats + stop */}
          {recStatus === "recording" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Duration", value: fmtSec(elapsed) },
                  { label: "Words",    value: fmt(words) },
                ].map(s => (
                  <div key={s.label} style={{ background: C.redBg, border: `1px solid ${C.redBd}`, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.red, fontFamily: MONO }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: C.text3, fontFamily: FONT, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <button onClick={onStop} style={{
                padding: "14px 20px", background: C.red, color: C.white, border: "none",
                borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: MONO,
                letterSpacing: "0.06em", boxShadow: `0 2px 10px ${C.redBd}`,
                transition: "box-shadow .15s, transform .1s",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 18px ${C.redBd}`; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 2px 10px ${C.redBd}`; e.currentTarget.style.transform = "none"; }}>
                ■ STOP CAPTURE
              </button>

              <div style={{ fontSize: 11, color: C.text3, fontFamily: MONO, textAlign: "center" }}>
                🎙 Listening…
              </div>
            </>
          )}

          {/* Starting */}
          {recStatus === "starting" && (
            <div style={{ fontSize: 12, color: C.amber, fontFamily: MONO }}>Requesting microphone access…</div>
          )}

          {/* Captured: squeeze CTA */}
          {recStatus === "captured" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Duration", value: fmtSec(elapsed) },
                  { label: "Words",    value: fmt(words) },
                ].map(s => (
                  <div key={s.label} style={{ background: C.blueBg, border: `1px solid ${C.blueBd}`, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.blue, fontFamily: MONO }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: C.text3, fontFamily: FONT, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {!settings.anthropicKey && (
                <div style={{ padding: "10px 14px", background: C.amberBg, border: `1px solid ${C.amberBd}`, borderRadius: 8, fontSize: 11, color: C.amber, fontFamily: FONT, lineHeight: 1.6 }}>
                  Add your Anthropic API key in Settings to enable the Squeeze feature.
                </div>
              )}

              {squeezeError && (
                <div style={{ padding: "10px 14px", background: C.redBg, border: `1px solid ${C.redBd}`, borderRadius: 8, fontSize: 11, color: C.red, fontFamily: FONT, lineHeight: 1.6 }}>
                  {squeezeError}
                </div>
              )}

              <button onClick={onSqueeze} disabled={!settings.anthropicKey} style={{
                padding: "14px 20px",
                background: settings.anthropicKey ? C.indigo : C.border,
                color: settings.anthropicKey ? C.white : C.text3,
                border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700,
                cursor: settings.anthropicKey ? "pointer" : "not-allowed",
                fontFamily: MONO, letterSpacing: "0.06em",
                boxShadow: settings.anthropicKey ? `0 2px 10px ${C.indigoBd}` : "none",
                transition: "box-shadow .15s, transform .1s",
              }}
              onMouseEnter={e => { if (settings.anthropicKey) { e.currentTarget.style.boxShadow = `0 4px 18px ${C.indigoBd}`; e.currentTarget.style.transform = "translateY(-1px)"; }}}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = settings.anthropicKey ? `0 2px 10px ${C.indigoBd}` : "none"; e.currentTarget.style.transform = "none"; }}>
                ✦ SQUEEZE IT
              </button>

              <button onClick={onDiscard} style={{
                padding: "8px 20px", background: "transparent", color: C.text3, border: `1px solid ${C.border}`,
                borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: MONO,
              }}>
                Discard & Start Over
              </button>
            </>
          )}

          {/* Squeezing */}
          {recStatus === "squeezing" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Duration", value: fmtSec(elapsed) },
                  { label: "Words",    value: fmt(words) },
                ].map(s => (
                  <div key={s.label} style={{ background: C.purpleBg, border: `1px solid ${C.purpleBd}`, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.purple, fontFamily: MONO }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: C.text3, fontFamily: FONT, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "14px", background: C.purpleBg, border: `1px solid ${C.purpleBd}`, borderRadius: 8, fontSize: 12, color: C.purple, fontFamily: MONO, textAlign: "center" }}>
                Running Claude…<br />
                <span style={{ fontSize: 10, color: C.text3, fontFamily: FONT }}>Model: {settings.model}</span>
              </div>
            </>
          )}

          {/* Squeezed: save */}
          {recStatus === "squeezed" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Duration",    value: fmtSec(elapsed),                         color: C.green,  bg: C.greenBg,  bd: C.greenBd },
                  { label: "Raw Words",   value: fmt(words),                               color: C.blue,   bg: C.blueBg,   bd: C.blueBd },
                  { label: "Squeezed",    value: fmt(sqWords),                             color: C.indigo, bg: C.indigoBg, bd: C.indigoBd },
                  { label: "Compression", value: compression ? `${compression}%` : "—",   color: C.purple, bg: C.purpleBg, bd: C.purpleBd },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.bd}`, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: MONO }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: C.text3, fontFamily: FONT, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <button onClick={onSave} style={{
                padding: "14px 20px", background: C.green, color: C.white, border: "none",
                borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: MONO,
                letterSpacing: "0.06em", boxShadow: `0 2px 10px ${C.greenBd}`,
                transition: "box-shadow .15s, transform .1s",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 18px ${C.greenBd}`; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 2px 10px ${C.greenBd}`; e.currentTarget.style.transform = "none"; }}>
                ✓ SAVE SESSION
              </button>

              <button onClick={onDiscard} style={{
                padding: "8px 20px", background: "transparent", color: C.text3, border: `1px solid ${C.border}`,
                borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: MONO,
              }}>
                Discard & Start Over
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Right: Transcript / Squeeze ────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Tabs (shown when there's content) */}
        {(liveTranscript || currentSqueeze) && (
          <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.white, flexShrink: 0, padding: "0 20px", gap: 2 }}>
            {[
              { id: "transcript", label: `Transcript  ${words > 0 ? fmt(words) + " words" : ""}`.trim() },
              { id: "squeeze",    label: "Squeeze", disabled: !currentSqueeze },
            ].map(t => (
              <button key={t.id} onClick={() => !t.disabled && setTranscriptTab(t.id)} style={{
                padding: "10px 16px",
                background: "transparent", border: "none",
                borderBottom: transcriptTab === t.id ? `2px solid ${transcriptTab === t.id && t.id === "squeeze" ? C.indigo : C.blue}` : "2px solid transparent",
                color: t.disabled ? C.borderMd : transcriptTab === t.id ? (t.id === "squeeze" ? C.indigo : C.blue) : C.text3,
                fontFamily: MONO, fontSize: 11, fontWeight: 700, cursor: t.disabled ? "default" : "pointer",
                letterSpacing: "0.04em", marginBottom: -1, transition: "color .15s",
              }}>
                {t.label}
              </button>
            ))}
            {currentSqueeze && transcriptTab === "squeeze" && (
              <button onClick={() => { navigator.clipboard.writeText(currentSqueeze).catch(() => {}); }}
                style={{ marginLeft: "auto", padding: "8px 14px", background: C.indigoBg, border: `1px solid ${C.indigoBd}`, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", color: C.indigo, fontFamily: MONO, alignSelf: "center" }}>
                Copy
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div ref={transcriptRef} style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {/* Idle empty state */}
          {recStatus === "idle" && !liveTranscript && (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: C.text3 }}>
              <div style={{ fontSize: 40 }}>🎙</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text2, fontFamily: FONT, marginBottom: 6 }}>Ready to capture</div>
                <div style={{ fontSize: 12, fontFamily: FONT, lineHeight: 1.7, maxWidth: 380, textAlign: "center" }}>
                  Hit Start Capture, put your meeting on speaker, and start talking. Transcript builds in real time — then Squeeze it down to the key business points.
                </div>
              </div>
            </div>
          )}

          {/* Live transcript */}
          {recStatus === "recording" && (
            <div style={{ fontSize: 14, fontFamily: FONT, lineHeight: 1.8, color: C.text, whiteSpace: "pre-wrap" }}>
              {liveTranscript || <span style={{ color: C.text3, fontStyle: "italic" }}>Waiting for speech…</span>}
            </div>
          )}

          {/* Captured/squeezing/squeezed: show transcript or squeeze */}
          {["captured", "squeezing", "squeezed"].includes(recStatus) && (
            <>
              {transcriptTab === "transcript" && (
                <div style={{ fontSize: 13, fontFamily: FONT, lineHeight: 1.8, color: C.text, whiteSpace: "pre-wrap" }}>
                  {liveTranscript}
                </div>
              )}
              {transcriptTab === "squeeze" && currentSqueeze && (
                <div className="fade-in" style={{ fontSize: 14, fontFamily: FONT, lineHeight: 1.85, color: C.text, whiteSpace: "pre-wrap", maxWidth: 720 }}>
                  {currentSqueeze}
                </div>
              )}
              {transcriptTab === "squeeze" && recStatus === "squeezing" && !currentSqueeze && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.purple, fontFamily: MONO, fontSize: 12 }}>
                  <span className="spin" style={{ width: 16, height: 16, border: `2px solid ${C.purpleBd}`, borderTopColor: C.purple, borderRadius: "50%", flexShrink: 0, display: "inline-block" }} />
                  Compressing transcript…
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({ session, onOpen, onDelete }) {
  const [hover, setHover] = useState(false);
  const r = ratio(session.transcript, session.squeeze);

  return (
    <div onClick={() => onOpen(session)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.white,
        border: `1.5px solid ${hover ? C.borderMd : C.border}`,
        borderRadius: 10, padding: "14px 16px", cursor: "pointer",
        boxShadow: hover ? "0 4px 14px rgba(0,0,0,0.09)" : "0 1px 3px rgba(0,0,0,0.05)",
        transform: hover ? "translateY(-1px)" : "none",
        transition: "box-shadow .15s, transform .12s, border-color .15s",
      }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FONT, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session.title}
          </div>
          <div style={{ fontSize: 11, color: C.text3, fontFamily: MONO, marginTop: 3 }}>
            {fmtDateShort(session.date)} · {fmtSec(session.duration)} · {fmt(session.wordCount)} words
            {r ? <span style={{ color: C.indigo }}> · {r}% compressed</span> : ""}
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); if (window.confirm("Delete this session?")) onDelete(session.id); }}
          style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 16, lineHeight: 1, padding: "2px 4px", borderRadius: 4 }}
          onMouseEnter={e => e.currentTarget.style.color = C.red}
          onMouseLeave={e => e.currentTarget.style.color = C.text3}>
          ×
        </button>
      </div>

      {session.squeeze && (
        <div style={{ fontSize: 11, color: C.text2, fontFamily: FONT, lineHeight: 1.55, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
          {session.squeeze}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
        {session.squeeze ? (
          <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.greenBg, padding: "2px 8px", borderRadius: 4, fontFamily: MONO }}>✓ Squeezed</span>
        ) : (
          <span style={{ fontSize: 10, fontWeight: 700, color: C.text3, background: C.bg, padding: "2px 8px", borderRadius: 4, fontFamily: MONO, border: `1px solid ${C.border}` }}>Transcript only</span>
        )}
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
    const q = search.toLowerCase();
    return (s.title + s.transcript + (s.squeeze || "")).toLowerCase().includes(q);
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "10px 20px", flexShrink: 0 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search sessions…"
          style={{ width: "100%", maxWidth: 480, padding: "8px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: FONT, color: C.text, background: C.bg, outline: "none" }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {sessions.length === 0 ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: C.text3 }}>
            <div style={{ fontSize: 36 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text2 }}>No sessions yet</div>
            <div style={{ fontSize: 12, fontFamily: FONT, color: C.text3 }}>Record and save a session to see it here.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: C.text3, fontSize: 13, fontFamily: MONO }}>No sessions match "{search}"</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 760 }}>
            {filtered.map(s => (
              <SessionCard key={s.id} session={s} onOpen={onOpenSession} onDelete={onDeleteSession} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Session Modal ────────────────────────────────────────────────────────────
function SessionModal({ session, onClose, onDelete }) {
  const [activeTab, setActiveTab] = useState(session.squeeze ? "squeeze" : "transcript");
  const r = ratio(session.transcript, session.squeeze);

  const copy = (text) => { navigator.clipboard.writeText(text).catch(() => {}); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
      <div className="fade-in" style={{ background: C.white, borderRadius: 12, width: "100%", maxWidth: 780, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        {/* Modal header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: FONT, marginBottom: 4 }}>{session.title}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { label: fmtDate(session.date),        color: C.text3 },
                  { label: fmtSec(session.duration),     color: C.text3 },
                  { label: `${fmt(session.wordCount)} words`, color: C.blue },
                  ...(r ? [{ label: `${r}% compressed`, color: C.indigo }] : []),
                ].map((b, i) => (
                  <span key={i} style={{ fontSize: 11, color: b.color, fontFamily: MONO }}>{b.label}</span>
                ))}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 20, lineHeight: 1, padding: 4, flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.text3}>×</button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, marginTop: 12 }}>
            {[
              { id: "squeeze", label: "Squeeze", disabled: !session.squeeze },
              { id: "transcript", label: `Transcript  ${fmt(session.wordCount)} words` },
            ].map(t => (
              <button key={t.id} onClick={() => !t.disabled && setActiveTab(t.id)} style={{
                padding: "7px 14px", background: "transparent", border: "none",
                borderBottom: activeTab === t.id ? `2px solid ${t.id === "squeeze" ? C.indigo : C.blue}` : "2px solid transparent",
                color: t.disabled ? C.borderMd : activeTab === t.id ? (t.id === "squeeze" ? C.indigo : C.blue) : C.text3,
                fontFamily: MONO, fontSize: 11, fontWeight: 700, cursor: t.disabled ? "default" : "pointer",
                marginBottom: -1,
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <div style={{ fontSize: 13, fontFamily: FONT, lineHeight: 1.85, color: C.text, whiteSpace: "pre-wrap", maxWidth: 680 }}>
            {activeTab === "squeeze" ? session.squeeze : session.transcript}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, flexShrink: 0 }}>
          {session.squeeze && (
            <button onClick={() => copy(session.squeeze)} style={{ padding: "8px 16px", background: C.indigoBg, border: `1px solid ${C.indigoBd}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.indigo, fontFamily: MONO }}>
              Copy Squeeze
            </button>
          )}
          <button onClick={() => copy(session.transcript)} style={{ padding: "8px 16px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", color: C.text2, fontFamily: MONO }}>
            Copy Transcript
          </button>
          <div style={{ marginLeft: "auto" }}>
            <button onClick={() => { if (window.confirm("Delete this session?")) { onDelete(session.id); onClose(); } }}
              style={{ padding: "8px 16px", background: C.redBg, border: `1px solid ${C.redBd}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.red, fontFamily: MONO }}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────
function SettingsView({ settings, onSave, onClearAll }) {
  const [draft, setDraft] = useState({ ...settings });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const upd = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const save = () => {
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inp = {
    width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8,
    fontSize: 13, fontFamily: FONT, color: C.text, background: C.bg, outline: "none",
    boxSizing: "border-box",
  };
  const lbl = { display: "block", fontSize: 12, fontWeight: 700, color: C.text, fontFamily: FONT, marginBottom: 6 };
  const section = { padding: 20, background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 16 };

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: 24 }}>
      <div style={{ maxWidth: 580 }}>

        {/* API Key */}
        <div style={section}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT, marginBottom: 4 }}>Anthropic API Key</div>
          <div style={{ fontSize: 12, color: C.text3, fontFamily: FONT, marginBottom: 14, lineHeight: 1.6 }}>
            Required for the Squeeze feature. Get your key at console.anthropic.com. Stored locally in your browser only.
          </div>
          <label style={lbl}>API Key</label>
          <div style={{ position: "relative" }}>
            <input
              type={showKey ? "text" : "password"}
              value={draft.anthropicKey}
              onChange={e => upd("anthropicKey", e.target.value)}
              placeholder="sk-ant-…"
              style={{ ...inp, paddingRight: 70 }}
            />
            <button onClick={() => setShowKey(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: C.text3, fontFamily: MONO }}>
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
          {draft.anthropicKey && (
            <div style={{ fontSize: 11, color: C.green, fontFamily: MONO, marginTop: 6 }}>✓ Key entered</div>
          )}
        </div>

        {/* Squeeze Format */}
        <div style={section}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT, marginBottom: 14 }}>Squeeze Format</div>
          {[
            { id: "bullets",   label: "Bullet Points",  desc: "Key points, decisions, and action items as • bullets. Fast to scan." },
            { id: "paragraph", label: "Paragraphs",      desc: "Dense prose summary in 2–3 compact paragraphs. Better for narrative flow." },
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

        {/* Model */}
        <div style={section}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT, marginBottom: 4 }}>Claude Model</div>
          <div style={{ fontSize: 12, color: C.text3, fontFamily: FONT, marginBottom: 14 }}>Sonnet is recommended — best balance of speed and quality for meeting compression.</div>
          <label style={lbl}>Model</label>
          <select value={draft.model} onChange={e => upd("model", e.target.value)} style={{ ...inp }}>
            <option value="claude-sonnet-4-6">claude-sonnet-4-6 (Recommended)</option>
            <option value="claude-haiku-4-5-20251001">claude-haiku-4-5 (Faster, lower cost)</option>
            <option value="claude-opus-4-7">claude-opus-4-7 (Highest quality)</option>
          </select>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={save} style={{
            padding: "10px 24px", background: saved ? C.green : C.indigo, color: C.white, border: "none",
            borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: MONO, letterSpacing: "0.04em",
            transition: "background .2s",
          }}>
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
  const [tab,            setTab]            = useState("record");
  const [sessions,       setSessions]       = useState([]);
  const [settings,       setSettings]       = useState(DEFAULT_SETTINGS);
  const [recStatus,      setRecStatus]      = useState("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [elapsed,        setElapsed]        = useState(0);
  const [currentSqueeze, setCurrentSqueeze] = useState(null);
  const [squeezeError,   setSqueezeError]   = useState(null);
  const [selectedSession,setSelectedSession]= useState(null);

  const recognitionRef  = useRef(null);
  const timerRef        = useRef(null);
  const finalRef        = useRef("");
  const isRecordingRef  = useRef(false);

  useEffect(() => {
    setSessions(LS.sessions.load());
    setSettings(LS.settings.load());
  }, []);

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
      if (isRecordingRef.current && restarts < 200) {
        restarts++;
        try { rec.start(); } catch {}
      }
    };

    rec.onerror = (e) => {
      if (e.error === "aborted" || e.error === "no-speech") return;
      console.warn("SpeechRecognition error:", e.error);
    };

    rec.start();
    recognitionRef.current = rec;
  }, []);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    clearInterval(timerRef.current);

    const text = finalRef.current.trim();
    setLiveTranscript(text || "");
    setRecStatus(text.length > 0 ? "captured" : "idle");
  }, []);

  const squeezeTranscript = useCallback(async () => {
    const transcript = finalRef.current.trim() || liveTranscript.trim();
    if (!transcript || !settings.anthropicKey) return;

    setRecStatus("squeezing");
    setSqueezeError(null);

    try {
      const res = await fetch("/api/squeeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, apiKey: settings.anthropicKey, format: settings.squeezeFormat, model: settings.model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setCurrentSqueeze(data.squeeze);
      setRecStatus("squeezed");
    } catch (err) {
      setSqueezeError(err.message);
      setRecStatus("captured");
    }
  }, [liveTranscript, settings]);

  const saveSession = useCallback(() => {
    const transcript = finalRef.current.trim() || liveTranscript.trim();
    const session = {
      id:               genId(),
      title:            titleOf(transcript),
      date:             new Date().toISOString(),
      duration:         elapsed,
      transcript,
      squeeze:          currentSqueeze,
      squeezeFormat:    settings.squeezeFormat,
      wordCount:        wc(transcript),
      squeezeWordCount: wc(currentSqueeze),
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
  }, []);

  const deleteSession = useCallback((id) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    LS.sessions.save(updated);
  }, [sessions]);

  const saveSettings = useCallback((s) => {
    setSettings(s);
    LS.settings.save(s);
  }, []);

  const clearAll = useCallback(() => {
    setSessions([]);
    LS.sessions.save([]);
  }, []);

  const totalWords = sessions.reduce((acc, s) => acc + (s.wordCount || 0), 0);
  const lastSession = sessions.length > 0 ? sessions[0].date : null;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: C.bg }}>
      <Header
        tab={tab} setTab={setTab}
        sessionCount={sessions.length}
        totalWords={totalWords}
        lastSession={lastSession}
      />

      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {tab === "record" && (
          <RecordView
            recStatus={recStatus}
            liveTranscript={liveTranscript}
            elapsed={elapsed}
            currentSqueeze={currentSqueeze}
            squeezeError={squeezeError}
            settings={settings}
            onStart={startRecording}
            onStop={stopRecording}
            onSqueeze={squeezeTranscript}
            onSave={saveSession}
            onDiscard={discard}
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
