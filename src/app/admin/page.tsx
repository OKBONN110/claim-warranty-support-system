import { redirect } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Save,
  ShieldCheck,
  Store,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import AppShell from "../../components/app-shell";
import { createAdminClient } from "../../lib/supabase/admin";
import { createClient } from "../../lib/supabase/server";
import {
  createDealer,
  createPortalUser,
  updateDealerStatus,
  updateUserAccess,
} from "./actions";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    created?: string;
    updated?: string;
  }>;
};

type Dealer = {
  id: string;
  dealer_code: string | null;
  dealer_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  dealer_id: string | null;
  created_at: string;
};

function formatRole(value: string) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

export default async function AdminPage({
  searchParams,
}: AdminPageProps) {
  const {
    error,
    created,
    updated,
  } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentProfile } =
    await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle();

  if (currentProfile?.role !== "admin") {
    redirect("/dashboard");
  }

  const admin = createAdminClient();

  const [
    dealersResult,
    profilesResult,
  ] = await Promise.all([
    admin
      .from("dealers")
      .select(
        "id, dealer_code, dealer_name, email, phone, status, created_at",
      )
      .order("dealer_name", {
        ascending: true,
      }),

    admin
      .from("profiles")
      .select(
        "id, full_name, email, role, dealer_id, created_at",
      )
      .order("created_at", {
        ascending: false,
      }),
  ]);

  const dealers =
    (dealersResult.data as Dealer[] | null) ??
    [];

  const profiles =
    (profilesResult.data as Profile[] | null) ??
    [];

  const activeDealers = dealers.filter(
    (dealer) => dealer.status === "active",
  );

  const dealerUsers = profiles.filter(
    (profile) => profile.role === "dealer",
  ).length;

  const staffUsers = profiles.filter(
    (profile) =>
      [
        "support",
        "supervisor",
        "admin",
      ].includes(profile.role),
  ).length;

  const dealerById = new Map(
    dealers.map((dealer) => [
      dealer.id,
      dealer,
    ]),
  );

  const inputClass =
    "mt-2 h-12 w-full rounded-xl border border-[#CBD4E0] bg-[#F3F5F8] px-4 text-sm font-medium text-[#0D2347] outline-none placeholder:text-[#9BA5B2] focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10";

  return (
    <AppShell
      title="Administration"
      userName={
        currentProfile.full_name ||
        user.email ||
        "Administrator"
      }
      role="admin"
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

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">
            System administration
          </p>

          <h2 className="mt-2 text-3xl font-extrabold text-white">
            User and Dealer Management
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/80">
            Create portal accounts, manage access
            levels, assign dealer users, and control
            active dealer companies.
          </p>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-[#A01525]">
            {error}
          </div>
        ) : null}

        {created || updated ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-5 w-5" />

            {created === "dealer"
              ? "Dealer company created successfully."
              : created === "user"
                ? "Portal user created successfully."
                : updated === "dealer"
                  ? "Dealer status updated successfully."
                  : "User access updated successfully."}
          </div>
        ) : null}

        <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Portal Users",
              value: profiles.length,
              icon: Users,
            },
            {
              label: "Dealer Users",
              value: dealerUsers,
              icon: UserPlus,
            },
            {
              label: "Staff Users",
              value: staffUsers,
              icon: ShieldCheck,
            },
            {
              label: "Active Dealers",
              value: activeDealers.length,
              icon: Building2,
            },
          ].map((metric) => {
            const Icon = metric.icon;

            return (
              <article
                key={metric.label}
                className="relative overflow-hidden rounded-2xl border border-[#DDE3EA] bg-white p-6 shadow-sm"
              >
                <div className="absolute bottom-0 left-0 top-0 w-1 bg-[#BF1A2F]" />

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#1B3A6B]">
                      {metric.label}
                    </p>

                    <p className="mt-3 text-4xl font-extrabold text-[#0D2347]">
                      {metric.value}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0D2347]/10 text-[#0D2347]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-[#DDE3EA] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#BF1A2F]/10 text-[#BF1A2F]">
                <Store className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#BF1A2F]">
                  Dealer directory
                </p>

                <h3 className="text-xl font-bold text-[#0D2347]">
                  Create Dealer
                </h3>
              </div>
            </div>

            <form
              action={createDealer}
              className="mt-6 grid gap-5 sm:grid-cols-2"
            >
              <label className="text-sm font-bold text-[#0D2347]">
                Dealer name *
                <input
                  name="dealer_name"
                  required
                  placeholder="Dealer company name"
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-bold text-[#0D2347]">
                Dealer code *
                <input
                  name="dealer_code"
                  required
                  placeholder="Example: DEALER-001"
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-bold text-[#0D2347]">
                Email
                <input
                  name="email"
                  type="email"
                  placeholder="dealer@example.com"
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-bold text-[#0D2347]">
                Phone
                <input
                  name="phone"
                  placeholder="+61..."
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-bold text-[#0D2347] sm:col-span-2">
                Address
                <textarea
                  name="address"
                  rows={3}
                  placeholder="Dealer address"
                  className={`${inputClass} h-auto min-h-24 py-3`}
                />
              </label>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#A01525] to-[#BF1A2F] px-6 text-sm font-bold text-white shadow-lg sm:col-span-2"
              >
                <Building2 className="h-4 w-4" />
                Create Dealer
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-[#DDE3EA] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0D2347]/10 text-[#0D2347]">
                <UserPlus className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#BF1A2F]">
                  Portal access
                </p>

                <h3 className="text-xl font-bold text-[#0D2347]">
                  Create User
                </h3>
              </div>
            </div>

            <form
              action={createPortalUser}
              className="mt-6 grid gap-5 sm:grid-cols-2"
            >
              <label className="text-sm font-bold text-[#0D2347]">
                Full name *
                <input
                  name="full_name"
                  required
                  placeholder="Full name"
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-bold text-[#0D2347]">
                Email *
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="user@example.com"
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-bold text-[#0D2347]">
                Temporary password *
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-bold text-[#0D2347]">
                Role *
                <select
                  name="role"
                  defaultValue="dealer"
                  className={inputClass}
                >
                  <option value="dealer">
                    Dealer
                  </option>
                  <option value="support">
                    Support
                  </option>
                  <option value="supervisor">
                    Supervisor
                  </option>
                  <option value="admin">
                    Administrator
                  </option>
                </select>
              </label>

              <label className="text-sm font-bold text-[#0D2347] sm:col-span-2">
                Dealer company
                <select
                  name="dealer_id"
                  defaultValue=""
                  className={inputClass}
                >
                  <option value="">
                    Select for dealer users
                  </option>

                  {activeDealers.map((dealer) => (
                    <option
                      key={dealer.id}
                      value={dealer.id}
                    >
                      {dealer.dealer_name}
                      {dealer.dealer_code
                        ? ` (${dealer.dealer_code})`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#A01525] to-[#BF1A2F] px-6 text-sm font-bold text-white shadow-lg sm:col-span-2"
              >
                <UserPlus className="h-4 w-4" />
                Create Portal User
              </button>
            </form>
          </article>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-[#DDE3EA] bg-white shadow-sm">
          <div className="border-b border-[#E4E8EE] px-6 py-5">
            <h3 className="text-xl font-bold text-[#0D2347]">
              Portal Users
            </h3>

            <p className="mt-1 text-sm text-[#65758A]">
              Change user roles and dealer assignments.
            </p>
          </div>

          <div className="divide-y divide-[#E9EDF2]">
            {profiles.map((profile) => {
              const updateAction =
                updateUserAccess.bind(
                  null,
                  profile.id,
                );

              return (
                <form
                  key={profile.id}
                  action={updateAction}
                  className="grid gap-4 px-6 py-5 hover:bg-[#F8F9FB] lg:grid-cols-[minmax(220px,1.2fr)_190px_minmax(220px,1fr)_130px]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#0D2347]">
                      {profile.full_name ||
                        "Unnamed user"}
                    </p>

                    <p className="mt-1 truncate text-sm text-[#65758A]">
                      {profile.email ||
                        "No email recorded"}
                    </p>

                    <p className="mt-1 text-xs text-[#8793A3]">
                      {profile.dealer_id
                        ? dealerById.get(
                            profile.dealer_id,
                          )?.dealer_name ||
                          "Unknown dealer"
                        : "No dealer assignment"}
                    </p>
                  </div>

                  <select
                    name="role"
                    defaultValue={profile.role}
                    className="h-11 rounded-xl border border-[#CBD4E0] bg-[#F3F5F8] px-3 text-sm font-bold text-[#0D2347] outline-none focus:border-[#BF1A2F] focus:bg-white"
                  >
                    <option value="dealer">
                      Dealer
                    </option>
                    <option value="support">
                      Support
                    </option>
                    <option value="supervisor">
                      Supervisor
                    </option>
                    <option value="admin">
                      Administrator
                    </option>
                  </select>

                  <select
                    name="dealer_id"
                    defaultValue={
                      profile.dealer_id || ""
                    }
                    className="h-11 rounded-xl border border-[#CBD4E0] bg-[#F3F5F8] px-3 text-sm font-medium text-[#0D2347] outline-none focus:border-[#BF1A2F] focus:bg-white"
                  >
                    <option value="">
                      No dealer
                    </option>

                    {activeDealers.map((dealer) => (
                      <option
                        key={dealer.id}
                        value={dealer.id}
                      >
                        {dealer.dealer_name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0D2347] px-4 text-sm font-bold text-white hover:bg-[#1B3A6B]"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                </form>
              );
            })}
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-[#DDE3EA] bg-white shadow-sm">
          <div className="border-b border-[#E4E8EE] px-6 py-5">
            <h3 className="text-xl font-bold text-[#0D2347]">
              Dealer Companies
            </h3>

            <p className="mt-1 text-sm text-[#65758A]">
              Activate or deactivate dealer access.
            </p>
          </div>

          <div className="divide-y divide-[#E9EDF2]">
            {dealers.map((dealer) => {
              const updateStatusAction =
                updateDealerStatus.bind(
                  null,
                  dealer.id,
                );

              return (
                <form
                  key={dealer.id}
                  action={updateStatusAction}
                  className="grid gap-4 px-6 py-5 hover:bg-[#F8F9FB] md:grid-cols-[minmax(240px,1fr)_180px_140px]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-bold text-[#0D2347]">
                        {dealer.dealer_name}
                      </p>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                          dealer.status === "active"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-red-50 text-[#A01525]"
                        }`}
                      >
                        {dealer.status === "active" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}

                        {formatRole(dealer.status)}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-[#65758A]">
                      {dealer.dealer_code ||
                        "No dealer code"}
                      {dealer.email
                        ? ` · ${dealer.email}`
                        : ""}
                    </p>
                  </div>

                  <select
                    name="status"
                    defaultValue={dealer.status}
                    className="h-11 rounded-xl border border-[#CBD4E0] bg-[#F3F5F8] px-3 text-sm font-bold text-[#0D2347] outline-none focus:border-[#BF1A2F] focus:bg-white"
                  >
                    <option value="active">
                      Active
                    </option>
                    <option value="inactive">
                      Inactive
                    </option>
                  </select>

                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0D2347] px-4 text-sm font-bold text-white hover:bg-[#1B3A6B]"
                  >
                    <Save className="h-4 w-4" />
                    Update
                  </button>
                </form>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}