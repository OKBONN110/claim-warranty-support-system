import type { ReactNode } from "react";
import { logout } from "../app/login/actions";
import { createClient } from "../lib/supabase/server";
import NotificationBell, {
  type NotificationItem,
} from "./notification-bell";
import RoleNavigation from "./role-navigation";

type AppShellProps = {
  title: string;
  userName: string;
  role: string;
  children: ReactNode;
};

export default async function AppShell({
  title,
  userName,
  role,
  children,
}: AppShellProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let notifications: NotificationItem[] = [];

  if (user) {
    const { data } = await supabase
      .from("notifications")
      .select(
        [
          "id",
          "claim_id",
          "message_id",
          "notification_type",
          "title",
          "body",
          "read_at",
          "created_at",
        ].join(", "),
      )
      .eq("recipient_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(30);

    notifications =
      (data as NotificationItem[] | null) ??
      [];
  }

  const unreadNotificationCount =
    notifications.filter(
      (notification) =>
        !notification.read_at,
    ).length;

  const staffUser = [
    "support",
    "supervisor",
    "admin",
  ].includes(role);

  const portalName = staffUser
    ? "Support Command Center"
    : "Dealer Claims Portal";

  const portalDescription = staffUser
    ? "Claims operations and resolution"
    : "Submit and track dealer claims";

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[275px_1fr]">
      {/* ===================================================
          LEFT SIDEBAR
          =================================================== */}
      <aside
        className="relative border-b border-white/10 text-white lg:min-h-screen lg:border-b-0 lg:border-r"
        style={{
          background:
            "linear-gradient(155deg, #0A1628 0%, #1B3A6B 52%, #0D2347 100%)",
        }}
      >
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-[#BF1A2F]" />

        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 font-bold text-white">
            CS

            <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#BF1A2F]" />
          </div>

          <div className="min-w-0">
            <p className="font-bold text-white">
              {portalName}
            </p>

            <p className="text-xs text-slate-300">
              {portalDescription}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <RoleNavigation
          role={role}
          unreadCount={
            unreadNotificationCount
          }
        />

        {/* Desktop user footer */}
        <div className="hidden px-4 py-4 lg:absolute lg:bottom-0 lg:block lg:w-[275px]">
          <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
            <p className="truncate text-sm font-semibold text-white">
              {userName}
            </p>

            <p className="mt-1 text-xs uppercase tracking-wider text-slate-300">
              {role}
            </p>

            <form
              action={logout}
              className="mt-4"
            >
              <button
                type="submit"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:border-[#BF1A2F] hover:bg-[#BF1A2F]/15"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ===================================================
          RIGHT CONTENT AREA
          =================================================== */}
      <div className="right-content-area">
        <header className="right-content-header">
          <div className="flex min-h-24 items-center justify-between gap-5 px-6 pb-5 pt-4 lg:px-10">
            {/* Page title */}
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1B3A6B]">
                {staffUser
                  ? "Support Operations"
                  : "Dealer Services"}
              </p>

              <h1 className="mt-1 truncate text-2xl font-bold text-[#0D2347]">
                {title}
              </h1>
            </div>

            {/* Header controls */}
            <div className="flex items-center gap-3">
              {user ? (
                <NotificationBell
                  userId={user.id}
                  initialNotifications={
                    notifications
                  }
                />
              ) : null}

              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-[#0D2347]">
                  {userName}
                </p>

                <span className="mt-1 inline-flex rounded-full bg-[#BF1A2F] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {role}
                </span>
              </div>

              {/* Mobile logout */}
              <form
                action={logout}
                className="lg:hidden"
              >
                <button
                  type="submit"
                  className="rounded-xl border border-[#0D2347]/15 px-3 py-2 text-xs font-bold text-[#0D2347] transition hover:border-[#BF1A2F] hover:text-[#BF1A2F]"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="right-content-main px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}