"use client";

import { useCountdown } from "@/lib/mapping/countdown";
import type { CountdownTiming } from "@/lib/types/frontend";

export function CountdownRing({
  timing,
  size = 96,
  stroke = 8,
}: {
  timing: CountdownTiming;
  size?: number;
  stroke?: number;
}) {
  const value = useCountdown(timing);
  const remaining = value?.remainingSec ?? timing.durationSec;
  const progress = value?.progress ?? 0;

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * progress;

  const urgent = remaining <= 5 && !value?.expired;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-sand-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={`transition-[stroke-dashoffset,color] duration-300 ease-out ${
            urgent ? "text-coral-strong" : "text-coral"
          }`}
        />
      </svg>
      <span
        className={`absolute text-2xl font-semibold tabular-nums transition-colors duration-300 ${
          urgent ? "text-coral-strong" : "text-sand-900"
        } ${urgent ? "animate-pulse" : ""}`}
      >
        {remaining}
      </span>
    </div>
  );
}

export function CountdownBar({
  timing,
  className = "",
}: {
  timing: CountdownTiming;
  className?: string;
}) {
  const value = useCountdown(timing);
  const progress = value?.progress ?? 0;

  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-sand-100 ${className}`}
    >
      <div
        className="h-full rounded-full bg-coral transition-[width] duration-200 ease-linear"
        style={{ width: `${Math.min(100, progress * 100)}%` }}
      />
    </div>
  );
}
