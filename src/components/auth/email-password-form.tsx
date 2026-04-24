"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export function EmailPasswordForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { authState, loginWithPassword, registerWithPassword, isMockMode } =
    useAuth();

  const isBusy =
    authState.status === "requesting_link" ||
    authState.status === "verifying_link" ||
    authState.status === "initializing";

  const passwordHint =
    password.length > 0 && password.length < 6
      ? "Passwort muss mindestens 6 Zeichen haben."
      : null;

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (mode === "login") {
          await loginWithPassword(email, password);
        } else {
          await registerWithPassword(email, password);
        }
      }}
    >
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-sand-100 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`min-h-11 rounded-xl text-sm font-semibold transition ${
            mode === "login"
              ? "bg-sand-900 text-cream"
              : "text-sand-700 hover:bg-white/50"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`min-h-11 rounded-xl text-sm font-semibold transition ${
            mode === "register"
              ? "bg-sand-900 text-cream"
              : "text-sand-700 hover:bg-white/50"
          }`}
        >
          Registrieren
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-sand-700" htmlFor="email">
          E-Mail
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="freund@beispiel.de"
          className="min-h-12 w-full rounded-2xl border border-sand-200 bg-white px-4 text-base text-sand-950 outline-none placeholder:text-sand-400 focus:border-sand-400"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-sand-700" htmlFor="password">
          Passwort
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="mindestens 6 Zeichen"
          className="min-h-12 w-full rounded-2xl border border-sand-200 bg-white px-4 text-base text-sand-950 outline-none placeholder:text-sand-400 focus:border-sand-400"
        />
        {passwordHint ? (
          <p className="text-xs text-amber-700">{passwordHint}</p>
        ) : null}
      </div>

      <Button
        className="w-full"
        disabled={!email || password.length < 6 || isBusy}
      >
        {isBusy
          ? "Laeuft..."
          : mode === "login"
            ? "Einloggen"
            : "Account erstellen"}
      </Button>

      <p className="text-sm text-sand-500">
        {isMockMode
          ? "Mock-Modus aktiv: ohne Firebase springt die App mit Demo-Daten weiter."
          : "Lokaler Dev-Login ohne Magic-Link, damit wir sauber testen koennen."}
      </p>

      {authState.status === "error" ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {authState.message}
        </p>
      ) : null}
    </form>
  );
}
