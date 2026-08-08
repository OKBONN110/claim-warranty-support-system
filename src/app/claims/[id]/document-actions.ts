"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const allowedMimeTypes =
  new Set([
    "application/pdf",

    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",

    "video/mp4",
    "video/quicktime",
    "video/webm",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]);

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
    "evidence"
  );
}

export async function uploadClaimDocument(
  claimId: string,
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

  const { data: claim } =
    await supabase
      .from("claims")
      .select("id")
      .eq(
        "id",
        claimId,
      )
      .maybeSingle();

  if (!claim) {
    redirect(
      `/claims/${claimId}?error=Claim%20not%20found%20or%20access%20denied`,
    );
  }

  const fileValue =
    formData.get("file");

  if (
    !(fileValue instanceof File) ||
    fileValue.size === 0
  ) {
    redirect(
      `/claims/${claimId}?error=Please%20select%20a%20file`,
    );
  }

  if (
    fileValue.size >
    MAX_FILE_SIZE
  ) {
    redirect(
      `/claims/${claimId}?error=${encodeURIComponent(
        `${fileValue.name} exceeds the 10 MB file limit`,
      )}`,
    );
  }

  if (
    !allowedMimeTypes.has(
      fileValue.type,
    )
  ) {
    redirect(
      `/claims/${claimId}?error=${encodeURIComponent(
        `${fileValue.name} is not a supported file type`,
      )}`,
    );
  }

  const fileName =
    safeFileName(
      fileValue.name,
    );

  const storagePath = [
    claimId,
    user.id,
    `${crypto.randomUUID()}-${fileName}`,
  ].join("/");

  const fileBuffer =
    Buffer.from(
      await fileValue.arrayBuffer(),
    );

  const {
    error: uploadError,
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
            fileValue.type ||
            "application/octet-stream",

          cacheControl:
            "3600",

          upsert:
            false,
        },
      );

  if (uploadError) {
    redirect(
      `/claims/${claimId}?error=${encodeURIComponent(
        uploadError.message,
      )}`,
    );
  }

  const {
    error: metadataError,
  } =
    await supabase
      .from(
        "claim_documents",
      )
      .insert({
        claim_id:
          claimId,

        storage_path:
          storagePath,

        file_name:
          fileValue.name,

        mime_type:
          fileValue.type ||
          "application/octet-stream",

        file_size:
          fileValue.size,

        uploaded_by:
          user.id,
      });

  if (metadataError) {
    await supabase.storage
      .from(
        "claim-documents",
      )
      .remove([
        storagePath,
      ]);

    redirect(
      `/claims/${claimId}?error=${encodeURIComponent(
        metadataError.message,
      )}`,
    );
  }

  revalidatePath(
    `/claims/${claimId}`,
  );

  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    "/support",
  );

  redirect(
    `/claims/${claimId}#documents`,
  );
}