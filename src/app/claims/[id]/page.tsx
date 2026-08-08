import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  notFound,
  redirect,
} from "next/navigation";
import {
  CheckCircle2,
  CircleDot,
  Clock3,
  FileImage,
  FileText,
  MessageCircle,
  StickyNote,
} from "lucide-react";
import AppShell from "../../../components/app-shell";
import ClaimWarrantyDetails from "../../../components/claim-warranty-details";
import ClaimDocuments from "../../../components/claim-documents";
import ClaimNotificationReader from "../../../components/claim-notification-reader";
import { createClient } from "../../../lib/supabase/server";
import {
  assignClaimToMe,
  assignClaimToStaff,
  sendMessage,
  updateClaimStatus,
} from "./actions";

type ClaimDetailPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
    updated?: string;
    assigned?: string;
    message?: string;
  }>;
};

type ActivityItem = {
  id: string;
  type:
    | "created"
    | "history"
    | "message"
    | "internal"
    | "document";

  title: string;
  detail: string | null;
  createdAt: string;
};

function formatLabel(
  value: string,
) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(
    new Date(value),
  );
}

function getActivityIcon(
  type: ActivityItem["type"],
) {
  switch (type) {
    case "message":
      return MessageCircle;

    case "internal":
      return StickyNote;

    case "document":
      return FileImage;

    case "history":
      return Clock3;

    default:
      return CheckCircle2;
  }
}

function getActivityClasses(
  type: ActivityItem["type"],
) {
  switch (type) {
    case "message":
      return "bg-[#1B3A6B] text-white";

    case "internal":
      return "bg-amber-500 text-white";

    case "document":
      return "bg-[#BF1A2F] text-white";

    case "history":
      return "bg-[#0D2347] text-white";

    default:
      return "bg-emerald-600 text-white";
  }
}

