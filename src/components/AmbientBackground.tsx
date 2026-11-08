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

  const fallback1 = isDark ? '#1E293B' : '#7C8F6E';
  const fallback2 = isDark ? '#162C27' : '#C4AC82';
  const fallback3 = isDark ? '#1E1B2E' : '#A69880';

  const a1 = isDark ? 0.42 : 0.46;
  const a2 = isDark ? 0.32 : 0.36;
  const a3 = isDark ? 0.25 : 0.29;

  // Single-pass combined multi-radial gradient mesh: zero overlapping 560x560px animated layers & zero GPU overdraw
  const combinedMesh = [
    `radial-gradient(circle 310px at 50% 16%, ${withColorAlpha(ambientColors[0], a1, fallback1)} 0%, ${withColorAlpha(ambientColors[0], a1 * 0.65, fallback1)} 34%, transparent 74%)`,
    `radial-gradient(circle 270px at 90% 38%, ${withColorAlpha(ambientColors[1], a2, fallback2)} 0%, ${withColorAlpha(ambientColors[1], a2 * 0.65, fallback2)} 34%, transparent 74%)`,
    `radial-gradient(circle 250px at 12% 62%, ${withColorAlpha(ambientColors[2], a3, fallback3)} 0%, ${withColorAlpha(ambientColors[2], a3 * 0.65, fallback3)} 34%, transparent 74%)`,
  ].join(', ');

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#FAF8F5] dark:bg-[#0B0F17] ${className}`}
      style={{ contain: 'strict' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: combinedMesh,
          opacity: intensity,
          transition: 'opacity 360ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'opacity',
        }}
      />
    </div>
  );
});
