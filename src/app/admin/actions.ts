"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "../../lib/supabase/admin";
import { createClient } from "../../lib/supabase/server";

const validRoles = new Set([
  "dealer",
  "support",
  "supervisor",
  "admin",
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

function adminError(message: string): never {
  redirect(
    `/admin?error=${encodeURIComponent(message)}`,
  );
}

async function requireAdmin() {
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

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

export async function createDealer(
  formData: FormData,
) {
  await requireAdmin();

  const dealerName = readText(
    formData,
    "dealer_name",
  );

  const rawDealerCode = readText(
    formData,
    "dealer_code",
  );

  const email = readText(
    formData,
    "email",
  );

  const phone = readText(
    formData,
    "phone",
  );

  const address = readText(
    formData,
    "address",
  );

  if (!dealerName || !rawDealerCode) {
    adminError(
      "Dealer name and dealer code are required.",
    );
  }

  const dealerCode = rawDealerCode
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");

  if (!dealerCode) {
    adminError("Dealer code is invalid.");
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("dealers")
    .insert({
      dealer_name: dealerName,
      dealer_code: dealerCode,
      email: email || null,
      phone: phone || null,
      address: address || null,
      status: "active",
    });

  if (error) {
    adminError(error.message);
  }

  revalidatePath("/admin");

  redirect("/admin?created=dealer");
}

export async function createPortalUser(
  formData: FormData,
) {
  await requireAdmin();

  const fullName = readText(
    formData,
    "full_name",
  );

  const email = readText(
    formData,
    "email",
  ).toLowerCase();

  const password = readText(
    formData,
    "password",
  );

  const requestedRole = readText(
    formData,
    "role",
  );

  const requestedDealerId = readText(
    formData,
    "dealer_id",
  );

  if (!fullName || !email || !password) {
    adminError(
      "Name, email, and temporary password are required.",
    );
  }

  if (password.length < 8) {
    adminError(
      "The temporary password must contain at least 8 characters.",
    );
  }

  const role = validRoles.has(requestedRole)
    ? requestedRole
    : "dealer";

  const dealerId =
    role === "dealer" &&
    requestedDealerId
      ? requestedDealerId
      : null;

  if (role === "dealer" && !dealerId) {
    adminError(
      "A dealer company must be selected for a dealer user.",
    );
  }

  const admin = createAdminClient();

  const {
    data,
    error: createUserError,
  } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
    },
  });

  if (createUserError || !data.user) {
    adminError(
      createUserError?.message ||
        "Unable to create the user.",
    );
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        id: data.user.id,
        full_name: fullName,
        email,
        role,
        dealer_id: dealerId,
      },
      {
        onConflict: "id",
      },
    );

  if (profileError) {
    await admin.auth.admin.deleteUser(
      data.user.id,
    );

    adminError(profileError.message);
  }

  revalidatePath("/admin");

  redirect("/admin?created=user");
}

export async function updateUserAccess(
  profileId: string,
  formData: FormData,
) {
  const currentUser = await requireAdmin();

  const requestedRole = readText(
    formData,
    "role",
  );

  const requestedDealerId = readText(
    formData,
    "dealer_id",
  );

  if (!validRoles.has(requestedRole)) {
    adminError("The selected role is invalid.");
  }

  if (
    profileId === currentUser.id &&
    requestedRole !== "admin"
  ) {
    adminError(
      "You cannot remove your own administrator access.",
    );
  }

  const dealerId =
    requestedRole === "dealer" &&
    requestedDealerId
      ? requestedDealerId
      : null;

  if (
    requestedRole === "dealer" &&
    !dealerId
  ) {
    adminError(
      "Dealer users must be assigned to a dealer company.",
    );
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({
      role: requestedRole,
      dealer_id: dealerId,
    })
    .eq("id", profileId);

  if (error) {
    adminError(error.message);
  }

  const { error: metadataError } =
    await admin.auth.admin.updateUserById(
      profileId,
      {
        user_metadata: {
          role: requestedRole,
        },
      },
    );

  if (metadataError) {
    adminError(metadataError.message);
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");

  redirect("/admin?updated=user");
}

export async function updateDealerStatus(
  dealerId: string,
  formData: FormData,
) {
  await requireAdmin();

  const requestedStatus = readText(
    formData,
    "status",
  );

  const status =
    requestedStatus === "inactive"
      ? "inactive"
      : "active";

  const admin = createAdminClient();

  const { error } = await admin
    .from("dealers")
    .update({ status })
    .eq("id", dealerId);

  if (error) {
    adminError(error.message);
  }

  revalidatePath("/admin");

  redirect("/admin?updated=dealer");
}