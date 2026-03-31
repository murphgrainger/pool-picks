"use client";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className = "w-6 h-6" }: SpinnerProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pp-trail-fade" x1="1" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <style>
        {`
          @keyframes pp-swing {
            0% { transform: rotate(0deg); }
            50% { transform: rotate(-360deg); }
            100% { transform: rotate(0deg); }
          }
          .pp-orbit { animation: pp-swing 2s ease-in-out infinite; transform-origin: center; }
        `}
      </style>
      {/* Full orbit track (faint) */}
      <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.1" />
      <g className="pp-orbit">
        {/* Comet tail — smooth gradient fade */}
        <path
          d="M 20 5 A 15 15 0 0 1 35 20"
          fill="none"
          stroke="url(#pp-trail-fade)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Golf ball at 12 o'clock */}
        <circle cx="20" cy="5" r="4" fill="currentColor" opacity="0.9" />
        <circle cx="18.5" cy="3.5" r="0.7" fill="currentColor" opacity="0.4" />
        <circle cx="21.5" cy="4" r="0.7" fill="currentColor" opacity="0.4" />
        <circle cx="20" cy="6.5" r="0.7" fill="currentColor" opacity="0.4" />
      </g>
    </svg>
  );
}
