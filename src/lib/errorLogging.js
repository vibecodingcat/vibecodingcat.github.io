const ERROR_LOG_ENDPOINT = import.meta.env.VITE_ERROR_LOG_ENDPOINT || "";

function tryParseJsonString(value) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function normalizeError(error, context = {}) {
  const parsedMessage = tryParseJsonString(error?.message);
  const providerError = parsedMessage?.error || error?.error || {};
  const providerDetails =
    providerError.details || error?.details || error?.cause?.details || [];

  const statusCode =
    providerError.code ||
    error?.status ||
    error?.statusCode ||
    error?.cause?.status ||
    context.statusCode;
  const providerStatus =
    providerError.status ||
    error?.code ||
    error?.cause?.code ||
    error?.name ||
    context.providerStatus;
  const message =
    providerError.message ||
    error?.cause?.message ||
    error?.message ||
    context.fallbackMessage ||
    "Unexpected application error.";

  return {
    timestamp: new Date().toISOString(),
    message,
    statusCode,
    providerStatus,
    providerDetails,
    context
  };
}

export async function logErrorToBackend(errorRecord) {
  if (!ERROR_LOG_ENDPOINT) {
    console.error("[error-log]", errorRecord);
    return;
  }

  try {
    await fetch(ERROR_LOG_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(errorRecord)
    });
  } catch (loggingError) {
    console.error("[error-log-failed]", loggingError, errorRecord);
  }
}

export function toUserMessage(errorRecord) {
  if (
    errorRecord.providerStatus === "INVALID_ARGUMENT" &&
    /Unsupported MIME type/i.test(errorRecord.message)
  ) {
    return "Unsupported image format. Please upload PNG, JPG, WEBP, or GIF.";
  }

  if (errorRecord.providerStatus === "INVALID_ARGUMENT") {
    return errorRecord.message;
  }

  if (errorRecord.providerStatus === "PERMISSION_DENIED") {
    return "Permission denied. Check your API key and model access.";
  }

  if (errorRecord.providerStatus === "UNAUTHENTICATED") {
    return "Authentication failed. Please verify your API key.";
  }

  if (errorRecord.providerStatus === "RESOURCE_EXHAUSTED") {
    return "Quota exceeded. Please try again later or use a different key.";
  }

  if (errorRecord.statusCode === 429) {
    return "Rate limited. Please wait a moment and retry.";
  }

  if (errorRecord.statusCode >= 500) {
    return "Server error from model provider. Please retry shortly.";
  }

  return errorRecord.message;
}

export function installGlobalErrorHandlers() {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("error", (event) => {
    const errorRecord = normalizeError(event.error || new Error(event.message), {
      phase: "window_error",
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      fallbackMessage: "Unexpected runtime error."
    });

    void logErrorToBackend(errorRecord);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const rejection = event.reason instanceof Error
      ? event.reason
      : new Error(typeof event.reason === "string" ? event.reason : "Unhandled promise rejection");

    const errorRecord = normalizeError(rejection, {
      phase: "unhandled_rejection",
      fallbackMessage: "Unexpected async error."
    });

    void logErrorToBackend(errorRecord);
  });
}
