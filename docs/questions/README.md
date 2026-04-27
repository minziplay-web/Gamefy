# Fragen-Pool

Pro Kategorie eine JSON-Datei. Jede Datei ist ein Array von Fragen im
Import-Format des Admin-JSON-Imports.

## Dateien

| Datei | Anzahl |
|---|---|
| [career_life.json](career_life.json) | 17 |
| [conspiracy.json](conspiracy.json) | 18 |
| [deep_talk.json](deep_talk.json) | 17 |
| [dirty.json](dirty.json) | 23 |
| [group_knowledge.json](group_knowledge.json) | 17 |
| [hobbies_interests.json](hobbies_interests.json) | 17 |
| [hot_takes.json](hot_takes.json) | 21 |
| [meme_it.json](meme_it.json) | 20 |
| [memories.json](memories.json) | 16 |
| [pure_fun.json](pure_fun.json) | 25 |
| [relationships.json](relationships.json) | 20 |
| [would_you_rather.json](would_you_rather.json) | 19 |
| **[all.json](all.json)** | **230** (alle zusammen) |

## Format pro Frage

```json
{
  "text": "Wer würde am ehesten spontan einen Flug buchen?",
  "category": "pure_fun",
  "type": "single_choice",
  "anonymous": false,
  "targetMode": "both"
}
```

`either_or` braucht zusätzlich `options: [string, string]`.

`meme_caption` braucht zusätzlich `imagePath` (Pfad relativ zu `public/`,
z. B. `/memes/Bossy_Boots.webp`).

## Workflow

- **Eine Kategorie nachschärfen oder erweitern**: nur die jeweilige Datei
  bearbeiten und im Admin importieren.
- **Alles auf einmal importieren**: `all.json` nutzen.
- **Neue Frage hinzufügen**: in die passende Kategorie-Datei einfügen,
  dann via Admin-Import drauflegen. Doppelimporte sind unkritisch
  (neue `questionId`s werden generiert), alte Versionen können im Admin
  deaktiviert werden.

## Regeln

- `anonymous` ist projektweit aktuell für alle Fragen `false`
- `targetMode`: `"both"` für die meisten, `"daily"` für Open-Text und
  besonders explizite Dirty-Fragen, `"live"` für schnelle Reaktions-Fragen
- Pro Daily kommt **max. eine Frage pro Kategorie** (Backend-Regel — siehe
  [../daily-run-rules.md](../daily-run-rules.md))
