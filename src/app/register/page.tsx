import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
} from "lucide-react";
import { registerCustomer } from "./actions";

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const {
    error,
  } =
    await searchParams;

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6"
      style={{
        backgroundImage:
          "url('/images/log-in-background.png')",

        backgroundSize:
          "cover",

        backgroundPosition:
          "center",

        backgroundRepeat:
          "no-repeat",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(10,22,40,0.90) 0%, rgba(13,35,71,0.76) 48%, rgba(27,58,107,0.60) 100%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, rgba(10,22,40,0.30) 75%, rgba(10,22,40,0.55) 100%)",
        }}
      />

      <section className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-[0_25px_80px_rgba(0,0,0,0.38)] backdrop-blur-md">
        <header
          className="relative overflow-hidden p-7 text-white sm:p-8"
          style={{
            background:
              "linear-gradient(135deg, #0A1628 0%, #1B3A6B 55%, #0D2347 100%)",
          }}
        >
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#BF1A2F]" />

          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center">
              <img
                src="/images/ag-logo.png"
                alt="AG"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                DEALER &amp; CUSTOMER
              </p>

              <h1 className="mt-2 text-xl font-bold leading-tight text-white sm:text-2xl">
                CLAIM &amp; WARRANTY SUPPORT SYSTEM
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/75">
                Create your customer account to submit and track warranty claims.
              </p>
            </div>
          </div>
        </header>

        <form
          action={registerCustomer}
          className="p-7 sm:p-8"
        >
          {error ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#0D2347]">
              First name *

              <input
                name="first_name"
                type="text"
                required
                autoComplete="given-name"
                placeholder="First name"
                className="mt-2 w-full rounded-xl border border-[#CBD4E0] bg-[#F1F3F5] px-4 py-3.5 text-sm font-medium text-[#0D2347] outline-none placeholder:text-[#9AA5B3] focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10"
              />
            </label>

            <label className="block text-sm font-semibold text-[#0D2347]">
              Last name *

              <input
                name="last_name"
                type="text"
                required
                autoComplete="family-name"
                placeholder="Last name"
                className="mt-2 w-full rounded-xl border border-[#CBD4E0] bg-[#F1F3F5] px-4 py-3.5 text-sm font-medium text-[#0D2347] outline-none placeholder:text-[#9AA5B3] focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10"
              />
            </label>

            <label className="block text-sm font-semibold text-[#0D2347] sm:col-span-2">
              Email address *

              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-[#CBD4E0] bg-[#F1F3F5] px-4 py-3.5 text-sm font-medium text-[#0D2347] outline-none placeholder:text-[#9AA5B3] focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10"
              />
            </label>

            <label className="block text-sm font-semibold text-[#0D2347] sm:col-span-2">
              Phone number

              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+61 ..."
                className="mt-2 w-full rounded-xl border border-[#CBD4E0] bg-[#F1F3F5] px-4 py-3.5 text-sm font-medium text-[#0D2347] outline-none placeholder:text-[#9AA5B3] focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10"
              />
            </label>

            <label className="block text-sm font-semibold text-[#0D2347]">
              Password *

              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                className="mt-2 w-full rounded-xl border border-[#CBD4E0] bg-[#F1F3F5] px-4 py-3.5 text-sm font-medium text-[#0D2347] outline-none placeholder:text-[#9AA5B3] focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10"
              />
            </label>

            <label className="block text-sm font-semibold text-[#0D2347]">
              Confirm password *

              <input
                name="confirm_password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Repeat password"
                className="mt-2 w-full rounded-xl border border-[#CBD4E0] bg-[#F1F3F5] px-4 py-3.5 text-sm font-medium text-[#0D2347] outline-none placeholder:text-[#9AA5B3] focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10"
              />
            </label>
          </div>

          <div className="mt-6 rounded-xl border border-[#CBD4E0] bg-[#F6F8FA] p-4">
            <p className="text-xs leading-5 text-[#65758A]">
              Customer registration provides access to your own warranty claims. Dealer and staff access is managed separately by an administrator.
            </p>
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#A01525] to-[#BF1A2F] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#BF1A2F]/20 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <UserPlus className="h-4 w-4" />

            Create Account
          </button>

          <Link
            href="/login"
            className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-[#1B3A6B] transition hover:text-[#BF1A2F]"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to Sign In
          </Link>
        </form>
      </section>

      <div className="absolute bottom-0 left-0 right-0 z-10 h-1 bg-[#BF1A2F]" />
    </main>
  );
}