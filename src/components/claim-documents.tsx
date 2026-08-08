import {
  ExternalLink,
  File,
  FileImage,
  FileText,
  Film,
  Upload,
} from "lucide-react";
import { createClient } from "../lib/supabase/server";
import { uploadClaimDocument } from "../app/claims/[id]/document-actions";

type ClaimDocumentsProps = {
  claimId: string;
};

function formatFileSize(
  bytes: number,
) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
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

function getFileTypeLabel(
  mimeType: string | null,
) {
  if (!mimeType) {
    return "File";
  }

  if (
    mimeType.startsWith(
      "image/",
    )
  ) {
    return "Image";
  }

  if (
    mimeType.startsWith(
      "video/",
    )
  ) {
    return "Video";
  }

  if (
    mimeType ===
    "application/pdf"
  ) {
    return "PDF";
  }

  if (
    mimeType.includes(
      "wordprocessingml",
    )
  ) {
    return "Word document";
  }

  if (
    mimeType.includes(
      "spreadsheetml",
    )
  ) {
    return "Excel spreadsheet";
  }

  return "Document";
}

function EvidenceIcon({
  mimeType,
}: {
  mimeType: string | null;
}) {
  if (
    mimeType?.startsWith(
      "image/",
    )
  ) {
    return (
      <FileImage className="h-5 w-5" />
    );
  }

  if (
    mimeType?.startsWith(
      "video/",
    )
  ) {
    return (
      <Film className="h-5 w-5" />
    );
  }

  if (
    mimeType ===
    "application/pdf"
  ) {
    return (
      <FileText className="h-5 w-5" />
    );
  }

  return (
    <File className="h-5 w-5" />
  );
}

