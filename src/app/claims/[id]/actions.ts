"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

const staffRoles = ["support", "supervisor", "admin"];

const validStatuses = [
  "submitted",
  "under_review",
  "waiting_for_dealer",
  "approved",
  "rejected",
  "closed",
];

async function getAuthenticatedContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    role: profile?.role ?? "dealer",
  };
}

export async function updateClaimStatus(
  claimId: string,
  formData: FormData,
) {
  const { supabase, role } =
    await getAuthenticatedContext();

  if (!staffRoles.includes(role)) {
    redirect(`/claims/${claimId}?error=Permission%20denied`);
  }

  const statusValue = formData.get("status");

  const status =
    typeof statusValue === "string"
      ? statusValue
      : "";

  if (!validStatuses.includes(status)) {
    redirect(`/claims/${claimId}?error=Invalid%20status`);
  }

  const { error } = await supabase
    .from("claims")
    .update({ status })
    .eq("id", claimId);

  if (error) {
    redirect(
      `/claims/${claimId}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath(`/claims/${claimId}`);
  revalidatePath("/claims");
  revalidatePath("/support");
  revalidatePath("/dashboard");

  redirect(`/claims/${claimId}?updated=1`);
}

export async function assignClaimToMe(
  claimId: string,
) {
  const { supabase, user, role } =
    await getAuthenticatedContext();

  if (!staffRoles.includes(role)) {
    redirect(`/claims/${claimId}?error=Permission%20denied`);
  }

  const { error } = await supabase
    .from("claims")
    .update({
      assigned_to: user.id,
      status: "under_review",
    })
    .eq("id", claimId);

  if (error) {
    redirect(
      `/claims/${claimId}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath(`/claims/${claimId}`);
  revalidatePath("/support");
  revalidatePath("/claims");
  revalidatePath("/dashboard");

  redirect(`/claims/${claimId}?assigned=1`);
}

export async function assignClaimToStaff(
  claimId: string,
  formData: FormData,
) {
  const { supabase, role } =
    await getAuthenticatedContext();

  if (!["admin", "supervisor"].includes(role)) {
    redirect(
      `/claims/${claimId}?error=${encodeURIComponent(
        "Permission denied",
      )}`,
    );
  }

  const assigneeValue =
    formData.get("assigned_to");

  const assignedTo =
    typeof assigneeValue === "string"
      ? assigneeValue.trim()
      : "";

  /*
   * Empty value means return the claim
   * to the unassigned queue.
   */
  if (!assignedTo) {
    const { error } = await supabase
      .from("claims")
      .update({
        assigned_to: null,
      })
      .eq("id", claimId);

    if (error) {
      redirect(
        `/claims/${claimId}?error=${encodeURIComponent(
          error.message,
        )}`,
      );
    }

    revalidatePath(`/claims/${claimId}`);
    revalidatePath("/support");
    revalidatePath("/claims");
    revalidatePath("/dashboard");

    redirect(`/claims/${claimId}?assigned=1`);
  }

  /*
   * Never trust the submitted UUID.
   * Confirm that it belongs to an
   * eligible operational staff profile.
   */
  const { data: assignee } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", assignedTo)
    .in("role", staffRoles)
    .maybeSingle();

  if (!assignee) {
    redirect(
      `/claims/${claimId}?error=${encodeURIComponent(
        "Invalid assignee",
      )}`,
    );
  }

  const { error } = await supabase
    .from("claims")
    .update({
      assigned_to: assignee.id,
      status: "under_review",
    })
    .eq("id", claimId);

  if (error) {
    redirect(
      `/claims/${claimId}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath(`/claims/${claimId}`);
  revalidatePath("/support");
  revalidatePath("/claims");
  revalidatePath("/dashboard");

  redirect(`/claims/${claimId}?assigned=1`);
}

export async function sendMessage(
  claimId: string,
  formData: FormData,
) {
  const { supabase, user, role } =
    await getAuthenticatedContext();

  const messageValue = formData.get("message");
  const typeValue = formData.get("message_type");

  const message =
    typeof messageValue === "string"
      ? messageValue.trim()
      : "";

  let messageType =
    typeof typeValue === "string"
      ? typeValue
      : "public";

  if (!message) {
    redirect(
      `/claims/${claimId}?error=Message%20cannot%20be%20empty`,
    );
  }

  const allowedTypes = [
    "public",
    "internal_note",
    "document_request",
  ];

  if (!allowedTypes.includes(messageType)) {
    messageType = "public";
  }

  if (
    messageType === "internal_note" &&
    !staffRoles.includes(role)
  ) {
    redirect(`/claims/${claimId}?error=Permission%20denied`);
  }

  const { error } = await supabase
    .from("messages")
    .insert({
      claim_id: claimId,
      sender_id: user.id,
      message,
      message_type: messageType,
    });

  if (error) {
    redirect(
      `/claims/${claimId}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath(`/claims/${claimId}`);

  redirect(`/claims/${claimId}?message=sent`);
}
