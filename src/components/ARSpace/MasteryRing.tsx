import React from 'react';
import { MasteryLevel } from '../../types';

interface MasteryRingProps {
  level: MasteryLevel;
  size?: number;
  className?: string;
  onToggle?: (e: React.MouseEvent) => void;
  interactive?: boolean;
}

export const MasteryRing: React.FC<MasteryRingProps> = ({
  level,
  size = 20,
  className = '',
  onToggle,
  interactive = true
}) => {
  const currentLevel = Math.max(0, Math.min(3, level ?? 0)) as MasteryLevel;

  const getRingColor = () => {
    switch (currentLevel) {
      case 0:
        return 'text-white/40 dark:text-stone-500';
      case 1:
        return 'text-[#8FB996] dark:text-[#8FB996]';
      case 2:
        return 'text-amber-400 dark:text-amber-300';
      case 3:
        return 'text-emerald-400 dark:text-emerald-400';
      default:
        return 'text-white/40';
    }
  };

  const getTitle = () => {
    switch (currentLevel) {
      case 0:
        return '掌握度：未收录 (点击加入词库)';
      case 1:
        return '掌握度：已收藏 (点击切换为学习中)';
      case 2:
        return '掌握度：学习中 (点击切换为已掌握)';
      case 3:
        return '掌握度：已掌握 (点击重置)';
      default:
        return '掌握度';
    }
  };

  return (
    <button
      type="button"
      onClick={interactive && onToggle ? onToggle : undefined}
      disabled={!interactive || !onToggle}
      title={getTitle()}
      aria-label={getTitle()}
      className={`relative inline-flex items-center justify-center flex-shrink-0 transition-transform ${
        interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`transition-colors duration-300 ${getRingColor()}`}
      >
        {/* Outer Circular Track */}
        <circle
          cx="12"
          cy="12"
          r="8.5"
          stroke="currentColor"
          strokeWidth="1.75"
          className="transition-all duration-300"
        />

        {/* Level 1: ⊛ Small Inner Star-Core */}
        {currentLevel === 1 && (
          <circle
            cx="12"
            cy="12"
            r="2.2"
            fill="currentColor"
            className="animate-in zoom-in-50 duration-200"
          />
        )}

        {/* Level 2: ⊙ Medium Concentric Core */}
        {currentLevel === 2 && (
          <circle
            cx="12"
            cy="12"
            r="4.2"
            fill="currentColor"
            className="animate-in zoom-in-50 duration-200"
          />
        )}

        {/* Level 3: ◉ Solid Filled Orb */}
        {currentLevel === 3 && (
          <circle
            cx="12"
            cy="12"
            r="6.4"
            fill="currentColor"
            className="animate-in zoom-in-50 duration-200"
          />
        )}
      </svg>
    </button>
  );
};
