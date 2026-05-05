"use client";

import { useState } from "react";

/**
 * Floating Bell-Button im Top-Right der App. Bewusst KEIN Page-Title hier — den
 * liefern die existierenden ScreenHeader-Komponenten der Pages selbst, bis
 * Stages 1-3 die Pages neu bauen. Nach Stage 1-3 kann das hier zur vollwertigen
 * TopBar mit Title ausgebaut werden.
 */
export function TopBar() {
  const [hasUnseen] = useState(true);

  return (
    <button
      type="button"
      className="fixed right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sand-900 shadow-sm backdrop-blur ring-1 ring-sand-200/60"
      aria-label="Tageslog"
      onClick={() => {
        // TODO Stage 4: Notification-Panel öffnen
      }}
    >
      <BellIcon />
      {hasUnseen ? (
        <span
          className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full"
          style={{
            backgroundColor: "#E5594F",
            boxShadow: "0 0 0 2px #FFFFFF",
          }}
        />
      ) : null}
    </button>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
      <path
        d="M5.5 17.5h13M7.2 17.5V11a4.8 4.8 0 0 1 9.6 0v6.5M10.4 20.5a1.8 1.8 0 0 0 3.2 0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
