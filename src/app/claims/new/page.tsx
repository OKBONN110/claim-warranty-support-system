import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "../../../components/app-shell";
import { createClient } from "../../../lib/supabase/server";
import { createClaim } from "../actions";

type NewClaimPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewClaimPage({
  searchParams,
}: NewClaimPageProps) {
  const { error } = await searchParams;

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

  if (!["dealer", "customer", "admin"].includes(role)) {
    redirect("/claims");
  }

  return (
    <AppShell
      title="Submit Warranty Claim"
      userName={userName}
      role={role}
    >
      <div className="warranty-page-container">
        <Link
          href="/claims"
          className="warranty-back-link"
        >
          <span aria-hidden="true">Ã¢â€ Â</span>
          Back to claims
        </Link>

        <section className="warranty-form-panel mt-5">
          <header className="warranty-form-header px-6 py-7 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#BF1A2F]">
                  Dealer warranty request
                </p>

                <h2 className="mt-2 text-3xl font-bold text-[#0D2347]">
                  Warranty Claim Form
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4B5F7A]">
                  Provide accurate customer, installation, component, and
                  photographic information so the support team can review the
                  claim without unnecessary delays.
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full bg-[#BF1A2F]/10 px-4 py-2 text-xs font-bold text-[#A01525]">
                * Required fields
              </span>
            </div>
          </header>

          {error ? (
            <div className="mx-6 mt-6 rounded-xl border border-[#BF1A2F]/25 bg-[#BF1A2F]/10 px-4 py-3 text-sm font-semibold text-[#A01525] sm:mx-8">
              {error}
            </div>
          ) : null}

          <form
            action={createClaim}
            encType="multipart/form-data"
            className="space-y-6 p-6 sm:p-8"
          >
            <section className="warranty-section">
              <h3 className="warranty-section-title">
                Customer Details
              </h3>

              <p className="mt-2 text-sm text-[#62738A]">
                Enter the contact information for the customer associated with
                this warranty request.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="warranty-field-label">
                  First name *
                  <input
                    name="first_name"
                    required
                    autoComplete="given-name"
                    placeholder="Enter the customer first name"
                    className="warranty-form-input"
                  />
                </label>

                <label className="warranty-field-label">
                  Email address *
                  <input
                    name="customer_email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="customer@example.com"
                    className="warranty-form-input"
                  />
                </label>
              </div>

              <div className="mt-5">
                <label className="warranty-field-label">
                  Phone number *
                </label>

                <div className="warranty-phone-grid mt-2">
                  <select
                    name="country_code"
                    defaultValue="+61"
                    aria-label="Country code"
                    className="warranty-form-input mt-0"
                  >
                    <option value="+61">AU +61</option>
                    <option value="+64">NZ +64</option>
                    <option value="+1">US +1</option>
                    <option value="+44">UK +44</option>
                  </select>

                  <input
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="Enter the customer phone number"
                    className="warranty-form-input mt-0"
                  />
                </div>
              </div>
            </section>

            <section className="warranty-section">
              <h3 className="warranty-section-title">
                Purchase and Installation
              </h3>

              <p className="mt-2 text-sm text-[#62738A]">
                These references help confirm the purchase and approximate
                installation period.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="warranty-field-label">
                  OK invoice or customer PO number *
                  <input
                    name="invoice_or_po_number"
                    required
                    placeholder="Enter invoice or customer PO number"
                    className="warranty-form-input"
                  />
                </label>

                <label className="warranty-field-label">
                  Approximate installation month *
                  <input
                    name="install_month"
                    type="month"
                    required
                    className="warranty-form-input"
                  />
                </label>
              </div>
            </section>

            <section className="warranty-section">
              <h3 className="warranty-section-title">
                Fault Information
              </h3>

              <p className="mt-2 text-sm text-[#62738A]">
                Identify the affected component and explain the fault as
                clearly as possible.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="warranty-field-label">
                  Faulty component part number(s) *
                  <input
                    name="faulty_part_numbers"
                    required
                    placeholder="Example: OKP-1234, OKP-5678"
                    className="warranty-form-input"
                  />

                  <span className="warranty-field-helper">
                    Separate multiple part numbers with commas.
                  </span>
                </label>

                <label className="warranty-field-label">
                  Side of vehicle *
                  <select
                    name="vehicle_side"
                    required
                    defaultValue=""
                    className="warranty-form-input"
                  >
                    <option value="" disabled>
                      Select the affected side
                    </option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="front">Front</option>
                    <option value="rear">Rear</option>
                    <option value="both">Both sides</option>
                    <option value="not_applicable">
                      Not applicable
                    </option>
                  </select>
                </label>
              </div>

              <label className="warranty-field-label mt-5">
                Full description of fault *
                <textarea
                  name="description"
                  required
                  rows={7}
                  placeholder="Describe when the issue began, what happened, how the product behaves, and any troubleshooting already completed."
                  className="warranty-form-input"
                />

                <span className="warranty-field-helper">
                  Include symptoms, operating conditions, and relevant testing
                  already performed.
                </span>
              </label>
            </section>

            <section className="warranty-section">
              <h3 className="warranty-section-title">
                Photo & Video Evidence
              </h3>

              <p className="mt-2 text-sm text-[#62738A]">
                Add clear photos showing the faulty component, installation,
                labels, and surrounding area.
              </p>

              <div className="warranty-photo-box">
                <input
                  name="photo_evidence"
                  type="file"
                  required
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov,.webm,image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
                  className="warranty-photo-input"
                />

                <p className="mt-4 text-sm leading-6">
                  Upload one to five images. Each image must be no larger than
                  6 MB. Clear, well-lit photographs help reduce review time.
                </p>
              </div>
            </section>

            <div className="warranty-submit-area">
              <button
                type="submit"
                className="warranty-submit-button"
              >
                Submit Warranty Claim
              </button>

              <p className="mt-3 text-center text-xs text-[#62738A]">
                Review all information before submitting. You can add more
                documents and communicate with support after the claim is
                created.
              </p>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}