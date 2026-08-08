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
        className="relative overflow-hidden border-b border-white/10 text-white lg:min-h-screen lg:overflow-visible lg:border-b-0 lg:border-r"
        style={{
          background:
            "linear-gradient(155deg, #0A1628 0%, #1B3A6B 52%, #0D2347 100%)",
        }}
      >
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-[#BF1A2F]" />

        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4 lg:py-6">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/10 text-sm font-bold text-white sm:h-12 sm:w-12 sm:rounded-2xl sm:text-base">
            CS

            <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#BF1A2F]" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white sm:text-base">
              {portalName}
            </p>

            <p className="mt-0.5 hidden text-xs text-slate-300 sm:block">
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
          <div className="flex min-h-0 flex-col items-stretch gap-3 px-4 py-4 sm:min-h-24 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-6 sm:pb-5 sm:pt-4 lg:px-10">
            {/* Page title */}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1B3A6B] sm:text-xs sm:tracking-[0.22em]">
                {staffUser
                  ? "Support Operations"
                  : "Dealer Services"}
              </p>

              <h1 className="mt-1 break-words text-xl font-bold leading-tight text-[#0D2347] sm:truncate sm:text-2xl">
                {title}
              </h1>
            </div>

            {/* Header controls */}
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
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
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#0D2347]/15 bg-white px-4 py-2 text-xs font-bold text-[#0D2347] shadow-sm transition hover:border-[#BF1A2F] hover:text-[#BF1A2F]"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="right-content-main min-w-0 px-3 py-4 sm:px-7 sm:py-7 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
