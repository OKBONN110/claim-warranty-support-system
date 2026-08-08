"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  FilePlus2,
  FolderKanban,
  Gauge,
  Headphones,
  LayoutDashboard,
  ListChecks,
  Settings2,
} from "lucide-react";

type RoleNavigationProps = {
  role: string;
  unreadCount?: number;
};

type NavigationItem = {
  href: string;
  label: string;
  icon: ComponentType<{
    className?: string;
  }>;
};

function isActivePath(
  pathname: string,
  href: string,
) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export default function RoleNavigation({
  role,
  unreadCount = 0,
}: RoleNavigationProps) {
  const pathname = usePathname();

  const dealerItems: NavigationItem[] = [
    {
      href: "/dashboard",
      label: "Dealer Home",
      icon: LayoutDashboard,
    },
    {
      href: "/claims",
      label: "My Claims",
      icon: FolderKanban,
    },
    {
      href: "/claims/new",
      label: "Submit Claim",
      icon: FilePlus2,
    },
  ];

  const supportItems: NavigationItem[] = [
    {
      href: "/dashboard",
      label: "Operations Overview",
      icon: Gauge,
    },
    {
      href: "/support",
      label: "Active Queue",
      icon: Headphones,
    },
    {
      href: "/claims",
      label: "Claims Register",
      icon: ListChecks,
    },
  ];

  const adminItems: NavigationItem[] = [
    ...supportItems,
    {
      href: "/admin",
      label: "Administration",
      icon: Settings2,
    },
  ];

  const items =
    role === "admin"
      ? adminItems
      : [
            "support",
            "supervisor",
          ].includes(role)
        ? supportItems
        : dealerItems;

  return (
    <nav className="flex gap-2 overflow-x-auto px-4 py-5 lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const active =
          isActivePath(
            pathname,
            item.href,
          );

        const Icon =
          item.icon;

        /*
         * Dealer notifications belong on
         * My Claims.
         *
         * Support notifications belong on
         * Active Queue.
         */
        const notificationTarget =
          role === "dealer"
            ? item.href === "/claims"
            : [
                  "support",
                  "supervisor",
                  "admin",
                ].includes(role)
              ? item.href === "/support"
              : false;

        const showNotification =
          notificationTarget &&
          unreadCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex min-w-max items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold transition ${
              active
                ? "bg-white/10 text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            {/* Active red accent */}
            {active ? (
              <span className="absolute bottom-0 left-0 top-0 w-1 bg-[#BF1A2F]" />
            ) : null}

            {/* Icon */}
            <Icon className="h-4 w-4 shrink-0" />

            {/* Label */}
            <span>
              {item.label}
            </span>

            {/* Unread notification */}
            {showNotification ? (
              <span className="ml-auto flex items-center gap-2">
                {/* Pulsing red dot */}
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#BF1A2F] opacity-45" />

                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#BF1A2F]" />
                </span>

                {/* Count */}
                <span className="flex min-w-5 items-center justify-center rounded-full bg-[#BF1A2F] px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              </span>
            ) : null}

            {/* Mobile active underline */}
            {active ? (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#BF1A2F] lg:hidden" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}