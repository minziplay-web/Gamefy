"use client";

export function MemeImage({
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
              WebkitTextStroke: "2.5px black",
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
