import Link from "next/link";

const SCREENS: Array<{ key: string; label: string; variants: string[] }> = [
  {
    key: "home",
    label: "Home",
    variants: [
      "normal",
      "loading",
      "error",
      "no-daily",
      "daily-unplayable",
      "daily-closed",
      "daily-incomplete",
      "member-live",
    ],
  },
  {
    key: "daily",
    label: "Daily",
    variants: [
      "normal",
      "loading",
      "error",
      "no-run",
      "unplayable",
      "unplayable-member",
      "incomplete",
      "closed",
    ],
  },
  {
    key: "lobby",
    label: "Lobby",
    variants: [
      "landing",
      "loading",
      "creating",
      "joining-by-code",
      "joining-error",
      "waiting",
      "question",
      "reveal",
      "finished",
      "error",
    ],
  },
  {
    key: "profile",
    label: "Profil",
    variants: [
      "full",
      "loading",
      "error",
      "not-found",
      "empty",
      "partial",
      "other-member",
    ],
  },
  {
    key: "admin",
    label: "Admin",
    variants: ["normal", "loading", "forbidden", "error", "warnings", "errors", "no-runs"],
  },
  { key: "onboarding", label: "Onboarding", variants: ["empty", "filled"] },
];

export default function PreviewIndex() {
  return (
    <div className="space-y-4">
      <header className="space-y-2 px-1 pb-2 pt-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sand-500">
          Preview
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-sand-900">
          UI-Zustaende
        </h1>
        <p className="text-sm text-sand-700">
          Nur für Design-Review und Screenshots. Jeder Link rendert einen
          festgelegten ViewState mit Mock-Daten.
        </p>
      </header>
      <div className="space-y-3">
        {SCREENS.map((screen) => (
          <section
            key={screen.key}
            className="rounded-[28px] border border-white/50 bg-white/80 p-5 shadow-lg shadow-sand-900/5"
          >
            <h2 className="mb-3 text-lg font-semibold text-sand-900">
              {screen.label}
            </h2>
            <div className="flex flex-wrap gap-2">
              {screen.variants.map((variant) => (
                <Link
                  key={variant}
                  href={`/preview/${screen.key}/${variant}`}
                  className="inline-flex items-center rounded-full bg-sand-100 px-3 py-1.5 text-xs font-medium text-sand-800 hover:bg-sand-200"
                >
                  {variant}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
