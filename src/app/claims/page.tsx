import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BellRing,
  FilePlus2,
} from "lucide-react";
import AppShell from "../../components/app-shell";
import { createClient } from "../../lib/supabase/server";

type ClaimsPageProps = {
  searchParams: Promise<{
    status?: string;
    created?: string;
  }>;
};

type ClaimRow = {
  id: string;
  claim_number: string;
  customer_name: string;
  product_name: string;
  faulty_part_numbers: string | null;
  vehicle_side: string | null;
  status: string;
  priority: string;
  requested_amount: number | string | null;
  created_at: string;
};

type NotificationRow = {
  id: string;
  claim_id: string | null;
  notification_type: string;
  read_at: string | null;
};

function formatStatus(
  status: string,
) {
  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(
    new Date(value),
  );
}

function getPriorityClasses(
  priority: string,
) {
  switch (priority) {
    case "urgent":
      return "border-red-200 bg-red-50 text-[#BF1A2F]";

    case "high":
      return "border-orange-200 bg-orange-50 text-orange-800";

    case "low":
      return "border-slate-200 bg-slate-50 text-slate-600";

    default:
      return "border-[#B8D4F4] bg-[#EEF6FF] text-[#1B3A6B]";
  }
}

function getStatusClasses(
  status: string,
) {
  switch (status) {
    case "submitted":
      return "border-[#CAD4E0] bg-[#F4F6F8] text-[#0D2347]";

    case "under_review":
      return "border-[#B8D4F4] bg-[#EEF6FF] text-[#1B3A6B]";

    case "waiting_for_dealer":
      return "border-[#F1C4CA] bg-[#FFF1F3] text-[#BF1A2F]";

    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";

    case "rejected":
      return "border-red-200 bg-red-50 text-[#BF1A2F]";

    case "closed":
      return "border-slate-200 bg-slate-100 text-slate-700";

    default:
      return "border-slate-200 bg-slate-50 text-[#0D2347]";
  }
}

