export function shortHash(value: string, leading = 6, trailing = 4) {
  if (value.length <= leading + trailing + 3) {
    return value;
  }
  return `${value.slice(0, leading)}…${value.slice(-trailing)}`;
}

export function formatTimestamp(value: bigint) {
  if (value === 0n) {
    return "Not available";
  }
  const milliseconds = Number(value) * 1000;
  if (!Number.isFinite(milliseconds)) {
    return "Timestamp unavailable";
  }
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(milliseconds));
}

export function shortAddress(value: string) {
  return shortHash(value, 6, 4);
}
