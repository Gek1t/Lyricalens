import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { withColorAlpha } from '../utils/colorExtractor';

interface AmbientBackgroundProps {
  intensity?: number;
  className?: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = React.memo(({ intensity = 1, className = '' }) => {
  const isDark = useAppStore(s => s.isDark);
  const ambientColors = useAppStore(s => s.ambientColors);

  // Soft opacities scaled by intensity, preserving rich luminous hues without overwhelming modal layers
  const op1 = (isDark ? 0.42 : 0.46) * intensity;
  const op2 = (isDark ? 0.32 : 0.36) * intensity;
  const op3 = (isDark ? 0.25 : 0.29) * intensity;

  const fallback1 = isDark ? '#1E293B' : '#7C8F6E';
  const fallback2 = isDark ? '#162C27' : '#C4AC82';
  const fallback3 = isDark ? '#1E1B2E' : '#A69880';

  const grad1 = `radial-gradient(circle, ${withColorAlpha(ambientColors[0], 1, fallback1)} 0%, ${withColorAlpha(ambientColors[0], 0.7, fallback1)} 26%, ${withColorAlpha(ambientColors[0], 0.3, fallback1)} 50%, rgba(0, 0, 0, 0) 72%)`;
  const grad2 = `radial-gradient(circle, ${withColorAlpha(ambientColors[1], 1, fallback2)} 0%, ${withColorAlpha(ambientColors[1], 0.7, fallback2)} 26%, ${withColorAlpha(ambientColors[1], 0.3, fallback2)} 50%, rgba(0, 0, 0, 0) 72%)`;
  const grad3 = `radial-gradient(circle, ${withColorAlpha(ambientColors[2], 1, fallback3)} 0%, ${withColorAlpha(ambientColors[2], 0.7, fallback3)} 26%, ${withColorAlpha(ambientColors[2], 0.3, fallback3)} 50%, rgba(0, 0, 0, 0) 72%)`;

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#FAF8F5] dark:bg-[#0B0F17] transition-colors duration-700 ${className}`}
      style={{ contain: 'strict' }}
    >
      {/* Dynamic breathing light orb 1 - Pre-feathered Radial Gradient (Zero GPU Gaussian Blur Re-Convolution Cost) */}
      <div
        className="absolute w-[560px] h-[560px] sm:w-[640px] sm:h-[640px] rounded-full animate-ambient-1"
        style={{
          top: '-8%',
          left: '50%',
          marginLeft: '-280px',
          background: grad1,
          opacity: op1,
          transition: 'opacity 0.8s ease'
        }}
      />

      {/* Dynamic breathing light orb 2 - Center Right (Complementary mist/tint) */}
      <div
        className="absolute w-[480px] h-[480px] sm:w-[540px] sm:h-[540px] rounded-full animate-ambient-2"
        style={{
          top: '10%',
          right: '-18%',
          background: grad2,
          opacity: op2,
          transition: 'opacity 0.8s ease'
        }}
      />

      {/* Dynamic breathing light orb 3 - Mid/Lower Left (Warm accent glow) */}
      <div
        className="absolute w-[450px] h-[450px] sm:w-[500px] sm:h-[500px] rounded-full animate-ambient-3"
        style={{
          top: '32%',
          left: '-14%',
          background: grad3,
          opacity: op3,
          transition: 'opacity 0.8s ease'
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
});

