import { AvatarCircle } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AppUser } from "@/lib/types/frontend";

export function ProfileHeader({
  user,
  isSelf,
  isEditing = false,
  onToggleEditing,
  onEditName,
  onEditPhoto,
}: {
  user: AppUser;
  isSelf: boolean;
  isEditing?: boolean;
  onToggleEditing?: () => void;
  onEditName?: () => void;
  onEditPhoto?: () => void;
}) {
  const member = {
    userId: user.userId,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };

  return (
    <section className="relative flex flex-col items-center gap-3 radius-card border border-white/60 bg-white/85 p-6 text-center shadow-card-raised backdrop-blur">
      {isSelf ? (
        <button
          type="button"
          onClick={onToggleEditing}
          className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-sand-100 text-sand-700 transition hover:bg-sand-200"
          aria-label={isEditing ? "Bearbeiten beenden" : "Profil bearbeiten"}
        >
          ✎
        </button>
      ) : null}

      <div className="relative">
        <AvatarCircle member={member} size="xl" />
        {isSelf && isEditing ? (
          <button
            type="button"
            onClick={onEditPhoto}
            className="absolute -bottom-1 -right-1 inline-flex size-8 items-center justify-center rounded-full border border-white bg-sand-900 text-sm text-cream shadow-sm"
            aria-label="Profilbild bearbeiten"
          >
            ✎
          </button>
        ) : null}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-sand-900">
            {user.displayName}
          </h1>
          {isSelf && isEditing ? (
            <button
              type="button"
              onClick={onEditName}
              className="inline-flex size-8 items-center justify-center rounded-full bg-sand-100 text-sm text-sand-700 transition hover:bg-sand-200"
              aria-label="Anzeigenamen bearbeiten"
            >
              ✎
            </button>
          ) : null}
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <Badge tone={user.role === "admin" ? "dark" : "neutral"} size="sm">
            {user.role === "admin" ? "Admin" : "Mitglied"}
          </Badge>
          {isSelf ? (
            <Badge tone="coral" size="sm">
              Du
            </Badge>
          ) : null}
        </div>
      </div>
    </section>
  );
}

