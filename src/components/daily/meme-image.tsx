"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function MemeImage({
  imagePath,
  caption,
}: {
  imagePath: string;
  caption?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const modal = open ? (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-2"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Meme-Vollansicht"
    >
      <div
        className="relative flex max-h-full max-w-full"
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagePath}
          alt="Meme-Vorlage"
          className="block max-h-[95dvh] max-w-[100vw] select-none object-contain"
          draggable={false}
        />
        {caption ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-3">
            <p
              className="text-center uppercase"
              style={{
                fontFamily:
                  '"Arial Black", "Helvetica Black", "Helvetica Neue", system-ui, sans-serif',
                fontSize: "clamp(20px, 4.5vw, 44px)",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "0.01em",
                color: "white",
                WebkitTextStroke: "0.16em black",
                paintOrder: "stroke fill",
                wordBreak: "break-word",
              }}
            >
              {caption}
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-2 top-2 inline-flex size-10 items-center justify-center rounded-full bg-white/95 text-lg font-bold text-sand-900 shadow-card-raised transition hover:bg-white"
          aria-label="Schließen"
        >
          ✕
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in"
        aria-label="Meme vergrößern"
      >
        <MemeFigure imagePath={imagePath} caption={caption} />
      </button>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}

function MemeFigure({
  imagePath,
  caption,
}: {
  imagePath: string;
  caption?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-sand-200 bg-sand-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagePath}
        alt="Meme-Vorlage"
        className="mx-auto block max-h-[42vh] w-full select-none object-contain"
        draggable={false}
      />
      {caption ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-3">
          <p
            className="text-center uppercase"
            style={{
              fontFamily:
                '"Arial Black", "Helvetica Black", "Helvetica Neue", system-ui, sans-serif',
              fontSize: "clamp(14px, 3.8vw, 22px)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "0.01em",
              color: "white",
              WebkitTextStroke: "0.18em black",
              paintOrder: "stroke fill",
              wordBreak: "break-word",
            }}
          >
            {caption}
          </p>
        </div>
      ) : null}
    </div>
  );
}
