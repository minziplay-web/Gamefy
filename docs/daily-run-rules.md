# Daily-Run Auswahl-Regeln

## Regel: Max 1 Frage pro Kategorie pro Daily

Ein Daily-Run darf hoechstens **eine** Frage pro Kategorie enthalten.

### Konsequenzen

- Bei `dailyQuestionCount = 5` muss der Run 5 Fragen aus 5 **verschiedenen** Kategorien ziehen.
- Bei `dailyQuestionCount = 10` (= alle Kategorien) wird der Run automatisch genau 1 Frage pro Kategorie haben.
- Bei `dailyQuestionCount > 10` ist das Limit nicht erreichbar. Backend sollte:
  - a) clampen auf 10 (sicherer Default), oder
  - b) im Admin-Config-Form die Obergrenze auf 10 setzen
  - c) eine klare Fehlermeldung werfen, wenn mehr als 10 verlangt werden

### Wo zu implementieren

- `src/lib/firebase/admin-actions.ts` — `createDailyRun()` und `replaceDailyRun()`:
  - Pool nach aktiven Fragen mit `targetMode in ["daily", "both"]` filtern
  - Nach Kategorie gruppieren
  - Pro Kategorie **eine** zufaellige Frage picken
  - `questionCount` Kategorien zufaellig auswaehlen
  - Falls pro Kategorie nicht genug Fragen vorhanden sind (z. B. Kategorie komplett leer), diese Kategorie ueberspringen — **kein** Duplikat aus derselben Kategorie einsetzen

### Hintergrund

Grund: Konsistente Variabilitaet der Tagesfragen. Ohne diese Regel kann ein Run
zufaellig 3 "hot_takes" + 2 "dirty" ergeben — fuer die Gruppe langweilig und
ueberladen. Mit der Regel garantieren wir maximale Kategorien-Breite pro Tag.

### UI-Auswirkung

Keine. Die Admin-Config gibt weiterhin `dailyQuestionCount` ein, das Backend
regelt die Auswahl. Evtl. im Admin-Config-Form Max auf 10 begrenzen (Stepper
`max={10}` statt `max={20}`) — kann ich liefern, sobald der Cap final ist.

### Diagnostik

`diagnostics.todayDaily.counts.runItems` bleibt gleich, aber bei Cap-Clamping
sollte das Diagnostics-Modul einen **warning**-Issue ausgeben:

```ts
{
  severity: "warning",
  code: "daily_count_capped_to_categories",
  message: "Es gibt nur X aktive Kategorien. Der Run wurde auf X Fragen begrenzt."
}
```
