import React from 'react';

interface BetaFlaskIconProps {
  className?: string;
  size?: number;
  /** Whether to show the soft translucent circular backdrop (Google Labs style) */
  showDisc?: boolean;
}

export const BetaFlaskIcon: React.FC<BetaFlaskIconProps> = ({
  className = 'w-4 h-4',
  size,
  showDisc = true,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      style={style}
      aria-label="Google Labs Flask"
    >
      <defs>
        {/* Disc soft glow */}
        <radialGradient
          id="labsDiscGrad"
          cx="50%"
          cy="50%"
          r="50%"
          fx="50%"
          fy="50%"
        >
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#a855f7" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#9333ea" stopOpacity="0.10" />
        </radialGradient>

        {/* Flask liquid gradient */}
        <linearGradient
          id="labsFlaskGrad"
          x1="6"
          y1="4"
          x2="18"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="45%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>

        {/* Inner liquid highlight */}
        <linearGradient
          id="labsLiquidGrad"
          x1="12"
          y1="11"
          x2="12"
          y2="18.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.8" />
          <stop offset="25%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
      </defs>

      {/* Soft translucent circular backdrop (transparent PNG replacement, zero white square) */}
      {showDisc && (
        <circle
          cx="12"
          cy="12"
          r="10.5"
          fill="url(#labsDiscGrad)"
        />
      )}

      {/* Laboratory Flask Body */}
      <path
        d="M9.5 4.75C9.5 4.33579 9.83579 4 10.25 4H13.75C14.1642 4 14.5 4.33579 14.5 4.75C14.5 5.16421 14.1642 5.5 13.75 5.5H13.2V8.25L17.382 15.688C18.176 17.098 17.158 18.85 15.542 18.85H8.458C6.842 18.85 5.824 17.098 6.618 15.688L10.8 8.25V5.5H10.25C9.83579 5.5 9.5 5.16421 9.5 4.75Z"
        fill="url(#labsFlaskGrad)"
      />

      {/* Internal liquid reflection curve */}
      <path
        d="M8.2 14.5C9.2 13.9 10.5 14.1 12 14.1C13.5 14.1 14.8 13.9 15.8 14.5L16.8 16.3C17.2 17 16.7 17.85 15.8 17.85H8.2C7.3 17.85 6.8 17 7.2 16.3L8.2 14.5Z"
        fill="url(#labsLiquidGrad)"
        fillOpacity="0.75"
      />

      {/* Effervescent bubbles (Labs feature) */}
      <circle cx="10" cy="15.8" r="0.75" fill="#ffffff" fillOpacity="0.85" />
      <circle cx="13.5" cy="16.5" r="0.55" fill="#ffffff" fillOpacity="0.75" />
      <circle cx="12" cy="14.8" r="0.45" fill="#ffffff" fillOpacity="0.65" />

      {/* Neck Glass Sheen */}
      <rect
        x="12.2"
        y="5.8"
        width="0.7"
        height="2.8"
        rx="0.35"
        fill="#ffffff"
        fillOpacity="0.5"
      />
    </svg>
  );
};

export default BetaFlaskIcon;
