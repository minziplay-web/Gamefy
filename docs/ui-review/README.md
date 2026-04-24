# UI Review Workflow

Diese Preview-Routen und Screenshots sind fuer wiederholbare UI-Pruefungen gedacht.

## Lokaler Ablauf

1. Dev-Server auf Preview-Port starten:
```bash
npm run dev -- --port 3100
```

2. Alle Preview-Routen pruefen:
```bash
npm run preview:smoke
```

3. Frische Screenshots erzeugen:
```bash
npm run ui:capture
```

## Ordner

- `before/`
  - historischer Vergleichsstand
  - kann aelter und unvollstaendig gegenueber der aktuellen Preview-Matrix sein
- `after/`
  - aktueller Stand nach neuen UI-/UX- oder Ops-Aenderungen
  - sollte nach `npm run ui:capture` die vollstaendige aktuelle Preview-Matrix enthalten

## Abdeckung

Die Preview-Routen decken aktuell ab:
- Home
- Daily
- Lobby
- Profil
- Admin
- Onboarding

inklusive wichtiger Sonderzustaende wie:
- loading
- error
- no-run / no-daily
- unplayable / incomplete
- finished / warning / forbidden

## Hinweis

`preview:smoke` prueft die Preview-Routen in einem echten Browserlauf:
- HTTP-Status
- Hydration-/Page-Errors
- Console-Errors

`ui:capture` ist die visuelle Ebene darueber:
- mobile Viewport
- feste Varianten
- wiederholbare Artefakte fuer Review mit Claude oder manuellem Vergleich
- faellt jetzt auch mit Fehlerstatus, wenn einzelne Captures scheitern
