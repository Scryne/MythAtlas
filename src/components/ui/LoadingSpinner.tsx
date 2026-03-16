'use client';

export default function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 animate-[spin_4.2s_linear_infinite]">
          <svg viewBox="0 0 80 80" className="h-full w-full">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="rgba(201, 168, 76, 0.2)"
              strokeWidth="2"
            />
            <path
              d="M40 7 A33 33 0 0 1 73 40"
              fill="none"
              stroke="url(#spinnerGrad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path d="M40 13 L44 36 L40 33 L36 36 Z" fill="#d9be7a" />
            <path d="M40 67 L44 44 L40 47 L36 44 Z" fill="#b6923e" />
            <path d="M13 40 L36 44 L33 40 L36 36 Z" fill="#ae8740" />
            <path d="M67 40 L44 44 L47 40 L44 36 Z" fill="#d7bc77" />
            <circle cx="40" cy="40" r="4" fill="#f0d58d" />
            <defs>
              <linearGradient id="spinnerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="100%" stopColor="#c9a84c" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="absolute inset-0 flex animate-pulse items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-gold" />
        </div>
      </div>

      <p className="text-foreground/40 text-sm font-heading tracking-widest uppercase">
        {text}
      </p>
    </div>
  );
}
