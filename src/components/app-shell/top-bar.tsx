import { NotificationBell } from "@/components/app-shell/notification-panel";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 bg-[#000000]/88 backdrop-blur">
      <div className="mx-auto flex w-full max-w-screen-sm justify-end px-4 py-2">
        <NotificationBell />
      </div>
    </header>
  );
}
