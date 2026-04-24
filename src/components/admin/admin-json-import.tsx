"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/text-field";

const EXAMPLE = `[
  {
    "text": "Wer würde am ehesten spontan einen Flug buchen?",
    "category": "pure_fun",
    "type": "single_choice",
    "anonymous": false,
    "targetMode": "both"
  }
]`;

export function AdminJsonImport({
  status,
  error,
  onImport,
}: {
  status: "idle" | "importing" | "success" | "error";
  error?: string;
  onImport: (raw: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <section className="space-y-3 rounded-2xl border border-white/50 bg-white/80 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-sand-900">Fragen importieren</h3>
        <p className="text-xs text-sand-500">
          JSON-Array im vereinbarten Frage-Format einfügen.
        </p>
      </div>
      <TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={EXAMPLE}
        spellCheck={false}
        className="font-mono text-xs leading-5"
      />
      {status === "error" && error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : null}
      {status === "success" ? (
        <p className="text-xs text-emerald-700">Import erfolgreich.</p>
      ) : null}
      <Button
        className="w-full"
        disabled={!value.trim() || status === "importing"}
        onClick={() => onImport(value.trim())}
      >
        {status === "importing" ? "Importiert..." : "Importieren"}
      </Button>
    </section>
  );
}
