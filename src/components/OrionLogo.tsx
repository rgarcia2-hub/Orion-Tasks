import React from 'react';

interface OrionLogoProps {
  className?: string;
  size?: number;
}

export const OrionLogo: React.FC<OrionLogoProps> = ({ className = 'w-8 h-8', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Orion Logo"
    >
      <defs>
        {/* Background gradient inspired by modern Proton/Orion celestial palette */}
        <linearGradient id="orion-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="50%" stopColor="#2e1065" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Glow gradient for constellation lines */}
        <linearGradient id="orion-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#c084fc" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.85" />
        </linearGradient>

        {/* Belt stars glow */}
        <linearGradient id="orion-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#a5b4fc" />
        </linearGradient>

        <filter id="orion-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Squircle container with subtle inner border */}
      <rect width="32" height="32" rx="8" fill="url(#orion-bg-grad)" />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="7.5"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="1"
      />

      {/* Constellation geometric lines (Connecting Orion stars) */}
      <g stroke="url(#orion-line-grad)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" filter="url(#orion-glow)">
        {/* Top stars to belt */}
        <path d="M9 8.5 L13 15 L9 23.5" />
        <path d="M23 8.5 L19 17 L23 23.5" />
        <path d="M9 8.5 L23 8.5" opacity="0.4" strokeDasharray="1.5 1.5" />
        <path d="M9 23.5 L23 23.5" opacity="0.4" strokeDasharray="1.5 1.5" />
        {/* Orion's 3 Belt Stars connection line */}
        <path d="M13 15 L16 16 L19 17" strokeWidth="1.6" stroke="#ffffff" opacity="0.95" />
      </g>

      {/* Outer corner stars (Betelgeuse, Rigel, Bellatrix, Saiph) */}
      <circle cx="9" cy="8.5" r="1.5" fill="#f43f5e" opacity="0.95" /> {/* Betelgeuse (Red supergiant) */}
      <circle cx="23" cy="8.5" r="1.4" fill="#67e8f9" /> {/* Bellatrix */}
      <circle cx="9" cy="23.5" r="1.4" fill="#a5b4fc" /> {/* Saiph */}
      <circle cx="23" cy="23.5" r="1.6" fill="#38bdf8" /> {/* Rigel (Blue supergiant) */}

      {/* Three Belt Stars (Alnitak, Alnilam, Mintaka) */}
      <circle cx="13" cy="15" r="1.6" fill="url(#orion-star-grad)" />
      <circle cx="16" cy="16" r="1.8" fill="#ffffff" filter="url(#orion-glow)" />
      <circle cx="19" cy="17" r="1.6" fill="url(#orion-star-grad)" />

      {/* Nebula subtle micro-glow at center */}
      <circle cx="16" cy="19.5" r="1" fill="#c084fc" opacity="0.8" />
    </svg>
  );
};
