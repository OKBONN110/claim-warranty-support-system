import { createClient } from "../lib/supabase/server";

type ClaimWarrantyDetailsProps = {
  claimId: string;
};

function formatLabel(value: string | null) {
  if (!value) {
    return "Not provided";
  }

  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatInstallMonth(
  value: string | null,
) {
  if (!value) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function ClaimWarrantyDetails({
  claimId,
}: ClaimWarrantyDetailsProps) {
  const supabase = await createClient();

  const { data: claim } = await supabase
    .from("claims")
    .select(
      "customer_name, customer_email, customer_phone, invoice_or_po_number, install_month, faulty_part_numbers, vehicle_side, description",
    )
    .eq("id", claimId)
    .maybeSingle();

  if (!claim) {
    return null;
  }

  const details = [
    {
      label: "First name",
      value: claim.customer_name,
    },
    {
      label: "Email",
      value: claim.customer_email,
    },
    {
      label: "Phone",
      value: claim.customer_phone,
    },
    {
      label: "Invoice / customer PO",
      value: claim.invoice_or_po_number,
    },
    {
      label: "Installation date",
      value: formatInstallMonth(
        claim.install_month,
      ),
    },
    {
      label: "Faulty part number(s)",
      value: claim.faulty_part_numbers,
    },
    {
      label: "Side of vehicle",
      value: formatLabel(
        claim.vehicle_side,
      ),
    },
  ];

  return (
    <details className="group overflow-hidden rounded-2xl border border-[#DDE3EA] bg-white text-[#0D2347] shadow-sm">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-left sm:px-6 [&::-webkit-details-marker]:hidden">
        <div>
          <h3 className="text-lg font-extrabold">
            Warranty Claim Details
          </h3>

          <p className="mt-1 text-xs text-[#65758A]">
            Contact, invoice, installation and faulty part information
          </p>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0D2347]/5 text-[#0D2347]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </summary>

      <div className="border-t border-[#E5E9EF] p-4 sm:p-6">
      <dl className="grid gap-5 sm:grid-cols-2">
        {details.map((detail) => (
          <div
            key={detail.label}
            className="rounded-xl border border-[#0D2347]/10 bg-[#F6F8FC] p-4"
          >
            <dt className="text-xs font-bold uppercase tracking-wide text-[#1B3A6B]">
              {detail.label}
            </dt>

            <dd className="mt-2 break-words font-semibold text-[#0D2347]">
              {detail.value || "Not provided"}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 rounded-xl border border-[#0D2347]/10 bg-[#F6F8FC] p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#1B3A6B]">
          Full description of fault
        </p>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#0D2347]">
          {claim.description}
        </p>
      </div>
      </div>
    </details>
  );
}
