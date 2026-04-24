import type { DateKey } from "@/lib/types/frontend";

const BERLIN_TZ = "Europe/Berlin";

export function berlinDateKey(date: Date = new Date()): DateKey {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BERLIN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  return `${map.year}-${map.month}-${map.day}`;
}

export function compareDateKeys(left: DateKey, right: DateKey) {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

export function isAfterBerlinDayEnd(dateKey: DateKey, now: Date = new Date()): boolean {
  return compareDateKeys(berlinDateKey(now), dateKey) > 0;
}

export function formatBerlinDateLabel(
  dateKey: DateKey,
  locale: string = "de-DE",
): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  return new Intl.DateTimeFormat(locale, {
    timeZone: BERLIN_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(utcDate);
}

export function shiftDateKey(dateKey: DateKey, dayOffset: number): DateKey {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day + dayOffset, 12, 0, 0));
  return berlinDateKey(utcDate);
}

export function toIsoString(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return ((value as { toDate: () => Date }).toDate()).toISOString();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return new Date((value as { toMillis: () => number }).toMillis()).toISOString();
  }

  return null;
}
