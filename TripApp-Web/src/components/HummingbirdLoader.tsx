type Props = {
  className?: string;
  label?: string;
};

export default function HummingbirdLoader({ className = "h-6 w-6", label = "Loading" }: Props) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full" fill="none" aria-hidden="true">
        <style>{`
          .hb-wing-left { transform-origin: 30px 30px; animation: hb-flap-left 0.18s ease-in-out infinite alternate !important; }
          .hb-wing-right { transform-origin: 34px 30px; animation: hb-flap-right 0.18s ease-in-out infinite alternate !important; }
          .hb-body { transform-origin: 32px 34px; animation: hb-hover 0.6s ease-in-out infinite alternate !important; }
          @keyframes hb-flap-left { from { transform: rotate(-28deg) scaleY(0.85); } to { transform: rotate(32deg) scaleY(1.05); } }
          @keyframes hb-flap-right { from { transform: rotate(28deg) scaleY(0.85); } to { transform: rotate(-32deg) scaleY(1.05); } }
          @keyframes hb-hover { from { transform: translateY(0px); } to { transform: translateY(-1.5px); } }
        `}</style>

        <g className="hb-body">
          {/* tail */}
          <path d="M30 40 L24 54 L31 47 L34 55 L35 41" fill="currentColor" opacity="0.9" />
          {/* body */}
          <ellipse cx="32" cy="35" rx="6.5" ry="8.5" fill="currentColor" />
          {/* head */}
          <circle cx="36" cy="26" r="5.2" fill="currentColor" />
          {/* beak */}
          <path d="M40 24.5 L58 20.5 L41 27.2 Z" fill="currentColor" />
          {/* eye */}
          <circle cx="37.5" cy="25" r="0.9" fill="var(--color-surface, #0f1a1a)" />
          {/* belly highlight */}
          <ellipse cx="32.5" cy="36" rx="3.2" ry="5.2" fill="currentColor" opacity="0.25" />
        </g>

        {/* wings */}
        <g className="hb-wing-left">
          <path d="M30 30 C20 22, 8 20, 4 24 C10 25, 17 28, 28 33 Z" fill="currentColor" opacity="0.85" />
        </g>
        <g className="hb-wing-right">
          <path d="M34 30 C42 20, 54 18, 60 22 C54 24, 46 28, 36 33 Z" fill="currentColor" opacity="0.75" />
        </g>
      </svg>
    </span>
  );
}