export default async function ClaimsPage({
  searchParams,
}: ClaimsPageProps) {
  const parameters = await searchParams;
  const created = parameters.created;
  const status = parameters.status || "";

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: profile,
  } =
    await supabase
      .from("profiles")
      .select(
        "full_name, role",
      )
      .eq(
        "id",
        user.id,
      )
      .maybeSingle();

  const [
    claimsResult,
    notificationsResult,
  ] =
    await Promise.all([
      (() => {
        let claimsQuery = supabase
          .from("claims")
          .select(
            "id, claim_number, customer_name, product_name, faulty_part_numbers, vehicle_side, status, priority, requested_amount, created_at",
          );

        if (status) {
          claimsQuery = claimsQuery.eq(
            "status",
            status,
          );
        }

        return claimsQuery
        .order(
          "created_at",
          {
            ascending: false,
          },
        )
        .limit(50)
      })(),

      supabase
        .from("notifications")
        .select(
          "id, claim_id, notification_type, read_at",
        )
        .eq(
          "recipient_id",
          user.id,
        )
        .eq(
          "notification_type",
          "message_reply",
        )
        .is(
          "read_at",
          null,
        ),
    ]);

  const claims =
    (claimsResult.data as
      | ClaimRow[]
      | null) ?? [];

  const error =
    claimsResult.error;

  const notifications =
    (notificationsResult.data as
      | NotificationRow[]
      | null) ?? [];

  const unreadClaimIds =
    new Set(
      notifications
        .map(
          (notification) =>
            notification.claim_id,
        )
        .filter(
          (
            claimId,
          ): claimId is string =>
            Boolean(claimId),
        ),
    );

  const unreadReplyCount =
    notifications.length;

  const userName =
    profile?.full_name ||
    user.email ||
    "User";

  const role =
    profile?.role ||
    "dealer";

  return (
    <AppShell
      title="Claims"
      userName={userName}
      role={role}
    >
      <div className="mx-auto w-full max-w-7xl">
        {created ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
            Claim{" "}
            <strong>
              {created}
            </strong>{" "}
            was submitted successfully.
          </div>
        ) : null}

        <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#BF1A2F]">
              Claims register
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-extrabold text-[#0D2347]">
                All Claims
              </h2>

              {unreadReplyCount >
              0 ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#BF1A2F] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                  <BellRing className="h-3.5 w-3.5" />

                  {unreadReplyCount} new{" "}
                  {unreadReplyCount ===
                  1
                    ? "reply"
                    : "replies"}
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-sm text-[#65758A]">
              Review and track the claims available to your account.
            </p>
          </div>

          {[
            "dealer",
            "admin",
          ].includes(role) ? (
            <Link
              href="/claims/new"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#A01525] to-[#BF1A2F] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(191,26,47,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(191,26,47,0.3)] sm:w-auto"
            >
              <FilePlus2 className="h-4 w-4" />

              New Claim

              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
            Unable to load claims:{" "}
            {error.message}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[#DDE3EA] bg-white shadow-[0_8px_24px_rgba(10,22,40,0.06)]">
          {/* Mobile claim cards */}
          <div className="divide-y divide-[#E7EBF0] md:hidden">
            {claims.map((claim) => {
              const hasUnreadReply =
                unreadClaimIds.has(claim.id);

              return (
                <Link
                  key={claim.id}
                  href={`/claims/${claim.id}`}
                  className={`relative block p-4 transition ${
                    hasUnreadReply
                      ? "bg-[#FFF8F9]"
                      : "bg-white"
                  }`}
                >
                  {hasUnreadReply ? (
                    <span className="absolute bottom-0 left-0 top-0 w-1 bg-[#BF1A2F]" />
                  ) : null}

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-all text-sm font-extrabold text-[#0D2347]">
                          {claim.claim_number}
                        </p>

                        {hasUnreadReply ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#BF1A2F] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white">
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            New Reply
                          </span>
                        ) : null}
                      </div>

                      {claim.requested_amount !== null ? (
                        <p className="mt-1 text-xs text-[#718096]">
                          Amount:{" "}
                          {Number(
                            claim.requested_amount,
                          ).toLocaleString()}
                        </p>
                      ) : null}
                    </div>

                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#8793A3]" />
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8793A3]">
                      Customer
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold text-[#0D2347]">
                      {claim.customer_name}
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8793A3]">
                      Product / Part
                    </p>

                    <p className="mt-1 break-words text-sm text-[#65758A]">
                      {claim.faulty_part_numbers ||
                        claim.product_name}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8793A3]">
                        Priority
                      </p>

                      <span
                        className={`mt-1.5 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${getPriorityClasses(
                          claim.priority,
                        )}`}
                      >
                        {claim.priority}
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8793A3]">
                        Status
                      </p>

                      <span
                        className={`mt-1.5 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusClasses(
                          claim.status,
                        )}`}
                      >
                        {formatStatus(claim.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[#E9EDF2] pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8793A3]">
                      Created
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#65758A]">
                      {formatDate(claim.created_at)}
                    </p>
                  </div>
                </Link>
              );
            })}

            {!claims.length ? (
              <div className="px-5 py-12 text-center">
                <p className="font-bold text-[#0D2347]">
                  No claims found
                </p>

                <p className="mt-2 text-sm text-[#65758A]">
                  Create your first claim to begin tracking it.
                </p>
              </div>
            ) : null}
          </div>

          {/* Desktop claim table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-[#DDE3EA] bg-[#F4F6F8]">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-[#1B3A6B]">
                    Claim
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-[#1B3A6B]">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-[#1B3A6B]">
                    Product
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-[#1B3A6B]">
                    Priority
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-[#1B3A6B]">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-[#1B3A6B]">
                    Created
                  </th>

                  <th className="w-12 px-4 py-4" />
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E7EBF0]">
                {claims.map(
                  (claim) => {
                    const hasUnreadReply =
                      unreadClaimIds.has(
                        claim.id,
                      );

                    return (
                      <tr
                        key={
                          claim.id
                        }
                        className={`group relative transition-all duration-200 ${
                          hasUnreadReply
                            ? "bg-[#FFF8F9] hover:bg-[#FFF1F3]"
                            : "hover:bg-[#F7F9FB]"
                        }`}
                      >
                        <td className="relative px-6 py-5">
                          {hasUnreadReply ? (
                            <span className="absolute bottom-0 left-0 top-0 w-1 bg-[#BF1A2F]" />
                          ) : null}

                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/claims/${claim.id}`}
                              className="font-extrabold text-[#0D2347] transition group-hover:text-[#BF1A2F]"
                            >
                              {
                                claim.claim_number
                              }
                            </Link>

                            {hasUnreadReply ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#BF1A2F] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
                                <span className="relative flex h-2 w-2">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-50" />

                                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                                </span>

                                New Reply
                              </span>
                            ) : null}
                          </div>

                          {claim.requested_amount !==
                          null ? (
                            <p className="mt-1 text-xs text-[#718096]">
                              Amount:{" "}
                              {Number(
                                claim.requested_amount,
                              ).toLocaleString()}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-6 py-5 text-sm font-semibold text-[#0D2347]">
                          {
                            claim.customer_name
                          }
                        </td>

                        <td className="px-6 py-5 text-sm text-[#65758A]">
                          {claim.faulty_part_numbers ||
                            claim.product_name}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPriorityClasses(
                              claim.priority,
                            )}`}
                          >
                            {
                              claim.priority
                            }
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                              claim.status,
                            )}`}
                          >
                            {formatStatus(
                              claim.status,
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm font-medium text-[#65758A]">
                          {formatDate(
                            claim.created_at,
                          )}
                        </td>

                        <td className="px-4 py-5">
                          <Link
                            href={`/claims/${claim.id}`}
                            aria-label={`Open ${claim.claim_number}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8793A3] transition-all duration-200 group-hover:bg-[#0D2347] group-hover:text-white"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  },
                )}

                {!claims.length ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center"
                    >
                      <p className="font-bold text-[#0D2347]">
                        No claims found
                      </p>

                      <p className="mt-2 text-sm text-[#65758A]">
                        Create your first claim to begin tracking it.
                      </p>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

