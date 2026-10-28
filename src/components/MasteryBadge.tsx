import React from 'react';
import { MasteryLevel } from '../types';

interface MasteryBadgeProps {
  level: MasteryLevel;
  size?: number;
  onClick?: (e: React.MouseEvent) => void;
  interactive?: boolean;
  className?: string;
  showTooltip?: boolean;
}

export const MASTERY_CONFIG: Record<MasteryLevel, { label: string; glyph: string; subtitle: string; color: string }> = {
  0: {
    label: '未收录',
    glyph: '○',
    subtitle: '中空 · 未收录到单词集',
    color: '#A8A29E', // stone-400
  },
  1: {
    label: '已加入单词集',
    glyph: '⊚',
    subtitle: '针尖微点 · 已加入单词本',
    color: '#516050', // sage green
  },
  2: {
    label: '熟悉/学习中',
    glyph: '⊙',
    subtitle: '中核点 · 复习精读中',
    color: '#8C7A5B', // warm ochre/amber
  },
  3: {
    label: '已掌握',
    glyph: '◉',
    subtitle: '饱满实心 · 完全掌握',
    color: '#2F4F2F', // deep forest green
  }
};

export const MasteryBadge: React.FC<MasteryBadgeProps> = ({
  level = 0,
  size = 24,
  onClick,
  interactive = true,
  className = '',
  showTooltip = true
}) => {
  const safeLevel = Math.max(0, Math.min(3, level || 0)) as MasteryLevel;
  const config = MASTERY_CONFIG[safeLevel];

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    onClick?.(e);
  };

  const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
  };

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleTouch}
      onMouseUp={handleTouch}
      onTouchStart={handleTouch}
      onTouchEnd={handleTouch}
      title={showTooltip ? `掌握度: Level ${safeLevel} · ${config.label} (${config.subtitle}) - 点击切换` : undefined}
      className={`relative flex items-center justify-center select-none transition-transform ${
        interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      role={interactive ? 'button' : 'status'}
      aria-label={`Mastery Level ${safeLevel}: ${config.label}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="transition-all duration-300"
      >
        {/* Outer Ring (Consistently elegant across all 4 states) */}
        <circle
          cx="12"
          cy="12"
          r="8.5"
          className={`transition-colors duration-300 ${
            safeLevel === 0
              ? 'stroke-stone-400/80 dark:stroke-stone-500/80'
              : safeLevel === 1
              ? 'stroke-[#516050] dark:stroke-[#8FB996]'
              : safeLevel === 2
              ? 'stroke-[#8C7A5B] dark:stroke-amber-400'
              : 'stroke-[#516050] dark:stroke-[#8FB996]'
          }`}
          strokeWidth="1.6"
        />

        {/* 0. 未收录: ○ 中空 (No inner dot) */}
        {safeLevel === 0 && null}

        {/* 1. 已加入单词集: ⊚ 针尖微点 (Pinpoint dot, r=1.4) */}
        {safeLevel === 1 && (
          <circle
            cx="12"
            cy="12"
            r="1.5"
            className="fill-[#516050] dark:fill-[#8FB996] transition-all duration-300"
          />
        )}

        {/* 2. 熟悉/学习中: ⊙ 中核点 (Core medium dot, r=3.6) */}
        {safeLevel === 2 && (
          <circle
            cx="12"
            cy="12"
            r="3.6"
            className="fill-[#8C7A5B] dark:fill-amber-400 transition-all duration-300"
          />
        )}

        {/* 3. 已掌握: ◉ 饱满实心 (Full solid disc, r=6.0) */}
        {safeLevel === 3 && (
          <circle
            cx="12"
            cy="12"
            r="6.0"
            className="fill-[#516050] dark:fill-[#8FB996] transition-all duration-300"
          />
        )}
      </svg>
    </div>
  );
};