export default async function ClaimDocuments({
  claimId,
}: ClaimDocumentsProps) {
  const supabase =
    await createClient();

  const {
    data: documents,
    error,
  } = await supabase
    .from(
      "claim_documents",
    )
    .select(
      "id, storage_path, file_name, mime_type, file_size, created_at",
    )
    .eq(
      "claim_id",
      claimId,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  const documentsWithUrls =
    await Promise.all(
      (documents ?? []).map(
        async (document) => {
          const { data } =
            await supabase.storage
              .from(
                "claim-documents",
              )
              .createSignedUrl(
                document.storage_path,
                60 * 60,
              );

          return {
            ...document,

            signedUrl:
              data?.signedUrl ??
              null,
          };
        },
      ),
    );

  const totalSize =
    documentsWithUrls.reduce(
      (sum, document) =>
        sum +
        Number(
          document.file_size ||
            0,
        ),
      0,
    );

  const imageCount =
    documentsWithUrls.filter(
      (document) =>
        document.mime_type?.startsWith(
          "image/",
        ),
    ).length;

  const videoCount =
    documentsWithUrls.filter(
      (document) =>
        document.mime_type?.startsWith(
          "video/",
        ),
    ).length;

  const uploadDocument =
    uploadClaimDocument.bind(
      null,
      claimId,
    );

  return (
    <section
      id="documents"
      className="overflow-hidden rounded-3xl border border-[#DDE3EA] bg-white shadow-[0_10px_30px_rgba(10,22,40,0.07)]"
    >
      <div className="border-b border-[#E5E9EF] p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#BF1A2F]">
              Claim evidence
            </p>

            <h3 className="mt-2 text-2xl font-extrabold text-[#0D2347]">
              Photos, Videos &amp; Documents
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65758A]">
              Review supporting photographs,
              video evidence, invoices,
              reports, and other documents
              attached to this claim.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#0D2347]/5 px-3 py-1.5 text-xs font-bold text-[#0D2347]">
              {documentsWithUrls.length} files
            </span>

            {imageCount > 0 ? (
              <span className="rounded-full bg-[#1B3A6B]/10 px-3 py-1.5 text-xs font-bold text-[#1B3A6B]">
                {imageCount} images
              </span>
            ) : null}

            {videoCount > 0 ? (
              <span className="rounded-full bg-[#BF1A2F]/10 px-3 py-1.5 text-xs font-bold text-[#BF1A2F]">
                {videoCount} videos
              </span>
            ) : null}

            {documentsWithUrls.length >
            0 ? (
              <span className="rounded-full bg-[#F1F3F5] px-3 py-1.5 text-xs font-bold text-[#65758A]">
                {formatFileSize(
                  totalSize,
                )}{" "}
                total
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Unable to load evidence:{" "}
          {error.message}
        </div>
      ) : null}

      {documentsWithUrls.length >
      0 ? (
        <div className="grid gap-5 p-6 sm:grid-cols-2 2xl:grid-cols-3">
          {documentsWithUrls.map(
            (document) => {
              const isImage =
                document.mime_type?.startsWith(
                  "image/",
                );

              const isVideo =
                document.mime_type?.startsWith(
                  "video/",
                );

              return (
                <article
                  key={
                    document.id
                  }
                  className="overflow-hidden rounded-2xl border border-[#DDE3EA] bg-[#F7F9FB]"
                >
                  <div className="flex min-h-56 items-center justify-center overflow-hidden bg-[#0A1628]">
                    {document.signedUrl &&
                    isImage ? (
                      <a
                        href={
                          document.signedUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="block h-full w-full"
                      >
                        <img
                          src={
                            document.signedUrl
                          }
                          alt={
                            document.file_name
                          }
                          className="h-64 w-full object-contain"
                        />
                      </a>
                    ) : document.signedUrl &&
                      isVideo ? (
                      <video
                        controls
                        preload="metadata"
                        className="h-64 w-full bg-black object-contain"
                      >
                        <source
                          src={
                            document.signedUrl
                          }
                          type={
                            document.mime_type ||
                            undefined
                          }
                        />

                        Your browser does not
                        support this video.
                      </video>
                    ) : (
                      <div className="flex flex-col items-center px-6 py-12 text-center text-white">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                          <EvidenceIcon
                            mimeType={
                              document.mime_type
                            }
                          />
                        </div>

                        <p className="mt-4 text-sm font-bold">
                          {getFileTypeLabel(
                            document.mime_type,
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0D2347]/8 text-[#0D2347]">
                        <EvidenceIcon
                          mimeType={
                            document.mime_type
                          }
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="break-words text-sm font-extrabold text-[#0D2347]">
                          {
                            document.file_name
                          }
                        </p>

                        <p className="mt-1 text-xs text-[#65758A]">
                          {getFileTypeLabel(
                            document.mime_type,
                          )}
                          {" · "}
                          {formatFileSize(
                            Number(
                              document.file_size,
                            ),
                          )}
                        </p>

                        <p className="mt-1 text-[11px] text-[#8793A3]">
                          {formatDate(
                            document.created_at,
                          )}
                        </p>
                      </div>
                    </div>

                    {document.signedUrl ? (
                      <a
                        href={
                          document.signedUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D2347] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1B3A6B]"
                      >
                        <ExternalLink className="h-4 w-4" />

                        Open Full File
                      </a>
                    ) : (
                      <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-center text-xs font-semibold text-red-700">
                        Secure link unavailable.
                      </div>
                    )}
                  </div>
                </article>
              );
            },
          )}
        </div>
      ) : (
        <div className="p-6">
          <div className="rounded-2xl border border-dashed border-[#CBD4E0] bg-[#F7F9FB] p-10 text-center">
            <FileImage className="mx-auto h-10 w-10 text-[#1B3A6B]" />

            <p className="mt-4 font-extrabold text-[#0D2347]">
              No supporting evidence yet
            </p>

            <p className="mt-2 text-sm text-[#65758A]">
              Photos, videos, and documents
              attached to the claim will
              appear here.
            </p>
          </div>
        </div>
      )}

      <div className="border-t border-[#E5E9EF] bg-[#F8F9FB] p-6">
        <form
          action={
            uploadDocument
          }
          encType="multipart/form-data"
          className="rounded-2xl border border-[#DDE3EA] bg-white p-5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#BF1A2F]/10 text-[#BF1A2F]">
              <Upload className="h-5 w-5" />
            </div>

            <div>
              <p className="font-extrabold text-[#0D2347]">
                Add more evidence
              </p>

              <p className="mt-1 text-xs leading-5 text-[#65758A]">
                Upload an additional photo,
                video, PDF, Word, or Excel
                document. Maximum 10 MB per
                file.
              </p>
            </div>
          </div>

          <input
            name="file"
            type="file"
            required
            accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov,.webm,.docx,.xlsx,image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
            className="mt-5 block w-full rounded-xl border border-[#CBD4E0] bg-[#F1F3F5] px-4 py-3 text-sm text-[#0D2347] file:mr-4 file:rounded-lg file:border-0 file:bg-[#0D2347] file:px-4 file:py-2 file:text-xs file:font-bold file:text-white"
          />

          <button
            type="submit"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#A01525] to-[#BF1A2F] px-5 py-3 text-sm font-bold text-white shadow-sm"
          >
            <Upload className="h-4 w-4" />

            Upload Evidence
          </button>
        </form>
      </div>
    </section>
  );
}