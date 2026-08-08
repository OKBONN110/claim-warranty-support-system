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
    <section className="rounded-3xl bg-white p-6 text-[#0D2347] shadow-xl sm:p-8">
      <div className="border-b border-[#0D2347]/10 pb-5">
        <h3 className="text-xl font-bold">
          Warranty Claim Details
        </h3>
      </div>

      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
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
    </section>
  );
}