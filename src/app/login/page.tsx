import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    registered?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const {
    error,
    registered,
  } = await searchParams;

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6"
      style={{
        backgroundImage:
          "url('/images/log-in-background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark brand overlay for contrast */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(10,22,40,0.88) 0%, rgba(13,35,71,0.72) 48%, rgba(27,58,107,0.58) 100%)",
        }}
      />

      {/* Soft vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, rgba(10,22,40,0.30) 75%, rgba(10,22,40,0.55) 100%)",
        }}
      />

      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-[0_25px_80px_rgba(0,0,0,0.38)] backdrop-blur-md">
        <header
          className="relative overflow-hidden p-8 text-white"
          style={{
            background:
              "linear-gradient(135deg, #0A1628 0%, #1B3A6B 55%, #0D2347 100%)",
          }}
        >
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#BF1A2F]" />

          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden">
              <img
                src="/images/ag-logo.png"
                alt="Apex Group"
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
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-white/75">
            Sign in to submit, manage, review, and resolve warranty claims.
          </p>
        </header>

        <form
          action={login}
          className="space-y-5 p-7 sm:p-8"
        >
          {registered ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-800">
              {registered === "check-email"
                ? "Account created. Please check your email and confirm your address before signing in."
                : "Account created successfully. You can now sign in."}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700">
              {error}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-[#0D2347]"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="dealer@example.com"
              className="w-full rounded-xl border border-[#CBD4E0] bg-[#F1F3F5] px-4 py-3.5 text-sm font-medium text-[#0D2347] outline-none transition placeholder:text-[#9AA5B3] focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-[#0D2347]"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full rounded-xl border border-[#CBD4E0] bg-[#F1F3F5] px-4 py-3.5 text-sm font-medium text-[#0D2347] outline-none transition placeholder:text-[#9AA5B3] focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-[#A01525] to-[#BF1A2F] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#BF1A2F]/20 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Sign in
          </button>

          <div className="border-t border-[#E1E6EC] pt-5 text-center">
            <p className="text-sm font-medium text-[#65758A]">
              Don&apos;t have an account?
            </p>

            <a
              href="/register"
              className="mt-2 inline-flex items-center justify-center rounded-xl border border-[#0D2347]/15 px-5 py-2.5 text-sm font-bold text-[#0D2347] transition hover:border-[#BF1A2F] hover:bg-[#BF1A2F]/5 hover:text-[#BF1A2F]"
            >
              Create an account
            </a>

            <p className="mt-4 text-xs leading-5 text-[#8793A3]">
              Dealer and support staff access is managed by an administrator.
            </p>
          </div>
        </form>
      </section>

      {/* Bottom brand accent */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-1 bg-[#BF1A2F]" />
    </main>
  );
}
