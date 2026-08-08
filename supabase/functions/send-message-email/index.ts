import { createClient } from "npm:@supabase/supabase-js@2";

type NotificationRecord = {
  id: string;
  recipient_id: string;
  claim_id: string | null;
  message_id: string | null;
  notification_type: string;
  title: string | null;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: NotificationRecord | null;
  old_record: NotificationRecord | null;
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

function escapeHtml(
  value: string,
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return jsonResponse(
        {
          error: "Method not allowed",
        },
        405,
      );
    }

    // ======================================================
    // WEBHOOK AUTH
    // ======================================================

    const expectedSecret =
      (
        Deno.env.get(
          "EMAIL_WEBHOOK_SECRET",
        ) || ""
      ).trim();

    const receivedSecret =
      (
        req.headers.get(
          "x-webhook-secret",
        ) || ""
      ).trim();

    if (
      !expectedSecret ||
      receivedSecret !== expectedSecret
    ) {
      console.error(
        "Webhook authentication failed",
      );

      return jsonResponse(
        {
          error: "Unauthorized",
          stage: "webhook_auth",
        },
        401,
      );
    }

    // ======================================================
    // WEBHOOK PAYLOAD
    // ======================================================

    const payload =
      (await req.json()) as WebhookPayload;

    const notification =
      payload.record;

    if (
      payload.type !== "INSERT" ||
      payload.schema !== "public" ||
      payload.table !== "notifications"
    ) {
      return jsonResponse({
        skipped: true,
        reason:
          "Webhook event is not a notification INSERT",
      });
    }

    if (!notification) {
      return jsonResponse(
        {
          error:
            "Webhook notification record is missing",
          stage: "payload",
        },
        400,
      );
    }

    if (
      notification.notification_type !==
      "message_reply"
    ) {
      return jsonResponse({
        skipped: true,
        reason:
          "Notification is not a message reply",
      });
    }

    if (
      !notification.recipient_id ||
      !notification.claim_id
    ) {
      return jsonResponse({
        skipped: true,
        reason:
          "Notification does not have recipient/claim",
      });
    }

    // ======================================================
    // SUPABASE ADMIN CLIENT
    // ======================================================

    const supabaseUrl =
      (
        Deno.env.get(
          "SUPABASE_URL",
        ) || ""
      ).trim();

    const serviceRoleKey =
      (
        Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY",
        ) || ""
      ).trim();

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      throw new Error(
        "Supabase server credentials are missing",
      );
    }

    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );

    // ======================================================
    // RECIPIENT
    // ======================================================

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .select(
          "full_name, email, role",
        )
        .eq(
          "id",
          notification.recipient_id,
        )
        .maybeSingle();

    if (profileError) {
      throw new Error(
        `Profile lookup failed: ${profileError.message}`,
      );
    }

    const role =
      profile?.role ||
      "customer";

    const isSupport =
      [
        "support",
        "supervisor",
        "admin",
      ].includes(role);

    let recipientEmail =
      isSupport
        ? "support@outbackkitters.com"
        : profile?.email || null;

    // Fallback for customer/dealer accounts
    if (
      !recipientEmail &&
      !isSupport
    ) {
      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.admin.getUserById(
          notification.recipient_id,
        );

      if (authError) {
        throw new Error(
          `Auth email lookup failed: ${authError.message}`,
        );
      }

      recipientEmail =
        authData.user?.email ||
        null;
    }

    if (!recipientEmail) {
      return jsonResponse({
        skipped: true,
        reason:
          "Recipient email is missing",
      });
    }

    // ======================================================
    // CLAIM
    // ======================================================

    const {
      data: claim,
      error: claimError,
    } =
      await supabase
        .from("claims")
        .select(
          "id, claim_number",
        )
        .eq(
          "id",
          notification.claim_id,
        )
        .maybeSingle();

    if (
      claimError ||
      !claim
    ) {
      throw new Error(
        claimError?.message ||
          "Claim could not be found",
      );
    }

    // ======================================================
    // RESEND CONFIG
    // ======================================================

    /*
     * Strip every whitespace character from the
     * API key so CR/LF or accidental spaces can
     * never become part of an HTTP header.
     */
    const resendApiKey =
      (
        Deno.env.get(
          "RESEND_API_KEY",
        ) || ""
      ).replace(
        /\s/g,
        "",
      );

    const resendFrom =
      (
        Deno.env.get(
          "RESEND_FROM",
        ) || ""
      )
        .replace(
          /[\r\n]/g,
          "",
        )
        .trim();

    const appUrl =
      (
        Deno.env.get(
          "APP_URL",
        ) || ""
      )
        .replace(
          /[\r\n]/g,
          "",
        )
        .trim()
        .replace(
          /\/$/,
          "",
        );

    if (!resendApiKey) {
      throw new Error(
        "RESEND_API_KEY is missing",
      );
    }

    if (!resendApiKey) {
      return jsonResponse(
        {
          error: "RESEND_API_KEY is missing",
          stage: "resend_configuration",
        },
        500,
      );
    }

    if (!resendFrom) {
      throw new Error(
        "RESEND_FROM is missing",
      );
    }

    // ======================================================
    // EMAIL
    // ======================================================

    const recipientName =
      isSupport
        ? "Support Team"
        : profile?.full_name ||
          "Customer";

    const messageText =
      isSupport
        ? "A dealer or customer has responded to a claim conversation."
        : "The support team has responded to your claim conversation.";

    const claimUrl =
      appUrl
        ? `${appUrl}/claims/${claim.id}`
        : "";

    const html = `
<!doctype html>
<html>
  <body
    style="
      margin:0;
      padding:0;
      background:#F3F5F7;
      font-family:Arial,sans-serif;
      color:#0D2347;
    "
  >
    <table
      width="100%"
      cellspacing="0"
      cellpadding="0"
      role="presentation"
      style="
        padding:32px 16px;
        background:#F3F5F7;
      "
    >
      <tr>
        <td align="center">

          <table
            width="100%"
            cellspacing="0"
            cellpadding="0"
            role="presentation"
            style="
              max-width:600px;
              overflow:hidden;
              background:#ffffff;
              border-radius:18px;
            "
          >
            <tr>
              <td
                style="
                  padding:28px 32px;
                  background:#0A1628;
                  border-bottom:5px solid #BF1A2F;
                "
              >
                <div
                  style="
                    color:#ffffff;
                    font-size:11px;
                    font-weight:700;
                    letter-spacing:2px;
                  "
                >
                  CLAIM & WARRANTY SUPPORT SYSTEM
                </div>

                <div
                  style="
                    margin-top:8px;
                    color:#ffffff;
                    font-size:22px;
                    font-weight:700;
                  "
                >
                  New Claim Response
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:32px;">

                <p
                  style="
                    margin:0 0 18px;
                    font-size:16px;
                    line-height:1.6;
                  "
                >
                  Hi ${escapeHtml(
                    recipientName,
                  )},
                </p>

                <p
                  style="
                    margin:0 0 24px;
                    color:#65758A;
                    font-size:15px;
                    line-height:1.7;
                  "
                >
                  ${escapeHtml(
                    messageText,
                  )}
                </p>

                <div
                  style="
                    padding:18px 20px;
                    border:1px solid #DDE3EA;
                    background:#F7F9FB;
                    border-radius:12px;
                  "
                >
                  <div
                    style="
                      color:#BF1A2F;
                      font-size:11px;
                      font-weight:700;
                      letter-spacing:1.5px;
                    "
                  >
                    CLAIM REFERENCE
                  </div>

                  <div
                    style="
                      margin-top:6px;
                      color:#0D2347;
                      font-size:20px;
                      font-weight:700;
                    "
                  >
                    ${escapeHtml(
                      claim.claim_number,
                    )}
                  </div>
                </div>

                ${
                  claimUrl
                    ? `
                    <div
                      style="
                        margin-top:28px;
                      "
                    >
                      <a
                        href="${escapeHtml(
                          claimUrl,
                        )}"
                        style="
                          display:inline-block;
                          padding:13px 24px;
                          border-radius:10px;
                          background:#BF1A2F;
                          color:#ffffff;
                          font-size:14px;
                          font-weight:700;
                          text-decoration:none;
                        "
                      >
                        View Claim
                      </a>
                    </div>
                    `
                    : ""
                }

                <p
                  style="
                    margin:30px 0 0;
                    color:#8793A3;
                    font-size:12px;
                    line-height:1.6;
                  "
                >
                  For security, message contents are not
                  included in this notification email.
                  Sign in to review the conversation.
                </p>

              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
`;

    console.log(
      "Sending Resend email",
      {
        recipient:
          recipientEmail,

        claim:
          claim.claim_number,

        apiKeyLength:
          resendApiKey.length,

        from:
          resendFrom,
      },
    );

    // ======================================================
    // SEND TO RESEND
    // ======================================================

    /*
     * Keep HTTP headers deliberately minimal.
     * Idempotency-Key has been removed while
     * diagnosing the previous header parse error.
     */
    const resendResponse =
      await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",

          headers: {
            "Authorization":
              `Bearer ${resendApiKey}`,

            "Content-Type":
              "application/json",

            "User-Agent":
              "ag-claim-support/1.0",
          },

          body:
            JSON.stringify({
              from:
                resendFrom,

              to: [
                recipientEmail,
              ],

              subject:
                `New response on claim ${claim.claim_number}`,

              html,
            }),
        },
      );

    const responseText =
      await resendResponse.text();

    let resendResult:
      Record<string, unknown>;

    try {
      resendResult =
        JSON.parse(
          responseText,
        );
    } catch {
      resendResult = {
        raw:
          responseText,
      };
    }

    if (!resendResponse.ok) {
      console.error(
        "Resend rejected email",
        {
          status:
            resendResponse.status,

          response:
            resendResult,
        },
      );

      return jsonResponse(
        {
          error:
            "Resend rejected the email",

          stage:
            "resend_api",

          resend_status:
            resendResponse.status,

          resend:
            resendResult,
        },
        502,
      );
    }

    console.log(
      "Email successfully accepted by Resend",
      {
        recipient:
          recipientEmail,

        response:
          resendResult,
      },
    );

    return jsonResponse({
      success: true,

      recipient:
        recipientEmail,

      resend:
        resendResult,
    });
  } catch (error) {
    console.error(
      "send-message-email failed",
      error,
    );

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error",

        stage:
          "edge_function",
      },
      500,
    );
  }
});