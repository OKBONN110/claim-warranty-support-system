"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import {
  validateEvidenceFiles,
} from "../../lib/claim-evidence";

const allowedVehicleSides = new Set([
  "left",
  "right",
  "front",
  "rear",
  "both",
  "not_applicable",
]);

function readText(
  formData: FormData,
  field: string,
) {
  const value = formData.get(field);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function createClaimNumber() {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const randomPart = crypto
    .randomUUID()
    .slice(0, 6)
    .toUpperCase();

  return `CLM-${datePart}-${randomPart}`;
}

function safeFileName(
  fileName: string,
) {
  const cleaned = fileName
    .normalize("NFKD")
    .replace(
      /[^a-zA-Z0-9._-]+/g,
      "-",
    )
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return (
    cleaned.slice(0, 120) ||
    "evidence-file"
  );
}

export async function createClaim(
  formData: FormData,
) {
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
      .select("dealer_id, role")
      .eq("id", user.id)
      .maybeSingle();

  const role =
    profile?.role ?? "dealer";

  if (
    ![
      "dealer",
      "customer",
      "admin",
    ].includes(role)
  ) {
    redirect(
      "/claims/new?error=Your%20account%20cannot%20create%20claims",
    );
  }

  const firstName =
    readText(
      formData,
      "first_name",
    );

  const email =
    readText(
      formData,
      "customer_email",
    );

  const countryCode =
    readText(
      formData,
      "country_code",
    );

  const phoneNumber =
    readText(
      formData,
      "phone",
    );

  const invoiceOrPoNumber =
    readText(
      formData,
      "invoice_or_po_number",
    );

  const installMonth =
    readText(
      formData,
      "install_month",
    );

  const faultyPartNumbers =
    readText(
      formData,
      "faulty_part_numbers",
    );

  const vehicleSide =
    readText(
      formData,
      "vehicle_side",
    );

  const description =
    readText(
      formData,
      "description",
    );

  if (
    !firstName ||
    !email ||
    !phoneNumber ||
    !invoiceOrPoNumber ||
    !installMonth ||
    !faultyPartNumbers ||
    !vehicleSide ||
    !description
  ) {
    redirect(
      "/claims/new?error=Please%20complete%20all%20required%20fields",
    );
  }

  if (
    !/^\d{4}-\d{2}$/.test(
      installMonth,
    )
  ) {
    redirect(
      "/claims/new?error=Installation%20month%20is%20invalid",
    );
  }

  if (
    !allowedVehicleSides.has(
      vehicleSide,
    )
  ) {
    redirect(
      "/claims/new?error=Vehicle%20side%20is%20invalid",
    );
  }

  /*
   * =====================================================
   * PHOTO / VIDEO EVIDENCE
   * =====================================================
   */

  const evidenceValues =
    formData
      .getAll(
        "photo_evidence",
      )
      .filter(
        (
          value,
        ): value is File =>
          value instanceof File &&
          value.size > 0,
      );

  if (
    evidenceValues.length === 0
  ) {
    redirect(
      "/claims/new?error=Please%20upload%20at%20least%20one%20photo%20or%20video",
    );
  }

  const evidenceValidation =
    validateEvidenceFiles(
      evidenceValues,
    );

  if (
    evidenceValidation.error
  ) {
    redirect(
      `/claims/new?error=${encodeURIComponent(
        evidenceValidation.error,
      )}`,
    );
  }

  const evidenceFiles =
    evidenceValidation.files;

  /*
   * =====================================================
   * CUSTOMER INFORMATION
   * =====================================================
   */

  const customerPhone = [
    countryCode,
    phoneNumber,
  ]
    .filter(Boolean)
    .join(" ");

  const claimNumber =
    createClaimNumber();

  /*
   * =====================================================
   * CREATE CLAIM
   * =====================================================
   */

  const {
    data: claim,
    error: claimError,
  } = await supabase
    .from("claims")
    .insert({
      claim_number:
        claimNumber,

      dealer_id:
        profile?.dealer_id ??
        null,

      customer_name:
        firstName,

      customer_email:
        email,

      customer_phone:
        customerPhone,

      invoice_or_po_number:
        invoiceOrPoNumber,

      install_month:
        `${installMonth}-01`,

      faulty_part_numbers:
        faultyPartNumbers,

      vehicle_side:
        vehicleSide,

      description,

      product_name:
        "Vehicle component",

      claim_type:
        "warranty",

      priority:
        "medium",

      status:
        "submitted",

      created_by:
        user.id,
    })
    .select(
      "id, claim_number",
    )
    .single();

  if (
    claimError ||
    !claim
  ) {
    redirect(
      `/claims/new?error=${encodeURIComponent(
        claimError?.message ??
          "Unable to create claim",
      )}`,
    );
  }

  /*
   * =====================================================
   * UPLOAD EVIDENCE FILES
   * =====================================================
   */

  const failedUploads:
    string[] = [];

  for (
    const file of
    evidenceFiles
  ) {
    const safeName =
      safeFileName(
        file.name,
      );

    const storagePath = [
      claim.id,
      user.id,
      `${crypto.randomUUID()}-${safeName}`,
    ].join("/");

    try {
      const fileBuffer =
        Buffer.from(
          await file.arrayBuffer(),
        );

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(
            "claim-documents",
          )
          .upload(
            storagePath,
            fileBuffer,
            {
              contentType:
                file.type ||
                "application/octet-stream",

              cacheControl:
                "3600",

              upsert:
                false,
            },
          );

      if (
        uploadError
      ) {
        console.error(
          "Evidence upload failed:",
          file.name,
          uploadError.message,
        );

        failedUploads.push(
          file.name,
        );

        continue;
      }

      /*
       * Save metadata after
       * successful Storage upload.
       */
      const {
        error:
          metadataError,
      } =
        await supabase
          .from(
            "claim_documents",
          )
          .insert({
            claim_id:
              claim.id,

            storage_path:
              storagePath,

            file_name:
              file.name,

            mime_type:
              file.type ||
              "application/octet-stream",

            file_size:
              file.size,

            uploaded_by:
              user.id,
          });

      if (
        metadataError
      ) {
        console.error(
          "Evidence metadata insert failed:",
          file.name,
          metadataError.message,
        );

        /*
         * Avoid leaving an
         * orphan Storage object.
         */
        await supabase.storage
          .from(
            "claim-documents",
          )
          .remove([
            storagePath,
          ]);

        failedUploads.push(
          file.name,
        );
      }
    }
    catch (error) {
      console.error(
        "Unexpected evidence upload error:",
        file.name,
        error,
      );

      failedUploads.push(
        file.name,
      );
    }
  }

  /*
   * =====================================================
   * REFRESH PAGES
   * =====================================================
   */

  revalidatePath(
    "/claims",
  );

  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    `/claims/${claim.id}`,
  );

  /*
   * Claim creation is still successful even if
   * an individual evidence upload fails.
   */
  if (
    failedUploads.length > 0
  ) {
    redirect(
      `/claims/${claim.id}?error=${encodeURIComponent(
        `Claim created, but these evidence files failed to upload: ${failedUploads.join(
          ", ",
        )}`,
      )}`,
    );
  }

  redirect(
    `/claims/${claim.id}?created=1`,
  );
}