import { AvatarCircle } from "@/components/ui/avatar";
import type { ProfileStats } from "@/lib/types/frontend";

export function ProfileSpecialRelationships({
  relationships,
}: {
  relationships: ProfileStats["specialRelationships"];
}) {
  return (
    <section className="space-y-3 rounded-3xl border border-brand-primary/30 bg-white p-4 shadow-card-flat">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sand-500">
          Besondere Beziehung
        </p>
        <p className="text-sm text-sand-700">
          Wer dich am häufigsten gewählt hat.
        </p>
      </div>

      {relationships.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-primary/28 bg-profile-wash px-3 py-3 text-sm text-sand-500">
          Noch keine Personen-Votes.
        </p>
      ) : (
        <ul className="space-y-2">
          {relationships.map((entry, index) => (
            <li
              key={entry.member.userId}
              className="flex items-center justify-between gap-3 rounded-2xl border border-brand-primary/25 bg-profile-wash px-3 py-3 shadow-card-flat"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-sm font-semibold text-sand-400">
                  {index + 1}
                </span>
                <AvatarCircle member={entry.member} size="sm" />
                <span className="text-sm font-semibold text-sand-900">
                  {entry.member.displayName}
                </span>
              </div>
              <span className="rounded-full bg-profile-soft px-2.5 py-1 text-sm font-semibold text-brand-primary">
                {entry.votes}×
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
