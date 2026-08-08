"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

function readText(
  formData: FormData,
  field: string,
) {
  const value = formData.get(field);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function registrationError(
  message: string,
): never {
  redirect(
    `/register?error=${encodeURIComponent(
      message,
    )}`,
  );
}

export async function registerCustomer(
  formData: FormData,
) {
  const firstName = readText(
    formData,
    "first_name",
  );

  const lastName = readText(
    formData,
    "last_name",
  );

  const email = readText(
    formData,
    "email",
  ).toLowerCase();

  const phone = readText(
    formData,
    "phone",
  );

  const password = readText(
    formData,
    "password",
  );

  const confirmPassword = readText(
    formData,
    "confirm_password",
  );

  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !confirmPassword
  ) {
    registrationError(
      "Please complete all required fields.",
    );
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    registrationError(
      "Please enter a valid email address.",
    );
  }

  if (password.length < 8) {
    registrationError(
      "Password must contain at least 8 characters.",
    );
  }

  if (
    password !==
    confirmPassword
  ) {
    registrationError(
      "Passwords do not match.",
    );
  }

  const fullName =
    `${firstName} ${lastName}`.trim();

  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase.auth.signUp({
    email,
    password,

    options: {
      data: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      },
    },
  });

  if (error) {
    registrationError(
      error.message,
    );
  }

  if (!data.user) {
    registrationError(
      "Unable to create your account.",
    );
  }

  /*
   * public.profiles is created automatically
   * by the auth.users database trigger.
   */

  if (!data.session) {
    redirect(
      "/login?registered=check-email",
    );
  }

  redirect(
    "/login?registered=1",
  );
}