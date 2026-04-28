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
    <section className="relative overflow-hidden radius-card border border-profile-primary/28 bg-white p-6 text-center shadow-[0_18px_42px_-28px_rgba(23,32,49,0.24)]">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-24 bg-linear-to-br from-profile-primary via-brand-light to-profile-strong"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-14 h-20 rounded-[100%] bg-white"
      />
      {isSelf ? (
        <button
          type="button"
          onClick={onToggleEditing}
          className="absolute right-4 top-4 z-10 inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-profile-text shadow-card-flat transition hover:bg-white"
          aria-label={isEditing ? "Bearbeiten beenden" : "Profil bearbeiten"}
        >
          ✎
        </button>
      ) : null}

      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="relative rounded-full bg-white p-1 shadow-card-raised">
          <AvatarCircle member={member} size="xl" />
          {isSelf && isEditing ? (
            <button
              type="button"
              onClick={onEditPhoto}
              className="absolute -bottom-1 -right-1 inline-flex size-8 items-center justify-center rounded-full border border-white bg-profile-primary text-sm text-cream shadow-sm"
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
                className="inline-flex size-8 items-center justify-center rounded-full bg-profile-soft text-sm text-profile-text transition hover:bg-profile-soft"
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
              <Badge tone="profile" size="sm">
                Du
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

