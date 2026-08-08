"use client";

import { useEffect } from "react";
import { createClient } from "../lib/supabase/client";

type ClaimNotificationReaderProps = {
  claimId: string;
  userId: string;
};

export default function ClaimNotificationReader({
  claimId,
  userId,
}: ClaimNotificationReaderProps) {
  useEffect(() => {
    const supabase = createClient();

    let cancelled = false;

    async function markClaimNotificationsRead() {
      const readAt =
        new Date().toISOString();

      const { data, error } =
        await supabase
          .from("notifications")
          .update({
            read_at: readAt,
          })
          .eq(
            "recipient_id",
            userId,
          )
          .eq(
            "claim_id",
            claimId,
          )
          .is(
            "read_at",
            null,
          )
          .select("id");

      if (
        cancelled ||
        error ||
        !data?.length
      ) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent(
          "claim-notifications-read",
          {
            detail: {
              claimId,
              readAt,
            },
          },
        ),
      );
    }

    void markClaimNotificationsRead();

    return () => {
      cancelled = true;
    };
  }, [
    claimId,
    userId,
  ]);

  return null;
}