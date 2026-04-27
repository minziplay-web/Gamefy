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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-3 pb-3">
          <span
            className="text-center font-black uppercase leading-tight text-white"
            style={{
              fontFamily:
                "Impact, 'Haettenschweiler', 'Arial Narrow Bold', 'Anton', sans-serif",
              fontSize: "clamp(20px, 6.5vw, 38px)",
              letterSpacing: "0.02em",
              wordBreak: "break-word",
              WebkitTextStroke: "1.5px black",
              textShadow:
                "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 4px rgba(0,0,0,0.5)",
            }}
          >
            {caption}
          </span>
        </div>
      ) : null}
    </div>
  );
}
