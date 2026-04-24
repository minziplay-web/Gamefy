import { AvatarCircle } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AppUser } from "@/lib/types/frontend";

export function ProfileHeader({
  user,
  isSelf,
}: {
  user: AppUser;
  isSelf: boolean;
}) {
  const member = {
    userId: user.userId,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };

  return (
    <section className="flex flex-col items-center gap-3 radius-card border border-white/60 bg-white/85 p-6 text-center shadow-card-raised backdrop-blur">
      <AvatarCircle member={member} size="xl" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-sand-900">
          {user.displayName}
        </h1>
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

