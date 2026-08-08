export const MAX_EVIDENCE_FILE_SIZE =
  10 * 1024 * 1024;

export const MAX_EVIDENCE_TOTAL_SIZE =
  100 * 1024 * 1024;

export const ALLOWED_EVIDENCE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export function validateEvidenceFiles(
  files: File[],
) {
  const usableFiles = files.filter(
    (file) =>
      file instanceof File &&
      file.size > 0,
  );

  let totalSize = 0;

  for (const file of usableFiles) {
    if (
      file.size >
      MAX_EVIDENCE_FILE_SIZE
    ) {
      return {
        files: usableFiles,
        error:
          `"${file.name}" is larger than the ` +
          "10 MB per-file limit.",
      };
    }

    if (
      !ALLOWED_EVIDENCE_TYPES.has(
        file.type,
      )
    ) {
      return {
        files: usableFiles,
        error:
          `"${file.name}" is not a supported ` +
          "image or video format.",
      };
    }

    totalSize += file.size;
  }

  if (
    totalSize >
    MAX_EVIDENCE_TOTAL_SIZE
  ) {
    return {
      files: usableFiles,
      error:
        "Photo and video evidence exceeds " +
        "the 100 MB total limit.",
    };
  }

  return {
    files: usableFiles,
    error: null,
  };
}