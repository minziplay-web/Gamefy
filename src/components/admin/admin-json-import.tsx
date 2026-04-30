"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/text-field";

const EXAMPLE = `[
  {
    "text": "Wer würde am ehesten spontan einen Flug buchen?",
    "category": "pure_fun",
    "type": "single_choice",
  "targetMode": "daily"
  }
]`;

export function AdminJsonImport({
  status,
  error,
  message,
  onImport,
}: {
  status: "idle" | "importing" | "success" | "error";
  error?: string;
  message?: string;
  onImport: (raw: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <section className="space-y-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-card-flat">
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
        <p className="rounded-2xl border border-danger-text/18 bg-danger-soft px-3 py-2 text-xs font-medium text-danger-text">
          {error}
        </p>
      ) : null}
      {status === "success" ? (
        <p className="rounded-2xl border border-success-text/18 bg-success-soft px-3 py-2 text-xs font-medium text-success-text">
          {message ?? "Import erfolgreich."}
        </p>
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
