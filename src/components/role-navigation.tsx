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
      label: "Home",
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
    <nav className="mobile-role-navigation relative z-20 grid w-full grid-cols-3 gap-1 px-2 pb-3 pt-3 lg:flex lg:w-auto lg:flex-col lg:gap-2 lg:overflow-visible lg:px-4 lg:py-5">
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
            className={`relative z-10 flex min-h-14 min-w-0 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl px-1.5 py-2 text-center text-[10px] font-semibold leading-tight transition sm:px-2 sm:text-xs lg:min-h-0 lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3 lg:text-left lg:text-sm ${
              active
                ? "bg-white/10 text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            {/* Active red accent */}
            {active ? (
              <span className="absolute bottom-0 left-0 top-0 hidden w-1 bg-[#BF1A2F] lg:block" />
            ) : null}

            {/* Icon */}
            <Icon className="h-5 w-5 shrink-0 lg:h-4 lg:w-4" />

            {/* Label */}
            <span className="max-w-[92px] break-words lg:max-w-none">
              {item.label}
            </span>

            {/* Unread notification */}
            {showNotification ? (
              <span className="absolute right-1 top-1 flex items-center gap-1 lg:static lg:ml-auto lg:gap-2">
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

