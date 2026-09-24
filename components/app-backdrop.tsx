export function AppBackdrop() {
  return (
    <div className="app-backdrop" aria-hidden="true">
      <svg
        className="app-backdrop__art"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pc-streak-cyan" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#1FB6FF" stopOpacity="0" />
            <stop offset="0.45" stopColor="#1FB6FF" stopOpacity="0.85" />
            <stop offset="0.7" stopColor="#12D6C0" stopOpacity="0.55" />
            <stop offset="1" stopColor="#12D6C0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pc-streak-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#F5A623" stopOpacity="0" />
            <stop offset="0.5" stopColor="#F5A623" stopOpacity="0.7" />
            <stop offset="1" stopColor="#F5A623" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="pc-center-glow" cx="0.5" cy="0.38" r="0.55">
            <stop offset="0" stopColor="#1FB6FF" stopOpacity="0.16" />
            <stop offset="0.55" stopColor="#0B2A3A" stopOpacity="0.08" />
            <stop offset="1" stopColor="#04060A" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1440" height="900" fill="url(#pc-center-glow)" />

        <g className="trail-drift" fill="none" strokeLinecap="round">
          <path
            d="M-80 640C260 560 470 360 760 320S1240 360 1520 150"
            stroke="url(#pc-streak-cyan)"
            strokeWidth="2.2"
            opacity="0.55"
          />
          <path
            d="M-80 700C220 640 520 470 820 430S1300 470 1520 300"
            stroke="url(#pc-streak-cyan)"
            strokeWidth="1.4"
            opacity="0.32"
          />
          <path
            d="M-80 260C300 300 560 220 860 180S1320 120 1520 -40"
            stroke="url(#pc-streak-gold)"
            strokeWidth="1.8"
            opacity="0.34"
          />
          <path
            d="M-80 520C320 470 640 520 940 470S1360 360 1520 240"
            stroke="url(#pc-streak-gold)"
            strokeWidth="1.1"
            opacity="0.22"
          />
          <path
            d="M-80 820C360 760 700 640 1040 620S1400 640 1520 560"
            stroke="url(#pc-streak-cyan)"
            strokeWidth="1.1"
            opacity="0.2"
          />
        </g>
      </svg>

      <div className="app-backdrop__mark">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M24 5.5 39.6 14.75V33.25L24 42.5 8.4 33.25V14.75L24 5.5Z"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          <rect x="13.5" y="20.5" width="8.6" height="7" rx="3.5" stroke="currentColor" strokeWidth="0.8" />
          <rect x="25.9" y="20.5" width="8.6" height="7" rx="3.5" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="24" cy="24" r="2.2" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
