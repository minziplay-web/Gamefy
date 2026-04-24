"use client";

import { useEffect, useState } from "react";

import type { CountdownTiming } from "@/lib/types/frontend";

export interface CountdownValue {
  remainingSec: number;
  remainingMs: number;
  elapsedSec: number;
  progress: number;
  expired: boolean;
}

export function computeCountdown(
  timing: CountdownTiming,
  nowMs: number = Date.now(),
): CountdownValue {
  const totalMs = timing.durationSec * 1000;
  const elapsedMs = Math.max(0, nowMs - timing.phaseStartedAtMs);
  const remainingMs = Math.max(0, totalMs - elapsedMs);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const progress = totalMs === 0 ? 1 : Math.min(1, elapsedMs / totalMs);

  return {
    remainingSec,
    remainingMs,
    elapsedSec,
    progress,
    expired: remainingMs <= 0,
  };
}

export function useCountdown(timing: CountdownTiming | null): CountdownValue | null {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!timing) return;

    const id = window.setInterval(() => {
      setTick((t) => t + 1);
    }, 200);

    return () => {
      window.clearInterval(id);
    };
  }, [timing]);

  return timing ? computeCountdown(timing) : null;
}
