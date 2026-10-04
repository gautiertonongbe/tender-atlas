"use client";
import { useState, useEffect } from "react";
import type { Lang } from "@/lib/lang";

function FlagFR({ size }: { size: number }) {
  const h = Math.round(size * 2 / 3);
  return (
    <svg width={size} height={h} viewBox="0 0 60 40" aria-hidden role="img"
      style={{ borderRadius: 3, boxShadow: "0 0 0 0.5px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.25)", display: "block", flexShrink: 0 }}>
      <rect width="20" height="40" x="0"  fill="#0055A4" />
      <rect width="20" height="40" x="20" fill="#FFFFFF" />
      <rect width="20" height="40" x="40" fill="#EF4135" />
    </svg>
  );
}

function FlagUS({ size }: { size: number }) {
  const h = Math.round(size * 2 / 3);
  return (
    <svg width={size} height={h} viewBox="0 0 60 40" aria-hidden role="img"
      style={{ borderRadius: 3, boxShadow: "0 0 0 0.5px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.25)", display: "block", flexShrink: 0 }}>
      <rect width="60" height="40" fill="#B22234" />
      <rect width="60" height="3.08" y="3.08"  fill="#FFFFFF" />
      <rect width="60" height="3.08" y="9.23"  fill="#FFFFFF" />
      <rect width="60" height="3.08" y="15.38" fill="#FFFFFF" />
      <rect width="60" height="3.08" y="21.54" fill="#FFFFFF" />
      <rect width="60" height="3.08" y="27.69" fill="#FFFFFF" />
      <rect width="60" height="3.08" y="33.85" fill="#FFFFFF" />
      <rect width="24" height="21.54" fill="#3C3B6E" />
      <g fill="#FFFFFF">
        <circle cx="4"  cy="4"     r="1.2" /><circle cx="12" cy="4"     r="1.2" /><circle cx="20" cy="4"     r="1.2" />
        <circle cx="4"  cy="10.77" r="1.2" /><circle cx="12" cy="10.77" r="1.2" /><circle cx="20" cy="10.77" r="1.2" />
        <circle cx="4"  cy="17.54" r="1.2" /><circle cx="12" cy="17.54" r="1.2" /><circle cx="20" cy="17.54" r="1.2" />
      </g>
    </svg>
  );
}

export function LangSwitcher({ lang }: { lang: Lang }) {
  const [hovered, setHovered] = useState<Lang | null>(null);
  const [current, setCurrent] = useState<Lang>(lang);

  useEffect(() => { setCurrent(lang); }, [lang]);

  function switchTo(next: Lang) {
    if (next === current) return;
    document.cookie = `lang=${next};path=/;max-age=31536000;SameSite=Lax`;
    setCurrent(next);
    location.reload();
  }

  return (
    <div
      role="group"
      aria-label="Language toggle / Sélecteur de langue"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        height: 34,
        padding: 3,
        borderRadius: 999,
        background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 16px -8px rgba(0,0,0,0.4)",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        flexShrink: 0,
      }}
    >
      {/* Sliding active indicator */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 3,
          left: current === "fr" ? 3 : "calc(50%)",
          width: "calc(50% - 3px)",
          height: "calc(100% - 6px)",
          borderRadius: 999,
          background: "linear-gradient(135deg, rgba(99,102,241,0.95) 0%, rgba(139,92,246,0.95) 100%)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset, 0 2px 8px -2px rgba(99,102,241,0.45)",
          transition: "left 0.28s cubic-bezier(0.65, 0, 0.35, 1)",
          pointerEvents: "none",
        }}
      />
      {(["fr", "en"] as Lang[]).map(code => {
        const active = current === code;
        const isHov = hovered === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchTo(code)}
            onMouseEnter={() => setHovered(code)}
            onMouseLeave={() => setHovered(null)}
            aria-pressed={active}
            aria-label={code === "fr" ? "Français" : "English"}
            title={code === "fr" ? "Français" : "English"}
            style={{
              position: "relative",
              zIndex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 44,
              height: 28,
              padding: "0 10px",
              borderRadius: 999,
              border: "none",
              background: "transparent",
              cursor: active ? "default" : "pointer",
              opacity: active ? 1 : isHov ? 0.92 : 0.55,
              transition: "opacity 0.18s ease, transform 0.18s ease",
              transform: !active && isHov ? "translateY(-0.5px)" : "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {code === "fr" ? <FlagFR size={20} /> : <FlagUS size={20} />}
          </button>
        );
      })}
    </div>
  );
}
