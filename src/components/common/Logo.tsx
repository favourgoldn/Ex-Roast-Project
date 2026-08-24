import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showWordmark = true,
  className = "",
}) => {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-4xl",
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Custom Geometric E/X Monogram with Flame Ember Core */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center`}>
        {/* Glow ambient background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 rounded-xl blur-[6px] opacity-75 animate-pulse" />
        
        {/* Monogram Badge */}
        <div className="relative w-full h-full bg-[#121218] border border-red-500/40 rounded-xl flex items-center justify-center overflow-hidden shadow-inner">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[72%] h-[72%]">
            <defs>
              <linearGradient id="flameGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d90429" />
                <stop offset="50%" stopColor="#ef233c" />
                <stop offset="100%" stopColor="#ff9f1c" />
              </linearGradient>
              <linearGradient id="emberGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ff5400" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Left 'E' Stem & Prongs */}
            <path
              d="M9 8h8v4.5h-4v4.5h3.5v4H13v4.5h4V30H9V8z"
              fill="url(#flameGrad)"
            />

            {/* Right 'X' Cross with Ember Flare */}
            <path
              d="M20.5 8l4.2 6.8L29 8h4.5l-6.2 9.5 6.7 12.5h-4.8l-4.7-8.2-4.5 8.2h-4.4l6.6-11.8L16.2 8h4.3z"
              fill="url(#flameGrad)"
            />

            {/* Ember Diamond / Spark at center */}
            <polygon
              points="24.5,15 26.5,18 24.5,21 22.5,18"
              fill="url(#emberGlow)"
            />
          </svg>
        </div>
      </div>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center tracking-tighter font-extrabold font-display">
            <span className={`${textSizes[size]} text-white`}>EX</span>
            <span className={`${textSizes[size]} bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent ml-1.5`}>
              ROAST
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-[0.25em] text-zinc-400 font-semibold mt-0.5">
            Anonymous Ex Burn Club
          </span>
        </div>
      )}
    </div>
  );
};
