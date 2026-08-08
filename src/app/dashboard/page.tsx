import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock3,
  FilePlus2,
  FolderKanban,
  Headphones,
  Inbox,
  ListChecks,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react";
import AppShell from "../../components/app-shell";
import SupportOperationsDashboard from "../../components/support-operations-dashboard";
import { createClient } from "../../lib/supabase/server";

type ClaimRow = {
  id: string;
  claim_number: string;
  customer_name: string;
  customer_email: string | null;
  invoice_or_po_number: string | null;
  faulty_part_numbers: string | null;
  product_name: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

type DealerRow = {
  id: string;
  dealer_name: string;
  dealer_code: string | null;
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

const priorityOrder: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "en-AU",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(value));
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

function getAgeLabel(value: string) {
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
    return `${hours}h ago`;
  }

  const days =
    Math.floor(hours / 24);

  return `${days}d ago`;
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
      return "border-red-200 bg-red-50 text-[#A01525]";

    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";

    case "rejected":
      return "border-red-200 bg-red-50 text-[#A01525]";

    case "closed":
      return "border-slate-200 bg-slate-100 text-slate-700";

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

function DealerMetric({
  label,
  value,
  description,
  tone = "navy",
}: {
  label: string;
  value: number;
  description: string;
  tone?: "navy" | "red" | "green";
}) {
  const accent =
    tone === "red"
      ? "#BF1A2F"
      : tone === "green"
        ? "#16805B"
        : "#0D2347";

  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#DDE3EA] bg-white p-6 shadow-[0_8px_22px_rgba(10,22,40,0.055)]">
      <div
        className="absolute bottom-0 left-0 top-0 w-1.5"
        style={{
          background: accent,
        }}
      />

      <p className="text-sm font-bold text-[#1B3A6B]">
        {label}
      </p>

      <p className="mt-3 text-4xl font-extrabold text-[#0D2347]">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-[#68778B]">
        {description}
      </p>
    </article>
  );
}

export default async function DashboardPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select(
        "full_name, role, dealer_id",
      )
      .eq("id", user.id)
      .maybeSingle();

  const userName =
    profile?.full_name ||
    user.email ||
    "User";

  const role =
    profile?.role ||
    "dealer";

  const staffUser = [
    "support",
    "supervisor",
    "admin",
  ].includes(role);

  /*
   * =====================================================
   * DEALER DASHBOARD
   * =====================================================
   */

  if (!staffUser) {
    const dealerId =
      profile?.dealer_id ?? null;

    const [
      dealerResult,
      claimsResult,
      notificationResult,
    ] = await Promise.all([
      dealerId
        ? supabase
            .from("dealers")
            .select(
              "id, dealer_name, dealer_code",
            )
            .eq("id", dealerId)
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),

      supabase
        .from("claims")
        .select(
          [
            "id",
            "claim_number",
            "customer_name",
            "customer_email",
            "invoice_or_po_number",
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
        .limit(200),

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
          user.id,
        )
        .is("read_at", null)
        .order("created_at", {
          ascending: false,
        })
        .limit(50),
    ]);

    const dealer =
      dealerResult.data as
        | DealerRow
        | null;

    const claims =
      (claimsResult.data as
        | ClaimRow[]
        | null) ?? [];

    const notifications =
      (notificationResult.data as
        | NotificationRow[]
        | null) ?? [];

    const totalClaims =
      claims.length;

    const submittedClaims =
      claims.filter(
        (claim) =>
          claim.status ===
          "submitted",
      );

    const reviewClaims =
      claims.filter(
        (claim) =>
          claim.status ===
          "under_review",
      );

    const actionRequiredClaims =
      claims.filter(
        (claim) =>
          claim.status ===
          "waiting_for_dealer",
      );

    const approvedClaims =
      claims.filter(
        (claim) =>
          claim.status ===
          "approved",
      );

    const unresolvedClaims =
      claims.filter((claim) =>
        activeStatuses.includes(
          claim.status,
        ),
      );

    const unreadSupportReplies =
      notifications.filter(
        (notification) =>
          notification.notification_type ===
          "message_reply",
      );

    const unreadClaimIds =
      new Set(
        unreadSupportReplies
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

    const claimsWithUnreadReplies =
      claims.filter((claim) =>
        unreadClaimIds.has(
          claim.id,
        ),
      );

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
        .slice(0, 6);

    const recentlyResolved =
      claims
        .filter((claim) =>
          [
            "approved",
            "rejected",
            "closed",
          ].includes(
            claim.status,
          ),
        )
        .sort(
          (a, b) =>
            new Date(
              b.updated_at,
            ).getTime() -
            new Date(
              a.updated_at,
            ).getTime(),
        )
        .slice(0, 4);

    return (
      <AppShell
        title="Dealer Home"
        userName={userName}
        role={role}
      >
        <div className="mx-auto max-w-[1500px]">
          {/* =================================================
              WELCOME
              ================================================= */}
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
                  Dealer workspace
                </p>

                <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                  Welcome, {userName}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
                  Submit warranty claims,
                  respond to support requests,
                  and monitor every claim
                  through resolution.
                </p>

                {dealer ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white">
                      {dealer.dealer_name}
                    </span>

                    {dealer.dealer_code ? (
                      <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white">
                        Dealer Code:{" "}
                        {dealer.dealer_code}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/claims/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#A01525] to-[#BF1A2F] px-6 py-3 text-sm font-bold text-white shadow-lg"
                >
                  <FilePlus2 className="h-4 w-4" />

                  Submit New Claim
                </Link>

                <Link
                  href="/claims"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/15"
                >
                  <FolderKanban className="h-4 w-4" />

                  My Claims
                </Link>
              </div>
            </div>
          </section>

          {/* =================================================
              ACTION REQUIRED
              ================================================= */}
          {actionRequiredClaims.length >
          0 ? (
            <section className="mt-7 overflow-hidden rounded-2xl border border-red-200 bg-red-50 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-red-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#BF1A2F] text-white">
                    <AlertTriangle className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#BF1A2F]">
                      Action required
                    </p>

                    <h3 className="mt-1 text-xl font-extrabold text-[#0D2347]">
                      Support is waiting for
                      your response
                    </h3>

                    <p className="mt-1 text-sm text-[#65758A]">
                      {
                        actionRequiredClaims.length
                      }{" "}
                      claim
                      {actionRequiredClaims.length ===
                      1
                        ? ""
                        : "s"}{" "}
                      require additional
                      information or evidence.
                    </p>
                  </div>
                </div>

                <span className="flex h-10 min-w-10 items-center justify-center rounded-full bg-[#BF1A2F] px-3 text-sm font-extrabold text-white">
                  {
                    actionRequiredClaims.length
                  }
                </span>
              </div>

              <div className="divide-y divide-red-100">
                {actionRequiredClaims
                  .slice(0, 4)
                  .map((claim) => (
                    <Link
                      key={claim.id}
                      href={`/claims/${claim.id}`}
                      className="group flex flex-col gap-4 px-6 py-4 hover:bg-white/70 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-extrabold text-[#0D2347] group-hover:text-[#BF1A2F]">
                          {
                            claim.claim_number
                          }
                        </p>

                        <p className="mt-1 truncate text-sm text-[#65758A]">
                          {
                            claim.customer_name
                          }{" "}
                          Â·{" "}
                          {claim.faulty_part_numbers ||
                            claim.product_name}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-2 self-start rounded-xl bg-[#BF1A2F] px-4 py-2 text-xs font-bold text-white sm:self-auto">
                        View &amp; Respond

                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  ))}
              </div>
            </section>
          ) : null}

          {/* =================================================
              UNREAD SUPPORT REPLIES
              ================================================= */}
          {claimsWithUnreadReplies.length >
          0 ? (
            <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0D2347] text-white">
                    <BellRing className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-extrabold text-[#0D2347]">
                      New support replies
                    </h3>

                    <p className="mt-1 text-sm text-[#65758A]">
                      Support has replied on{" "}
                      {
                        claimsWithUnreadReplies.length
                      }{" "}
                      claim
                      {claimsWithUnreadReplies.length ===
                      1
                        ? ""
                        : "s"}.
                    </p>
                  </div>
                </div>

                <Link
                  href="/claims"
                  className="inline-flex items-center gap-2 self-start rounded-xl bg-[#0D2347] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1B3A6B] sm:self-auto"
                >
                  Review Replies

                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          ) : null}

          {/* =================================================
              METRICS
              ================================================= */}
          <section className="mt-5 grid grid-cols-1 gap-4 sm:mt-7 sm:grid-cols-2 sm:gap-5 xl:grid-cols-5">
            <DealerMetric
              label="My Claims"
              value={totalClaims}
              description="All claims available to your dealer account"
            />

            <DealerMetric
              label="Submitted"
              value={
                submittedClaims.length
              }
              description="Waiting for support's initial review"
            />

            <DealerMetric
              label="Under Review"
              value={
                reviewClaims.length
              }
              description="Currently being assessed by support"
            />

            <DealerMetric
              label="Action Required"
              value={
                actionRequiredClaims.length
              }
              description="Support is waiting for information from you"
              tone="red"
            />

            <DealerMetric
              label="Approved"
              value={
                approvedClaims.length
              }
              description="Warranty claims approved by support"
              tone="green"
            />
          </section>

          {/* =================================================
              SEARCH + RECENT CLAIMS
              ================================================= */}
          <section className="mt-6 grid min-w-0 gap-5 sm:mt-8 sm:gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <article className="overflow-hidden rounded-2xl border border-[#DDE3EA] bg-white shadow-[0_8px_24px_rgba(10,22,40,0.055)]">
              <div className="border-b border-[#E5E9EF] px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#BF1A2F]">
                      Recent activity
                    </p>

                    <h3 className="mt-1 text-xl font-extrabold text-[#0D2347]">
                      Recent Claims
                    </h3>
                  </div>

                  <Link
                    href="/claims"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#1B3A6B] hover:text-[#BF1A2F]"
                  >
                    View all claims

                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <form
                  action="/claims"
                  method="get"
                  className="relative mt-5"
                >
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8793A3]" />

                  <input
                    name="search"
                    placeholder="Search claim number, customer, PO or part number"
                    className="h-12 w-full min-w-0 rounded-xl border border-[#CBD4E0] bg-[#F3F5F8] pl-12 pr-4 text-base font-medium text-[#0D2347] outline-none placeholder:text-[#9BA5B2] focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10 sm:text-sm"
                  />
                </form>
              </div>

              <div className="divide-y divide-[#E9EDF2]">
                {recentClaims.map(
                  (claim) => (
                    <Link
                      key={claim.id}
                      href={`/claims/${claim.id}`}
                      className="group grid min-w-0 gap-4 px-4 py-4 hover:bg-[#F8F9FB] sm:grid-cols-[minmax(240px,1fr)_160px_125px] sm:px-6 sm:py-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-extrabold text-[#0D2347] group-hover:text-[#BF1A2F]">
                            {
                              claim.claim_number
                            }
                          </p>

                          {unreadClaimIds.has(
                            claim.id,
                          ) ? (
                            <span className="flex items-center gap-1.5 rounded-full bg-[#BF1A2F] px-2.5 py-1 text-[10px] font-extrabold text-white">
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />

                              New Reply
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 break-words text-sm font-semibold text-[#1B3A6B] sm:truncate">
                          {
                            claim.customer_name
                          }
                        </p>

                        <p className="mt-1 break-words text-xs text-[#718096] sm:truncate">
                          {claim.invoice_or_po_number
                            ? `PO: ${claim.invoice_or_po_number}`
                            : claim.faulty_part_numbers ||
                              claim.product_name}
                        </p>
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

                      <div className="sm:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8793A3]">
                          Updated
                        </p>

                        <p className="mt-2 text-sm font-bold text-[#0D2347]">
                          {getAgeLabel(
                            claim.updated_at,
                          )}
                        </p>

                        <p className="mt-1 text-[11px] text-[#8793A3]">
                          {formatDate(
                            claim.updated_at,
                          )}
                        </p>
                      </div>
                    </Link>
                  ),
                )}

                {!recentClaims.length ? (
                  <div className="px-6 py-14 text-center">
                    <FolderKanban className="mx-auto h-10 w-10 text-[#1B3A6B]" />

                    <p className="mt-4 font-extrabold text-[#0D2347]">
                      No claims yet
                    </p>

                    <p className="mt-2 text-sm text-[#65758A]">
                      Submit your first
                      warranty claim to get
                      started.
                    </p>

                    <Link
                      href="/claims/new"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#BF1A2F] px-5 py-2.5 text-sm font-bold text-white"
                    >
                      Submit Claim

                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : null}
              </div>
            </article>

            {/* ===============================================
                ACCOUNT SUMMARY
                =============================================== */}
            <div className="space-y-6">
              <article className="rounded-2xl border border-[#DDE3EA] bg-white p-4 shadow-sm sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#BF1A2F]">
                  Dealer account
                </p>

                <h3 className="mt-2 text-xl font-extrabold text-[#0D2347]">
                  Portal Access
                </h3>

                <div className="mt-6 space-y-4">
                  <div className="rounded-xl bg-[#F4F6F8] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#8793A3]">
                      Company
                    </p>

                    <p className="mt-1 font-bold text-[#0D2347]">
                      {dealer?.dealer_name ||
                        "Dealer account"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#F4F6F8] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#8793A3]">
                      Dealer Code
                    </p>

                    <p className="mt-1 font-bold text-[#0D2347]">
                      {dealer?.dealer_code ||
                        "Not assigned"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#F4F6F8] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#8793A3]">
                      Signed in as
                    </p>

                    <p className="mt-1 break-all font-bold text-[#0D2347]">
                      {user.email}
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-[#DDE3EA] bg-white p-4 shadow-sm sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#BF1A2F]">
                  Before submitting
                </p>

                <h3 className="mt-2 text-xl font-extrabold text-[#0D2347]">
                  Prepare Your Evidence
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#65758A]">
                  Have your invoice or PO,
                  part numbers, fault
                  description, and clear
                  photos or short videos
                  ready.
                </p>

                <Link
                  href="/claims/new"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#A01525] to-[#BF1A2F] px-5 py-3 text-sm font-bold text-white"
                >
                  <FilePlus2 className="h-4 w-4" />

                  Submit New Claim
                </Link>
              </article>
            </div>
          </section>

          {/* =================================================
              CLAIM WORKFLOW
              ================================================= */}
          <section className="mt-6 grid min-w-0 gap-5 sm:mt-8 sm:gap-6 xl:grid-cols-[1fr_420px]">
            <article className="rounded-2xl border border-[#DDE3EA] bg-white p-4 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#BF1A2F]">
                Claim journey
              </p>

              <h3 className="mt-2 text-xl font-extrabold text-[#0D2347]">
                Claim Workflow
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                {[
                  {
                    number: 1,
                    title: "Submit",
                    text:
                      "Provide claim details and supporting evidence.",
                  },
                  {
                    number: 2,
                    title:
                      "Support Review",
                    text:
                      "Support assesses the warranty claim.",
                  },
                  {
                    number: 3,
                    title:
                      "Respond",
                    text:
                      "Provide additional information if requested.",
                  },
                  {
                    number: 4,
                    title:
                      "Decision",
                    text:
                      "Receive approval, rejection, or closure.",
                  },
                ].map((step) => (
                  <div
                    key={step.number}
                    className="rounded-xl border border-[#DDE3EA] bg-[#F6F8FA] p-4 sm:p-5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#BF1A2F] text-sm font-extrabold text-white">
                      {step.number}
                    </span>

                    <p className="mt-4 font-extrabold text-[#0D2347]">
                      {step.title}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-[#68778B]">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            {/* ===============================================
                RESOLVED CLAIMS
                =============================================== */}
            <article className="rounded-2xl border border-[#DDE3EA] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#BF1A2F]">
                    Outcomes
                  </p>

                  <h3 className="mt-2 text-xl font-extrabold text-[#0D2347]">
                    Recently Resolved
                  </h3>
                </div>

                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>

              <div className="mt-5 space-y-3">
                {recentlyResolved.map(
                  (claim) => (
                    <Link
                      key={claim.id}
                      href={`/claims/${claim.id}`}
                      className="block rounded-xl border border-[#E2E7ED] bg-[#F8F9FB] p-4 hover:border-[#BF1A2F]/30 hover:bg-white"
                    >
                      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:flex-nowrap sm:gap-4">
                        <p className="min-w-0 break-all text-sm font-extrabold text-[#0D2347] sm:truncate">
                          {
                            claim.claim_number
                          }
                        </p>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClasses(
                            claim.status,
                          )}`}
                        >
                          {formatLabel(
                            claim.status,
                          )}
                        </span>
                      </div>

                      <p className="mt-2 break-words text-xs text-[#65758A] sm:truncate">
                        {
                          claim.customer_name
                        }
                      </p>

                      <p className="mt-1 text-[11px] text-[#8793A3]">
                        {formatDateTime(
                          claim.updated_at,
                        )}
                      </p>
                    </Link>
                  ),
                )}

                {!recentlyResolved.length ? (
                  <p className="rounded-xl bg-[#F4F6F8] p-4 text-sm text-[#65758A]">
                    No resolved claims yet.
                  </p>
                ) : null}
              </div>
            </article>
          </section>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Operations Overview"
      userName={userName}
      role={role}
    >
      <SupportOperationsDashboard
        userId={user.id}
        userName={userName}
      />
    </AppShell>
  );
}
