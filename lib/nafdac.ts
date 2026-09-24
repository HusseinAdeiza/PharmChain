const encoder = new TextEncoder();
const internalUrlBase = "https://localhost";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function isValidNafdacNumber(value: string) {
  const candidate = value.trim();
  const byteLength = encoder.encode(candidate).length;
  return byteLength > 0 && byteLength <= 512;
}

export function nafdacFromInput(value: string) {
  const input = value.trim();
  if (!input) {
    return undefined;
  }

  const isUrl = /^https?:\/\//i.test(input) || input.startsWith("/");
  if (isUrl) {
    try {
      const url = new URL(input, internalUrlBase);
      const segments = url.pathname.split("/").filter(Boolean);
      const verifyIndex = segments.findIndex(
        (segment) => segment.toLowerCase() === "verify",
      );
      const candidate =
        verifyIndex >= 0 ? safeDecode(segments[verifyIndex + 1] ?? "") : "";
      return isValidNafdacNumber(candidate) ? candidate : undefined;
    } catch {
      return undefined;
    }
  }

  const candidate = input.replace(/^#/, "");
  return isValidNafdacNumber(candidate) ? candidate : undefined;
}

export function normalizeNafdacNumber(value: string) {
  const candidate = nafdacFromInput(value);
  return candidate?.trim() ?? "";
}

export function passportPath(nafdacNumber: string) {
  return `/verify/${encodeURIComponent(nafdacNumber.trim())}`;
}
