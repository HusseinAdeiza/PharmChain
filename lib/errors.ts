export function errorMessage(error: unknown) {
  if (!error) {
    return "The request could not be completed.";
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object") {
    const candidate = error as {
      shortMessage?: unknown;
      details?: unknown;
      cause?: unknown;
      message?: unknown;
    };
    if (typeof candidate.shortMessage === "string" && candidate.shortMessage) {
      return candidate.shortMessage;
    }
    if (typeof candidate.details === "string" && candidate.details) {
      return candidate.details;
    }
    if (candidate.cause && candidate.cause !== error) {
      return errorMessage(candidate.cause);
    }
    if (typeof candidate.message === "string" && candidate.message) {
      return candidate.message;
    }
  }
  return "The request could not be completed.";
}
