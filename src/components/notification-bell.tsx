"use client";

import Link from "next/link";
import {
  Bell,
  CheckCheck,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "../lib/supabase/client";

export type NotificationItem = {
  id: string;
  claim_id: string | null;
  message_id: string | null;
  notification_type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

type NotificationBellProps = {
  userId: string;
  initialNotifications: NotificationItem[];
};

function formatNotificationTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(
    new Date(value),
  );
}

export default function NotificationBell({
  userId,
  initialNotifications,
}: NotificationBellProps) {
  const supabase =
    useMemo(
      () => createClient(),
      [],
    );

  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    notifications,
    setNotifications,
  ] =
    useState<NotificationItem[]>(
      initialNotifications,
    );

  const unreadCount =
    notifications.filter(
      (item) =>
        item.read_at ===
        null,
    ).length;

  useEffect(() => {
    setNotifications(
      initialNotifications,
    );
  }, [
    initialNotifications,
  ]);

  useEffect(() => {
    const channel =
      supabase
        .channel(
          `notifications:${userId}`,
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table:
              "notifications",
            filter:
              `recipient_id=eq.${userId}`,
          },
          (payload) => {
            const incoming =
              payload.new as
                NotificationItem;

            setNotifications(
              (current) => {
                const duplicate =
                  current.some(
                    (item) =>
                      item.id ===
                        incoming.id ||
                      (
                        incoming.message_id !==
                          null &&
                        item.message_id !==
                          null &&
                        item.message_id ===
                          incoming.message_id
                      ),
                  );

                if (duplicate) {
                  return current;
                }

                return [
                  incoming,
                  ...current,
                ].slice(
                  0,
                  30,
                );
              },
            );
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table:
              "notifications",
            filter:
              `recipient_id=eq.${userId}`,
          },
          (payload) => {
            const updated =
              payload.new as
                NotificationItem;

            setNotifications(
              (current) =>
                current.map(
                  (item) =>
                    item.id ===
                    updated.id
                      ? updated
                      : item,
                ),
            );
          },
        )
        .subscribe();

    return () => {
      void supabase.removeChannel(
        channel,
      );
    };
  }, [
    supabase,
    userId,
  ]);

  useEffect(() => {
    function handleClaimRead(
      event: Event,
    ) {
      const customEvent =
        event as CustomEvent<{
          claimId: string;
          readAt: string;
        }>;

      const {
        claimId,
        readAt,
      } =
        customEvent.detail;

      setNotifications(
        (current) =>
          current.map(
            (item) =>
              item.claim_id ===
                claimId &&
              item.read_at ===
                null
                ? {
                    ...item,
                    read_at:
                      readAt,
                  }
                : item,
          ),
      );
    }

    window.addEventListener(
      "claim-notifications-read",
      handleClaimRead,
    );

    return () => {
      window.removeEventListener(
        "claim-notifications-read",
        handleClaimRead,
      );
    };
  }, []);

  async function markRead(
    notificationId: string,
  ) {
    const readAt =
      new Date().toISOString();

    const { error } =
      await supabase
        .from(
          "notifications",
        )
        .update({
          read_at:
            readAt,
        })
        .eq(
          "id",
          notificationId,
        )
        .eq(
          "recipient_id",
          userId,
        )
        .is(
          "read_at",
          null,
        );

    if (!error) {
      setNotifications(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              notificationId
                ? {
                    ...item,
                    read_at:
                      readAt,
                  }
                : item,
          ),
      );
    }
  }

  async function markAllRead() {
    const readAt =
      new Date().toISOString();

    const { error } =
      await supabase
        .from(
          "notifications",
        )
        .update({
          read_at:
            readAt,
        })
        .eq(
          "recipient_id",
          userId,
        )
        .is(
          "read_at",
          null,
        );

    if (!error) {
      setNotifications(
        (current) =>
          current.map(
            (item) => ({
              ...item,

              read_at:
                item.read_at ??
                readAt,
            }),
          ),
      );
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => {
          setOpen(
            (current) =>
              !current,
          );
        }}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#0D2347]/15 bg-[#0D2347] text-white shadow-sm hover:bg-[#1B3A6B]"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 ? (
          <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#BF1A2F] px-1.5 text-[10px] font-bold text-white shadow-lg">
            {unreadCount >
            99
              ? "99+"
              : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-3 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/15 bg-[#0A1628] shadow-2xl">
          <div className="h-1 bg-[#BF1A2F]" />

          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="font-bold text-white">
                Notifications
              </h2>

              <p className="text-xs text-slate-300">
                {unreadCount} unread
              </p>
            </div>

            {unreadCount >
            0 ? (
              <button
                type="button"
                onClick={() => {
                  void markAllRead();
                }}
                className="flex items-center gap-2 text-xs font-semibold text-white hover:text-red-200"
              >
                <CheckCheck className="h-4 w-4" />

                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-[430px] overflow-y-auto">
            {notifications.map(
              (item) => {
                const unread =
                  item.read_at ===
                  null;

                const href =
                  item.claim_id
                    ? `/claims/${item.claim_id}`
                    : "/dashboard";

                return (
                  <Link
                    key={
                      item.id
                    }
                    href={
                      href
                    }
                    onClick={() => {
                      setOpen(
                        false,
                      );

                      if (
                        unread
                      ) {
                        void markRead(
                          item.id,
                        );
                      }
                    }}
                    className={`relative block border-b border-white/10 px-5 py-4 hover:bg-white/5 ${
                      unread
                        ? "bg-[#BF1A2F]/10"
                        : ""
                    }`}
                  >
                    {unread ? (
                      <span className="absolute left-2 top-6 h-2.5 w-2.5 rounded-full bg-[#BF1A2F]" />
                    ) : null}

                    <div className="pl-2">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-semibold text-white">
                          {
                            item.title
                          }
                        </p>

                        <time className="shrink-0 text-[11px] text-slate-400">
                          {formatNotificationTime(
                            item.created_at,
                          )}
                        </time>
                      </div>

                      {item.body ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-300">
                          {
                            item.body
                          }
                        </p>
                      ) : null}
                    </div>
                  </Link>
                );
              },
            )}

            {!notifications.length ? (
              <div className="px-6 py-12 text-center">
                <p className="font-semibold text-white">
                  No notifications
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  New claims and replies
                  will appear here.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}