export default async function ClaimDetailPage({
  params,
  searchParams,
}: ClaimDetailPageProps) {
  const {
    id,
  } = await params;

  const {
    error,
    updated,
    assigned,
    message,
  } = await searchParams;

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: profile,
  } =
    await supabase
      .from("profiles")
      .select(
        "full_name, role",
      )
      .eq(
        "id",
        user.id,
      )
      .maybeSingle();

  const role =
    profile?.role ||
    "dealer";

  const canAssignStaff =
    ["admin", "supervisor"].includes(role);

  const {
    data: assignableStaff,
  } = canAssignStaff
    ? await supabase
        .from("profiles")
        .select(
          "id, full_name, email, role",
        )
        .in(
          "role",
          [
            "support",
            "supervisor",
            "admin",
          ],
        )
        .order(
          "full_name",
          {
            ascending: true,
          },
        )
    : {
        data: [],
      };

  const {
    data: claim,
    error: claimError,
  } =
    await supabase
      .from("claims")
      .select(
        "id, claim_number, customer_name, customer_email, product_name, serial_number, claim_type, description, requested_amount, priority, status, created_by, assigned_to, created_at, updated_at",
      )
      .eq(
        "id",
        id,
      )
      .maybeSingle();

  if (
    claimError ||
    !claim
  ) {
    notFound();
  }

  const [
    messagesResult,
    historyResult,
    documentsResult,
  ] =
    await Promise.all([
      supabase
        .from("messages")
        .select(
          "id, sender_id, message, message_type, created_at",
        )
        .eq(
          "claim_id",
          id,
        )
        .order(
          "created_at",
          {
            ascending: true,
          },
        ),

      supabase
        .from(
          "claim_history",
        )
        .select(
          "id, action, old_value, new_value, created_at",
        )
        .eq(
          "claim_id",
          id,
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        ),

      supabase
        .from(
          "claim_documents",
        )
        .select(
          "id, file_name, mime_type, created_at",
        )
        .eq(
          "claim_id",
          id,
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        ),
    ]);

  const messages =
    messagesResult.data ??
    [];

  const history =
    historyResult.data ??
    [];

  const documents =
    documentsResult.data ??
    [];

  const userName =
    profile?.full_name ||
    user.email ||
    "User";

  const isStaff =
    [
      "support",
      "supervisor",
      "admin",
    ].includes(role);

  const updateStatus =
    updateClaimStatus.bind(
      null,
      claim.id,
    );

  const assignToMe =
    assignClaimToMe.bind(
      null,
      claim.id,
    );

  const assignToStaff =
    assignClaimToStaff.bind(
      null,
      claim.id,
    );

  const addMessage =
    sendMessage.bind(
      null,
      claim.id,
    );

  const activity:
    ActivityItem[] = [
      {
        id:
          `created-${claim.id}`,

        type:
          "created" as const,

        title:
          "Claim submitted",

        detail:
          `${claim.claim_number} entered the support queue.`,

        createdAt:
          claim.created_at,
      },

      ...history.map(
        (item): ActivityItem => ({
          id:
            `history-${item.id}`,

          type:
            "history",

          title:
            formatLabel(
              item.action,
            ),

          detail:
            item.old_value ||
            item.new_value
              ? `${
                  item.old_value
                    ? `${formatLabel(
                        item.old_value,
                      )} to `
                    : ""
                }${
                  item.new_value
                    ? formatLabel(
                        item.new_value,
                      )
                    : ""
                }`
              : null,

          createdAt:
            item.created_at,
        }),
      ),

      ...messages.map(
        (item): ActivityItem => {
          const internal =
            item.message_type ===
            "internal_note";

          const documentRequest =
            item.message_type ===
            "document_request";

          return {
            id:
              `message-${item.id}`,

            type:
              internal
                ? "internal"
                : "message",

            title:
              internal
                ? "Internal note added"
                : documentRequest
                  ? "Additional evidence requested"
                  : "Conversation reply added",

            detail:
              item.message.length >
              120
                ? `${item.message.slice(
                    0,
                    120,
                  )}...`
                : item.message,

            createdAt:
              item.created_at,
          };
        },
      ),

      ...documents.map(
        (item): ActivityItem => ({
          id:
            `document-${item.id}`,

          type:
            "document" as const,

          title:
            item.mime_type?.startsWith(
              "video/",
            )
              ? "Video evidence uploaded"
              : item.mime_type?.startsWith(
                    "image/",
                  )
                ? "Photo evidence uploaded"
                : "Document uploaded",

          detail:
            item.file_name,

          createdAt:
            item.created_at,
        }),
      ),
    ].sort(
      (a, b) =>
        new Date(
          b.createdAt,
        ).getTime() -
        new Date(
          a.createdAt,
        ).getTime(),
    );

  return (
    <AppShell
      title={
        claim.claim_number
      }
      userName={
        userName
      }
      role={
        role
      }
    >
      <ClaimNotificationReader
        claimId={
          claim.id
        }
        userId={
          user.id
        }
      />

      <div className="mx-auto w-full max-w-7xl px-1 sm:px-0">
        <Link
          href={
            isStaff
              ? "/support"
              : "/claims"
          }
          className="inline-flex items-center gap-2 text-sm font-bold text-[#1B3A6B] hover:text-[#BF1A2F]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          <span>Back to claims</span>
        </Link>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {updated ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
            Claim status updated successfully.
          </div>
        ) : null}

        {assigned ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
            This claim is now assigned to you.
          </div>
        ) : null}

        {message ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
            Message sent successfully.
          </div>
        ) : null}

        <section className="claim-reference-banner mt-4 rounded-2xl p-4 text-white sm:mt-6 sm:rounded-3xl sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-white/70">
                Claim reference
              </p>

              <h2 className="mt-1 break-words text-2xl font-extrabold text-white sm:text-3xl">
                {
                  claim.claim_number
                }
              </h2>

              <p className="mt-3 text-white/75">
                {
                  claim.customer_name
                }
                {" - "}
                {
                  claim.product_name
                }
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white">
                {formatLabel(
                  claim.priority,
                )}
              </span>

              <span className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#0D2347]">
                {formatLabel(
                  claim.status,
                )}
              </span>
            </div>
          </div>
        </section>

        <div className="mt-5 grid min-w-0 gap-5 sm:mt-7 sm:gap-7 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0 space-y-5 sm:space-y-7">
            <section className="rounded-2xl border border-[#DDE3EA] bg-white p-4 shadow-sm sm:p-6">
              <h3 className="text-lg font-extrabold text-[#0D2347]">
                Claim Information
              </h3>

              <dl className="mt-5 grid gap-5 sm:mt-6 sm:grid-cols-2 sm:gap-6">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[#65758A]">
                    Customer
                  </dt>

                  <dd className="mt-2 font-semibold text-[#0D2347]">
                    {
                      claim.customer_name
                    }
                  </dd>

                  <dd className="mt-1 text-sm text-[#65758A]">
                    {claim.customer_email ||
                      "No email provided"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[#65758A]">
                    Product
                  </dt>

                  <dd className="mt-2 font-semibold text-[#0D2347]">
                    {
                      claim.product_name
                    }
                  </dd>

                  <dd className="mt-1 text-sm text-[#65758A]">
                    {claim.serial_number ||
                      "No serial number"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[#65758A]">
                    Claim type
                  </dt>

                  <dd className="mt-2 font-semibold text-[#0D2347]">
                    {formatLabel(
                      claim.claim_type,
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[#65758A]">
                    Requested amount
                  </dt>

                  <dd className="mt-2 font-semibold text-[#0D2347]">
                    {claim.requested_amount ===
                    null
                      ? "Not specified"
                      : Number(
                          claim.requested_amount,
                        ).toLocaleString()}
                  </dd>
                </div>
              </dl>

              <div className="mt-7 border-t border-[#E5E9EF] pt-6">
                <p className="text-xs font-bold uppercase tracking-wide text-[#65758A]">
                  Description
                </p>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#0D2347]">
                  {
                    claim.description
                  }
                </p>
              </div>
            </section>

            <ClaimWarrantyDetails
              claimId={
                claim.id
              }
            />

            <ClaimDocuments
              claimId={
                claim.id
              }
            />

            <section className="rounded-2xl border border-[#DDE3EA] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0D2347]/10 text-[#0D2347]">
                  <MessageCircle className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-[#0D2347]">
                    Conversation
                  </h3>

                  <p className="text-xs text-[#65758A]">
                    Dealer and support communication
                  </p>
                </div>
              </div>

              <div className="conversation-thread mt-6">
                {messages.map(
                  (item) => {
                    const sentByCurrentUser =
                      item.sender_id ===
                      user.id;

                    const internal =
                      item.message_type ===
                      "internal_note";

                    const dealerMessage =
                      role ===
                      "dealer"
                        ? sentByCurrentUser
                        : !sentByCurrentUser;

                    return (
                      <article
                        key={
                          item.id
                        }
                        className={
                          internal
                            ? "message-bubble-internal"
                            : dealerMessage
                              ? "message-bubble-dealer"
                              : "message-bubble-support"
                        }
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-xs font-bold uppercase tracking-wide opacity-75">
                            {internal
                              ? "Internal note - Staff only"
                              : dealerMessage
                                ? sentByCurrentUser
                                  ? "You - Dealer"
                                  : "Dealer"
                                : sentByCurrentUser
                                  ? "You - Support"
                                  : "Support"}
                          </p>

                          <time className="text-xs opacity-65">
                            {formatDate(
                              item.created_at,
                            )}
                          </time>
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                          {
                            item.message
                          }
                        </p>
                      </article>
                    );
                  },
                )}

                {!messages.length ? (
                  <div className="rounded-xl border border-dashed border-[#CBD4E0] p-8 text-center text-sm text-[#65758A]">
                    No messages yet.
                  </div>
                ) : null}
              </div>

              <form
                action={
                  addMessage
                }
                className="mt-7 border-t border-[#E5E9EF] pt-6"
              >
                {isStaff ? (
                  <label className="mb-4 block text-sm font-semibold text-[#0D2347]">
                    Message type

                    <select
                      name="message_type"
                      defaultValue="public"
                      className="mt-2 min-h-[112px] w-full rounded-xl border border-[#CBD4E0] bg-[#F1F3F5] px-4 py-3 text-base text-[#0D2347] sm:text-sm outline-none focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10"
                    >
                      <option value="public">
                        Public reply
                      </option>

                      <option value="document_request">
                        Request documents / evidence
                      </option>

                      <option value="internal_note">
                        Internal note - Staff only
                      </option>
                    </select>
                  </label>
                ) : (
                  <input
                    type="hidden"
                    name="message_type"
                    value="public"
                  />
                )}

                <label className="block text-sm font-semibold text-[#0D2347]">
                  Message

                  <textarea
                    name="message"
                    required
                    rows={4}
                    placeholder="Write your message..."
                    className="mt-2 min-h-[112px] w-full rounded-xl border border-[#CBD4E0] bg-[#F1F3F5] px-4 py-3 text-base text-[#0D2347] sm:text-sm outline-none placeholder:text-[#A4ADB9] focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10"
                  />
                </label>

                <button
                  type="submit"
                  className="claim-red-button mt-4"
                >
                  Send Message
                </button>
              </form>
            </section>
          </div>

          <aside className="space-y-5 sm:space-y-7">
            {isStaff ? (
              <section className="rounded-2xl border border-[#DDE3EA] bg-white p-4 shadow-sm sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#BF1A2F]">
                  Claim management
                </p>

                <h3 className="mt-2 text-lg font-extrabold text-[#0D2347]">
                  Support Actions
                </h3>

                {canAssignStaff ? (
                  <form
                    action={assignToStaff}
                    className="mt-5"
                  >
                    <label className="block text-sm font-semibold text-[#0D2347]">
                      Assign Claim To

                      <select
                        name="assigned_to"
                        defaultValue={
                          claim.assigned_to ||
                          ""
                        }
                        className="mt-2 h-12 w-full rounded-xl border border-[#CBD4E0] bg-[#F1F3F5] px-4 text-base font-semibold text-[#0D2347] outline-none focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10 sm:text-sm"
                      >
                        <option value="">
                          Unassigned
                        </option>

                        {(assignableStaff ?? []).map(
                          (staff) => (
                            <option
                              key={staff.id}
                              value={staff.id}
                            >
                              {staff.full_name ||
                                staff.email ||
                                "Staff Member"}
                              {" - "}
                              {staff.role}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <button
                      type="submit"
                      className="mt-3 w-full rounded-xl bg-[#0D2347] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1B3A6B]"
                    >
                      Assign Claim
                    </button>
                  </form>
                ) : (
                  <form
                    action={assignToMe}
                    className="mt-5"
                  >
                    <button
                      type="submit"
                      className="w-full rounded-xl border border-[#1B3A6B]/20 bg-[#1B3A6B]/5 px-4 py-3 text-sm font-bold text-[#1B3A6B] transition hover:bg-[#1B3A6B]/10"
                    >
                      Assign to Me
                    </button>
                  </form>
                )}

                <form
                  action={
                    updateStatus
                  }
                  className="mt-5"
                >
                  <label className="text-sm font-semibold text-[#0D2347]">
                    Update status

                    <select
                      name="status"
                      defaultValue={
                        claim.status
                      }
                      className="mt-2 min-h-[112px] w-full rounded-xl border border-[#CBD4E0] bg-[#F1F3F5] px-4 py-3 text-base text-[#0D2347] sm:text-sm outline-none focus:border-[#BF1A2F] focus:bg-white focus:ring-4 focus:ring-[#BF1A2F]/10"
                    >
                      <option value="submitted">
                        Submitted
                      </option>

                      <option value="under_review">
                        Under Review
                      </option>

                      <option value="waiting_for_dealer">
                        Waiting for Dealer
                      </option>

                      <option value="approved">
                        Approved
                      </option>

                      <option value="rejected">
                        Rejected
                      </option>

                      <option value="closed">
                        Closed
                      </option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    className="mt-4 w-full rounded-xl bg-[#0D2347] px-4 py-3 text-sm font-bold text-white hover:bg-[#1B3A6B]"
                  >
                    Save Status
                  </button>
                </form>
              </section>
            ) : null}

            <section className="overflow-hidden rounded-2xl border border-[#DDE3EA] bg-white shadow-sm">
              <div className="border-b border-[#E5E9EF] p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0D2347] text-white">
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#BF1A2F]">
                      Full activity
                    </p>

                    <h3 className="mt-1 text-lg font-extrabold text-[#0D2347]">
                      Claim Timeline
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[#65758A]">
                      Status changes, replies,
                      notes and evidence in
                      chronological order.
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-h-[780px] overflow-y-auto p-6">
                <div className="relative">
                  <div className="absolute bottom-3 left-[17px] top-3 w-px bg-[#D8DEE7]" />

                  <div className="space-y-6">
                    {activity.map(
                      (item) => {
                        const Icon =
                          getActivityIcon(
                            item.type,
                          );

                        return (
                          <article
                            key={
                              item.id
                            }
                            className="relative flex gap-4"
                          >
                            <div
                              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm ${getActivityClasses(
                                item.type,
                              )}`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1 pb-1">
                              <p className="text-sm font-extrabold text-[#0D2347]">
                                {
                                  item.title
                                }
                              </p>

                              {item.detail ? (
                                <p className="mt-1 break-words text-xs leading-5 text-[#65758A]">
                                  {
                                    item.detail
                                  }
                                </p>
                              ) : null}

                              <time className="mt-2 block text-[11px] font-medium text-[#929CAA]">
                                {formatDate(
                                  item.createdAt,
                                )}
                              </time>
                            </div>
                          </article>
                        );
                      },
                    )}

                    {!activity.length ? (
                      <div className="text-sm text-[#65758A]">
                        No activity available.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#DDE3EA] bg-[#F8F9FB] p-5">
              <div className="flex items-start gap-3">
                <CircleDot className="mt-0.5 h-5 w-5 text-[#BF1A2F]" />

                <div>
                  <p className="text-sm font-extrabold text-[#0D2347]">
                    Notifications cleared
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#65758A]">
                    Opening this claim marks
                    only notifications related
                    to this claim as read.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}



