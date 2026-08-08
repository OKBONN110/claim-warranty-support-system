import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Filter,
  Headphones,
  Inbox,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import AppShell from "../../components/app-shell";
import { createClient } from "../../lib/supabase/server";

type SupportPageProps = {
  searchParams: Promise<{
    view?: string;
    search?: string;
    priority?: string;
    status?: string;
    sort?: string;
  }>;
};

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
    Date.now() - new Date(value).getTime();

  const hours = Math.max(
    0,
    Math.floor(milliseconds / 3600000),
  );

  if (hours < 1) {
    return "Less than 1 hour";
  }

  if (hours < 24) {
    return `${hours} hours`;
  }

  const days = Math.floor(hours / 24);

  return `${days} day${days === 1 ? "" : "s"}`;
}

function getPriorityClasses(priority: string) {
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

function getStatusClasses(status: string) {
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

function buildUrl(
  current: Record<string, string>,
  updates: Record<string, string | undefined>,
) {
  const parameters = new URLSearchParams(current);

  Object.entries(updates).forEach(
    ([key, value]) => {
      if (!value) {
        parameters.delete(key);
      }
      else {
        parameters.set(key, value);
      }
    },
  );

  const query = parameters.toString();

  return query
    ? `/support?${query}`
    : "/support";
}

export default async function SupportPage({
  searchParams,
}: SupportPageProps) {
  const parameters = await searchParams;

  const view = parameters.view || "active";
  const search = parameters.search?.trim() || "";
  const priority = parameters.priority || "";
  const status = parameters.status || "";
  const sort = parameters.sort || "oldest";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const userName =
    profile?.full_name ||
    user.email ||
    "User";

  const role = profile?.role || "dealer";

  if (
    !["support", "supervisor", "admin"].includes(role)
  ) {
    redirect("/dashboard");
  }

  let query = supabase
    .from("claims")
    .select(
      "id, claim_number, customer_name, customer_email, invoice_or_po_number, faulty_part_numbers, product_name, priority, status, assigned_to, created_at, updated_at",
    );

  if (view === "active") {
    query = query.in("status", activeStatuses);
  }

  if (view === "unassigned") {
    query = query
      .in("status", activeStatuses)
      .is("assigned_to", null);
  }

  if (view === "mine") {
    query = query
      .in("status", activeStatuses)
      .eq("assigned_to", user.id);
  }

  if (view === "waiting") {
    query = query.eq(
      "status",
      "waiting_for_dealer",
    );
  }

  if (priority) {
    query = query.eq("priority", priority);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    const escaped = search
      .replaceAll(",", "")
      .replaceAll("%", "");

    query = query.or(
      [
        `claim_number.ilike.%${escaped}%`,
        `customer_name.ilike.%${escaped}%`,
        `customer_email.ilike.%${escaped}%`,
        `invoice_or_po_number.ilike.%${escaped}%`,
        `faulty_part_numbers.ilike.%${escaped}%`,
      ].join(","),
    );
  }

  if (sort === "newest") {
    query = query.order("created_at", {
      ascending: false,
    });
  }
  else if (sort === "updated") {
    query = query.order("updated_at", {
      ascending: false,
    });
  }
  else {
    query = query.order("created_at", {
      ascending: true,
    });
  }

  const { data, error } = await query.limit(200);

  const claims =
    (data as ClaimRow[] | null) ?? [];

  const [
    activeResult,
    unassignedResult,
    mineResult,
    waitingResult,
  ] = await Promise.all([
    supabase
      .from("claims")
      .select("*", {
        count: "exact",
        head: true,
      })
      .in("status", activeStatuses),

    supabase
      .from("claims")
      .select("*", {
        count: "exact",
        head: true,
      })
      .in("status", activeStatuses)
      .is("assigned_to", null),

    supabase
      .from("claims")
      .select("*", {
        count: "exact",
        head: true,
      })
      .in("status", activeStatuses)
      .eq("assigned_to", user.id),

    supabase
      .from("claims")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "waiting_for_dealer"),
  ]);

  const currentParameters: Record<string, string> = {
    ...(search ? { search } : {}),
    ...(priority ? { priority } : {}),
    ...(status ? { status } : {}),
    ...(sort ? { sort } : {}),
  };

  const tabs = [
    {
      key: "active",
      label: "Active",
      count: activeResult.count ?? 0,
      icon: Headphones,
    },
    {
      key: "unassigned",
      label: "Unassigned",
      count: unassignedResult.count ?? 0,
      icon: Inbox,
    },
    {
      key: "mine",
      label: "Assigned to Me",
      count: mineResult.count ?? 0,
      icon: UserCheck,
    },
    {
      key: "waiting",
      label: "Waiting for Dealer",
      count: waitingResult.count ?? 0,
      icon: Clock3,
    },
    {
      key: "all",
      label: "All Claims",
      count: null,
      icon: CheckCircle2,
    },
  ];

  const filtersActive =
    Boolean(search) ||
    Boolean(priority) ||
    Boolean(status) ||
    sort !== "oldest";

  return (
    <AppShell
      title="Active Support Queue"
      userName={userName}
      role={role}
    >
      <div className="mx-auto max-w-[1500px]">
        <section
          className="relative overflow-hidden rounded-3xl p-8 text-white shadow-xl"
          style={{
            background:
              "linear-gradient(135deg, #0A1628 0%, #1B3A6B 52%, #0D2347 100%)",
          }}
        >
          <div className="absolute bottom-0 left-0 top-0 w-2 bg-[#BF1A2F]" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">
                Support workflow
              </p>

              <h2 className="mt-2 text-3xl font-extrabold text-white">
                Claim Queue
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
                Search, filter, prioritise, and open the
                claims requiring support attention.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15"
            >
              Operations Overview
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <nav className="mt-7 flex gap-2 overflow-x-auto rounded-2xl border border-[#DDE3EA] bg-white p-2 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = view === tab.key;

            return (
              <Link
                key={tab.key}
                href={buildUrl(
                  currentParameters,
                  {
                    view: tab.key,
                  },
                )}
                className={`flex min-w-max items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${
                  selected
                    ? "bg-[#0D2347] text-white shadow-sm"
                    : "text-[#1B3A6B] hover:bg-[#F1F3F5]"
                }`}
              >
                <Icon className="h-4 w-4" />

                {tab.label}

                {tab.count !== null ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      selected
                        ? "bg-white/15 text-white"
                        : "bg-[#E8ECF1] text-[#0D2347]"
                    }`}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <section className="mt-6 rounded-2xl border border-[#DDE3EA] bg-white p-5 shadow-sm">
          <form
            method="get"
            className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_190px_220px_190px_auto]"
          >
            <input
              type="hidden"
              name="view"
              value={view}
            />

            <label className="relative">
              <span className="sr-only">
                Search claims
              </span>

              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7B8797]" />

              <input
                name="search"
                defaultValue={search}
                placeholder="Search claim, customer, PO or part number"
                className="h-12 w-full rounded-xl border border-[#CBD4E0] bg-[#F3F5F8] pl-12 pr-4 text-sm font-medium text-[#0D2347] outline-none placeholder:text-[#9AA5B3] focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10"
              />
            </label>

            <select
              name="priority"
              defaultValue={priority}
              className="h-12 rounded-xl border border-[#CBD4E0] bg-[#F3F5F8] px-4 text-sm font-semibold text-[#0D2347] outline-none focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10"
            >
              <option value="">
                All priorities
              </option>
              <option value="urgent">
                Urgent
              </option>
              <option value="high">
                High
              </option>
              <option value="medium">
                Medium
              </option>
              <option value="low">
                Low
              </option>
            </select>

            <select
              name="status"
              defaultValue={status}
              className="h-12 rounded-xl border border-[#CBD4E0] bg-[#F3F5F8] px-4 text-sm font-semibold text-[#0D2347] outline-none focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10"
            >
              <option value="">
                All statuses
              </option>
              <option value="submitted">
                Submitted
              </option>
              <option value="under_review">
                Under Review
              </option>
              <option value="waiting_for_dealer">
                Waiting for Dealer
              </option>
              <option value="approved">
                Approved
              </option>
              <option value="rejected">
                Rejected
              </option>
              <option value="closed">
                Closed
              </option>
            </select>

            <select
              name="sort"
              defaultValue={sort}
              className="h-12 rounded-xl border border-[#CBD4E0] bg-[#F3F5F8] px-4 text-sm font-semibold text-[#0D2347] outline-none focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10"
            >
              <option value="oldest">
                Oldest first
              </option>
              <option value="newest">
                Newest first
              </option>
              <option value="updated">
                Recently updated
              </option>
            </select>

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#A01525] to-[#BF1A2F] px-6 text-sm font-bold text-white shadow-lg shadow-red-900/10"
            >
              <Filter className="h-4 w-4" />
              Apply
            </button>
          </form>

          {filtersActive ? (
            <div className="mt-4 flex justify-end">
              <Link
                href={`/support?view=${view}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#1B3A6B] hover:text-[#BF1A2F]"
              >
                <X className="h-4 w-4" />
                Clear filters
              </Link>
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-[#A01525]">
            Unable to load claims: {error.message}
          </div>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#DDE3EA] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-5 border-b border-[#E3E8EE] px-6 py-5">
            <div>
              <h3 className="text-xl font-bold text-[#0D2347]">
                {tabs.find(
                  (tab) => tab.key === view,
                )?.label || "Claims"}
              </h3>

              <p className="mt-1 text-sm text-[#65758A]">
                Showing {claims.length} claim
                {claims.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#E9EDF2]">
            {claims.map((claim) => (
              <Link
                key={claim.id}
                href={`/claims/${claim.id}`}
                className="group grid gap-5 px-6 py-5 hover:bg-[#F8F9FB] lg:grid-cols-[minmax(260px,1.4fr)_minmax(180px,1fr)_170px_150px_120px]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold text-[#0D2347] group-hover:text-[#BF1A2F]">
                      {claim.claim_number}
                    </p>

                    {claim.priority === "urgent" ? (
                      <AlertTriangle className="h-4 w-4 text-[#BF1A2F]" />
                    ) : null}
                  </div>

                  <p className="mt-2 truncate text-sm font-semibold text-[#1B3A6B]">
                    {claim.customer_name}
                  </p>

                  <p className="mt-1 truncate text-xs text-[#718096]">
                    {claim.invoice_or_po_number
                      ? `PO: ${claim.invoice_or_po_number}`
                      : claim.customer_email ||
                        "No additional reference"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#8793A3]">
                    Component
                  </p>

                  <p className="mt-2 truncate text-sm font-semibold text-[#0D2347]">
                    {claim.faulty_part_numbers ||
                      claim.product_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#8793A3]">
                    Priority
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPriorityClasses(
                      claim.priority,
                    )}`}
                  >
                    {formatLabel(claim.priority)}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#8793A3]">
                    Status
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                      claim.status,
                    )}`}
                  >
                    {formatLabel(claim.status)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 lg:justify-end">
                  <div className="lg:text-right">
                    <p className="text-xs text-[#8793A3]">
                      Queue age
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#0D2347]">
                      {getAge(claim.created_at)}
                    </p>

                    <p className="mt-1 text-[11px] text-[#718096]">
                      {claim.assigned_to
                        ? claim.assigned_to === user.id
                          ? "Assigned to you"
                          : "Assigned"
                        : "Unassigned"}
                    </p>
                  </div>

                  <ArrowRight className="h-5 w-5 shrink-0 text-[#A4AFBC] group-hover:text-[#BF1A2F]" />
                </div>
              </Link>
            ))}

            {!claims.length ? (
              <div className="px-6 py-16 text-center">
                <CheckCircle2 className="mx-auto h-11 w-11 text-[#1B3A6B]" />

                <p className="mt-4 text-lg font-bold text-[#0D2347]">
                  No claims found
                </p>

                <p className="mt-2 text-sm text-[#65758A]">
                  Try another queue tab or remove some filters.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}