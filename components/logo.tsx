"use client";

import { useId } from "react";

export function Logo({
  className,
  title = "PharmChain",
}: {
  className?: string;
  title?: string;
}) {
  const gradientId = `pharmchain-node-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="21.6" y1="21.6" x2="26.4" y2="26.4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1FB6FF" />
          <stop offset="1" stopColor="#12D6C0" />
        </linearGradient>
      </defs>
      <path
        d="M24 5.5 39.6 14.75V33.25L24 42.5 8.4 33.25V14.75L24 5.5Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <rect x="13.5" y="20.5" width="8.6" height="7" rx="3.5" stroke="currentColor" strokeWidth="2.2" />
      <rect x="25.9" y="20.5" width="8.6" height="7" rx="3.5" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="24" cy="24" r="2.4" fill={`url(#${gradientId})`} />
    </svg>
  );
}
