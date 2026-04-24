import type { MemberLite } from "@/lib/types/frontend";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<Size, string> = {
  xs: "size-4 text-[9px]",
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
};

export function AvatarCircle({
  member,
  size = "md",
  tone = "dark",
  className = "",
}: {
  member: MemberLite;
  size?: Size;
  tone?: "dark" | "light";
  className?: string;
}) {
  const palette =
    tone === "dark"
      ? "bg-sand-900 text-cream"
      : "bg-white/20 text-cream ring-2 ring-white/40";

  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold ${sizeClasses[size]} ${palette} ${className}`}
      aria-label={member.displayName || "Friend"}
    >
      {member.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.photoURL}
          alt={member.displayName || "Friend"}
          className="size-full rounded-full object-cover"
        />
      ) : (
        <FallbackAvatarIcon />
      )}
    </div>
  );
}

export function AvatarBubble({
  member,
  size = "md",
}: {
  member: MemberLite;
  size?: Size;
}) {
  return (
    <div className="flex items-center gap-3">
      <AvatarCircle member={member} size={size} />
      <span className="text-sm font-medium text-sand-800">
        {member.displayName || "Friend"}
      </span>
    </div>
  );
}

export function AvatarStack({
  members,
  max = 4,
  size = "sm",
}: {
  members: MemberLite[];
  max?: number;
  size?: Size;
}) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;

  return (
    <div className="flex items-center">
      {visible.map((m, idx) => (
        <div key={m.userId} className={idx === 0 ? "" : "-ml-2"}>
          <AvatarCircle member={m} size={size} className="ring-2 ring-white" />
        </div>
      ))}
      {overflow > 0 ? (
        <div className="-ml-2 flex size-8 items-center justify-center rounded-full bg-sand-200 text-xs font-semibold text-sand-700 ring-2 ring-white">
          +{overflow}
        </div>
      ) : null}
    </div>
  );
}

function FallbackAvatarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[62%]"
      aria-hidden
    >
      <circle cx="12" cy="8.25" r="3.5" />
      <path d="M5 19c1.1-3.1 3.9-5 7-5s5.9 1.9 7 5" />
    </svg>
  );
}
