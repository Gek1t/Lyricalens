import React from 'react';
import { useAppStore } from '../store/useAppStore';

interface AmbientBackgroundProps {
  intensity?: number;
  className?: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ intensity = 1, className = '' }) => {
  const isDark = useAppStore(s => s.isDark);
  const ambientColors = useAppStore(s => s.ambientColors);

  // Soft opacities scaled by intensity, preserving rich luminous hues without overwhelming modal layers
  const op1 = (isDark ? 0.38 : 0.42) * intensity;
  const op2 = (isDark ? 0.28 : 0.32) * intensity;
  const op3 = (isDark ? 0.22 : 0.26) * intensity;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#FAF8F5] dark:bg-[#0B0F17] transition-colors duration-700 ${className}`}>
      {/* Dynamic breathing light orb 1 - Top Center / Behind Album (Vivid main glow) */}
      <div
        className="absolute w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] rounded-full hardware-accelerated animate-ambient-1"
        style={{
          top: '5%',
          left: '50%',
          marginLeft: '-180px',
          backgroundColor: ambientColors[0] || (isDark ? '#1E293B' : '#7C8F6E'),
          opacity: op1,
          filter: 'blur(95px)',
          WebkitFilter: 'blur(95px)',
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          contain: 'paint',
          transition: 'background-color 1.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease'
        }}
      />

      {/* Dynamic breathing light orb 2 - Center Right (Complementary mist/tint) */}
      <div
        className="absolute w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] rounded-full hardware-accelerated animate-ambient-2"
        style={{
          top: '20%',
          right: '-5%',
          backgroundColor: ambientColors[1] || (isDark ? '#162C27' : '#C4AC82'),
          opacity: op2,
          filter: 'blur(90px)',
          WebkitFilter: 'blur(90px)',
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          contain: 'paint',
          transition: 'background-color 1.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease'
        }}
      />

      {/* Dynamic breathing light orb 3 - Mid/Lower Left (Warm accent glow) */}
      <div
        className="absolute w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-full hardware-accelerated animate-ambient-3"
        style={{
          top: '40%',
          left: '0%',
          backgroundColor: ambientColors[2] || (isDark ? '#1E1B2E' : '#A69880'),
          opacity: op3,
          filter: 'blur(90px)',
          WebkitFilter: 'blur(90px)',
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          contain: 'paint',
          transition: 'background-color 1.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease'
        }}
      />

      {/* Minimal clean overlay for fine paper feel without dark grid */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.01] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(0,0,0,0.3) 1px, transparent 0)`,
          backgroundSize: '28px 28px'
        }}
      />
    </div>
  );
};

