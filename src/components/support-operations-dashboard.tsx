import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock3,
  Headphones,
  Inbox,
  MessageCircle,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { createClient } from "../lib/supabase/server";

type SupportOperationsDashboardProps = {
  userId: string;
  userName: string;
};

type ClaimRow = {
  id: string;
  claim_number: string;
  customer_name: string;
  faulty_part_numbers: string | null;
  product_name: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

type NotificationRow = {
  id: string;
  claim_id: string | null;
  notification_type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

const activeStatuses = [
  "submitted",
  "under_review",
  "waiting_for_dealer",
];

function formatLabel(value: string) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function getAge(value: string) {
  const milliseconds =
    Date.now() -
    new Date(value).getTime();

  const hours = Math.max(
    0,
    Math.floor(
      milliseconds /
        (1000 * 60 * 60),
    ),
  );

  if (hours < 1) {
    return "Just now";
  }

  if (hours < 24) {
    return `${hours}h`;
  }

  const days =
    Math.floor(hours / 24);

  return `${days}d ${hours % 24}h`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(
    "en-AU",
    {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(new Date(value));
}

function getStatusClasses(
  status: string,
) {
  switch (status) {
    case "submitted":
      return "border-slate-200 bg-slate-50 text-slate-700";

    case "under_review":
      return "border-blue-200 bg-blue-50 text-[#1B3A6B]";

    case "waiting_for_dealer":
      return "border-amber-200 bg-amber-50 text-amber-800";

    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";

    case "rejected":
      return "border-red-200 bg-red-50 text-[#A01525]";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getPriorityClasses(
  priority: string,
) {
  switch (priority) {
    case "urgent":
      return "border-red-200 bg-red-50 text-[#A01525]";

    case "high":
      return "border-orange-200 bg-orange-50 text-orange-800";

    case "low":
      return "border-slate-200 bg-slate-50 text-slate-600";

    default:
      return "border-blue-200 bg-blue-50 text-[#1B3A6B]";
  }
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  href,
  tone = "navy",
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  href: string;
  tone?: "navy" | "red" | "green";
}) {
  const accentClass =
    tone === "red"
      ? "bg-[#BF1A2F]"
      : tone === "green"
        ? "bg-emerald-600"
        : "bg-[#0D2347]";

  const iconClass =
    tone === "red"
      ? "bg-[#BF1A2F]/10 text-[#BF1A2F]"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-[#0D2347]/10 text-[#0D2347]";

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-[#DDE3EA] bg-white p-5 shadow-[0_8px_22px_rgba(10,22,40,0.055)] transition-all duration-200 hover:-translate-y-1 hover:border-[#1B3A6B]/30 hover:shadow-[0_16px_35px_rgba(10,22,40,0.12)] focus:outline-none focus:ring-4 focus:ring-[#1B3A6B]/10"
    >
      <div
        className={`absolute bottom-0 left-0 top-0 w-1.5 transition-all duration-200 group-hover:w-2 ${accentClass}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[#1B3A6B]">
              {label}
            </p>

            <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-[#8793A3] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
          </div>

          <p className="mt-2 text-4xl font-extrabold text-[#0D2347]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-[#68778B]">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-[#1B3A6B] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        View claims
        <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}

export default async function SupportOperationsDashboard({
  userId,
  userName,
}: SupportOperationsDashboardProps) {
  const supabase =
    await createClient();

  const slaThreshold =
    new Date(
      Date.now() -
        48 *
          60 *
          60 *
          1000,
    ).toISOString();

  const [
    claimsResult,
    notificationsResult,
  ] = await Promise.all([
    supabase
      .from("claims")
      .select(
        [
          "id",
          "claim_number",
          "customer_name",
          "faulty_part_numbers",
          "product_name",
          "priority",
          "status",
          "assigned_to",
          "created_at",
          "updated_at",
        ].join(", "),
      )
      .order("updated_at", {
        ascending: false,
      })
      .limit(500),

    supabase
      .from("notifications")
      .select(
        [
          "id",
          "claim_id",
          "notification_type",
          "title",
          "body",
          "read_at",
          "created_at",
        ].join(", "),
      )
      .eq(
        "recipient_id",
        userId,
      )
      .is(
        "read_at",
        null,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      )
      .limit(100),
  ]);

  const claims =
    (claimsResult.data as
      | ClaimRow[]
      | null) ?? [];

  const notifications =
    (notificationsResult.data as
      | NotificationRow[]
      | null) ?? [];

  const activeClaims =
    claims.filter((claim) =>
      activeStatuses.includes(
        claim.status,
      ),
    );

  const newClaims =
    notifications.filter(
      (notification) =>
        notification.notification_type ===
        "new_claim",
    );

  const unreadReplies =
    notifications.filter(
      (notification) =>
        notification.notification_type ===
        "message_reply",
    );

  const unassignedClaims =
    activeClaims.filter(
      (claim) =>
        !claim.assigned_to,
    );

  const assignedToMe =
    activeClaims.filter(
      (claim) =>
        claim.assigned_to ===
        userId,
    );

  const waitingForDealer =
    activeClaims.filter(
      (claim) =>
        claim.status ===
        "waiting_for_dealer",
    );

  const slaRiskClaims =
    activeClaims.filter(
      (claim) =>
        new Date(
          claim.created_at,
        ).toISOString() <
        slaThreshold,
    );

  const urgentHighClaims =
    activeClaims.filter(
      (claim) =>
        [
          "urgent",
          "high",
        ].includes(
          claim.priority,
        ),
    );

  const submittedClaims =
    activeClaims.filter(
      (claim) =>
        claim.status ===
        "submitted",
    );

  const underReviewClaims =
    activeClaims.filter(
      (claim) =>
        claim.status ===
        "under_review",
    );

  const unreadClaimIds =
    new Set(
      notifications
        .map(
          (notification) =>
            notification.claim_id,
        )
        .filter(
          (
            value,
          ): value is string =>
            Boolean(value),
        ),
    );

  const needsAttention =
    [...activeClaims]
      .sort((a, b) => {
        const aUnread =
          unreadClaimIds.has(
            a.id,
          )
            ? 1
            : 0;

        const bUnread =
          unreadClaimIds.has(
            b.id,
          )
            ? 1
            : 0;

        if (
          aUnread !==
          bUnread
        ) {
          return (
            bUnread -
            aUnread
          );
        }

        const priorityWeight:
          Record<
            string,
            number
          > = {
            urgent: 4,
            high: 3,
            medium: 2,
            low: 1,
          };

        const priorityDifference =
          (priorityWeight[
            b.priority
          ] ?? 0) -
          (priorityWeight[
            a.priority
          ] ?? 0);

        if (
          priorityDifference !==
          0
        ) {
          return priorityDifference;
        }

        return (
          new Date(
            a.created_at,
          ).getTime() -
          new Date(
            b.created_at,
          ).getTime()
        );
      })
      .slice(0, 8);

  const recentClaims =
    [...claims]
      .sort(
        (a, b) =>
          new Date(
            b.updated_at,
          ).getTime() -
          new Date(
            a.updated_at,
          ).getTime(),
      )
      .slice(0, 7);

  return (
    <div className="mx-auto max-w-[1500px]">
      <section
        className="relative overflow-hidden rounded-3xl p-7 text-white shadow-xl sm:p-8"
        style={{
          background:
            "linear-gradient(135deg, #0A1628 0%, #1B3A6B 52%, #0D2347 100%)",
        }}
      >
        <div className="absolute bottom-0 left-0 top-0 w-2 bg-[#BF1A2F]" />

        <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              Support command centre
            </p>

            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              Operations Overview
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80">
              Welcome, {userName}. Prioritise
              new claims, unread dealer
              replies, SLA risks, and
              unassigned work from one
              workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#A01525] to-[#BF1A2F] px-6 py-3 text-sm font-bold text-white shadow-lg"
            >
              <Headphones className="h-4 w-4" />
              Open Support Queue
            </Link>

            <Link
              href="/claims"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/15"
            >
              View Claims Register
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {(newClaims.length > 0 ||
        unreadReplies.length > 0) ? (
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {newClaims.length > 0 ? (
            <Link
              href="/support?view=unassigned"
              className="group flex items-center justify-between gap-5 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm hover:bg-red-100/60"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#BF1A2F] text-white">
                  <BellRing className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-extrabold text-[#0D2347]">
                    New claim submitted
                  </p>

                  <p className="mt-1 text-sm text-[#65758A]">
                    {newClaims.length} unread
                    new claim notification
                    {newClaims.length === 1
                      ? ""
                      : "s"}.
                  </p>
                </div>
              </div>

              <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#BF1A2F] px-3 text-xs font-extrabold text-white">
                {newClaims.length}
              </span>
            </Link>
          ) : null}

          {unreadReplies.length >
          0 ? (
            <Link
              href="/support"
              className="group flex items-center justify-between gap-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm hover:bg-blue-100/60"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0D2347] text-white">
                  <MessageCircle className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-extrabold text-[#0D2347]">
                    Dealer replies waiting
                  </p>

                  <p className="mt-1 text-sm text-[#65758A]">
                    {unreadReplies.length} unread
                    message
                    {unreadReplies.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    require review.
                  </p>
                </div>
              </div>

              <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#0D2347] px-3 text-xs font-extrabold text-white">
                {unreadReplies.length}
              </span>
            </Link>
          ) : null}
        </section>
      ) : null}

      <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Queue"
          value={
            activeClaims.length
          }
          description="Claims currently requiring support attention"
          icon={Headphones}
          href="/support"
        />

        <MetricCard
          label="Unassigned"
          value={
            unassignedClaims.length
          }
          description="Claims that still need a support owner"
          icon={Inbox}
          href="/support?view=unassigned"
          tone={
            unassignedClaims.length >
            0
              ? "red"
              : "navy"
          }
        />

        <MetricCard
          label="Assigned to Me"
          value={
            assignedToMe.length
          }
          description="Active claims currently owned by you"
          icon={UserCheck}
          href="/support?view=mine"
        />

        <MetricCard
          label="SLA Risk"
          value={
            slaRiskClaims.length
          }
          description="Active claims open longer than 48 hours"
          icon={ShieldAlert}
          href="/support?sort=oldest"
          tone={
            slaRiskClaims.length > 0
              ? "red"
              : "navy"
          }
        />
      </section>

      <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="New Claims"
          value={
            newClaims.length
          }
          description="Unread newly submitted claim notifications"
          icon={BellRing}
          href="/support?status=submitted"
          tone={
            newClaims.length > 0
              ? "red"
              : "navy"
          }
        />

        <MetricCard
          label="Unread Replies"
          value={
            unreadReplies.length
          }
          description="Dealer messages that have not been reviewed yet"
          icon={MessageCircle}
          href="/support"
          tone={
            unreadReplies.length > 0
              ? "red"
              : "navy"
          }
        />

        <MetricCard
          label="Urgent / High"
          value={
            urgentHighClaims.length
          }
          description="Priority claims requiring faster attention"
          icon={AlertTriangle}
          href="/support?sort=oldest"
          tone={
            urgentHighClaims.length >
            0
              ? "red"
              : "navy"
          }
        />

        <MetricCard
          label="Waiting for Dealer"
          value={
            waitingForDealer.length
          }
          description="Claims where support is waiting for customer information"
          icon={Clock3}
          href="/support?status=waiting_for_dealer"
        />
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-[#DDE3EA] bg-white shadow-[0_8px_24px_rgba(10,22,40,0.055)]">
        <div className="flex flex-col gap-4 border-b border-[#E5E9EF] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#BF1A2F]">
              Priority workspace
            </p>

            <h3 className="mt-1 text-xl font-extrabold text-[#0D2347]">
              Needs Attention Now
            </h3>

            <p className="mt-1 text-sm text-[#65758A]">
              Unread activity, high priority,
              and older claims are shown first.
            </p>
          </div>

          <Link
            href="/support"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#1B3A6B] hover:text-[#BF1A2F]"
          >
            Full queue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="divide-y divide-[#E9EDF2]">
          {needsAttention.map(
            (claim) => {
              const unread =
                unreadClaimIds.has(
                  claim.id,
                );

              return (
                <Link
                  key={claim.id}
                  href={`/claims/${claim.id}`}
                  className="group grid gap-4 px-6 py-5 hover:bg-[#F8F9FB] lg:grid-cols-[minmax(250px,1.4fr)_150px_170px_145px_130px]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-[#0D2347] group-hover:text-[#BF1A2F]">
                        {
                          claim.claim_number
                        }
                      </p>

                      {unread ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#BF1A2F] px-2.5 py-1 text-[10px] font-extrabold text-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          New Activity
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 truncate text-sm font-semibold text-[#1B3A6B]">
                      {
                        claim.customer_name
                      }
                    </p>

                    <p className="mt-1 truncate text-xs text-[#718096]">
                      {claim.faulty_part_numbers ||
                        claim.product_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8793A3]">
                      Priority
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPriorityClasses(
                        claim.priority,
                      )}`}
                    >
                      {formatLabel(
                        claim.priority,
                      )}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8793A3]">
                      Status
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                        claim.status,
                      )}`}
                    >
                      {formatLabel(
                        claim.status,
                      )}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8793A3]">
                      Ownership
                    </p>

                    <p className="mt-2 text-sm font-bold text-[#0D2347]">
                      {claim.assigned_to ===
                      userId
                        ? "Assigned to me"
                        : claim.assigned_to
                          ? "Assigned"
                          : "Unassigned"}
                    </p>
                  </div>

                  <div className="lg:text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8793A3]">
                      Queue Age
                    </p>

                    <p className="mt-2 text-sm font-extrabold text-[#0D2347]">
                      {getAge(
                        claim.created_at,
                      )}
                    </p>
                  </div>
                </Link>
              );
            },
          )}

          {!needsAttention.length ? (
            <div className="px-6 py-14 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />

              <p className="mt-4 font-extrabold text-[#0D2347]">
                Nothing urgent right now
              </p>

              <p className="mt-2 text-sm text-[#65758A]">
                There are no active claims
                requiring immediate attention.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-[#DDE3EA] bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#BF1A2F]">
            Queue health
          </p>

          <h3 className="mt-2 text-xl font-extrabold text-[#0D2347]">
            Active Status Breakdown
          </h3>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Link
              href="/support?status=submitted"
              className="rounded-xl border border-[#DDE3EA] bg-[#F6F8FA] p-5 hover:border-[#BF1A2F]/30 hover:bg-white"
            >
              <p className="text-sm font-bold text-[#1B3A6B]">
                Submitted
              </p>

              <p className="mt-2 text-3xl font-extrabold text-[#0D2347]">
                {submittedClaims.length}
              </p>
            </Link>

            <Link
              href="/support?status=under_review"
              className="rounded-xl border border-[#DDE3EA] bg-[#F6F8FA] p-5 hover:border-[#BF1A2F]/30 hover:bg-white"
            >
              <p className="text-sm font-bold text-[#1B3A6B]">
                Under Review
              </p>

              <p className="mt-2 text-3xl font-extrabold text-[#0D2347]">
                {underReviewClaims.length}
              </p>
            </Link>

            <Link
              href="/support?status=waiting_for_dealer"
              className="rounded-xl border border-[#DDE3EA] bg-[#F6F8FA] p-5 hover:border-[#BF1A2F]/30 hover:bg-white"
            >
              <p className="text-sm font-bold text-[#1B3A6B]">
                Waiting for Dealer
              </p>

              <p className="mt-2 text-3xl font-extrabold text-[#0D2347]">
                {waitingForDealer.length}
              </p>
            </Link>
          </div>
        </article>

        <article className="rounded-2xl border border-[#DDE3EA] bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#BF1A2F]">
            Personal workload
          </p>

          <h3 className="mt-2 text-xl font-extrabold text-[#0D2347]">
            My Assigned Claims
          </h3>

          <div className="mt-5 space-y-3">
            {assignedToMe
              .slice(0, 5)
              .map((claim) => (
                <Link
                  key={claim.id}
                  href={`/claims/${claim.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[#E2E7ED] bg-[#F8F9FB] p-4 hover:border-[#BF1A2F]/30 hover:bg-white"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[#0D2347]">
                      {
                        claim.claim_number
                      }
                    </p>

                    <p className="mt-1 truncate text-xs text-[#65758A]">
                      {
                        claim.customer_name
                      }
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClasses(
                      claim.status,
                    )}`}
                  >
                    {formatLabel(
                      claim.status,
                    )}
                  </span>
                </Link>
              ))}

            {!assignedToMe.length ? (
              <div className="rounded-xl bg-[#F4F6F8] p-5 text-sm text-[#65758A]">
                You currently have no active
                claims assigned.
              </div>
            ) : null}
          </div>

          <Link
            href="/support?view=mine"
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#1B3A6B] hover:text-[#BF1A2F]"
          >
            View all assigned claims
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-[#DDE3EA] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-[#E5E9EF] px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#BF1A2F]">
              Latest changes
            </p>

            <h3 className="mt-1 text-xl font-extrabold text-[#0D2347]">
              Recently Updated Claims
            </h3>
          </div>

          <Link
            href="/claims"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#1B3A6B] hover:text-[#BF1A2F]"
          >
            Claims Register
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="divide-y divide-[#E9EDF2]">
          {recentClaims.map(
            (claim) => (
              <Link
                key={claim.id}
                href={`/claims/${claim.id}`}
                className="group grid gap-4 px-6 py-4 hover:bg-[#F8F9FB] sm:grid-cols-[minmax(250px,1fr)_170px_150px]"
              >
                <div className="min-w-0">
                  <p className="font-extrabold text-[#0D2347] group-hover:text-[#BF1A2F]">
                    {claim.claim_number}
                  </p>

                  <p className="mt-1 truncate text-sm text-[#65758A]">
                    {claim.customer_name}
                    {" Â· "}
                    {claim.faulty_part_numbers ||
                      claim.product_name}
                  </p>
                </div>

                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                      claim.status,
                    )}`}
                  >
                    {formatLabel(
                      claim.status,
                    )}
                  </span>
                </div>

                <div className="sm:text-right">
                  <p className="text-sm font-bold text-[#0D2347]">
                    {getAge(
                      claim.updated_at,
                    )}
                  </p>

                  <p className="mt-1 text-[11px] text-[#8793A3]">
                    {formatDateTime(
                      claim.updated_at,
                    )}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}