import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MoreHorizontal, Moon, Sun, BookMarked } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface TopHeaderProps {
  centerLabel?: string;
  centerContent?: React.ReactNode;
  centerKey?: string;
  songTitle?: string;
  className?: string;
  variant?: 'default' | 'camera';
  leftIcon?: React.ReactNode;
  leftKey?: string;
  leftTitle?: string;
  onLeftClick?: () => void;
  onOpenNotebook?: () => void;
  rightSlot?: React.ReactNode;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  centerLabel = "NOW PLAYING",
  centerContent,
  centerKey,
  className = "",
  variant = 'default',
  leftIcon,
  leftKey,
  leftTitle,
  onLeftClick,
  onOpenNotebook,
  rightSlot
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDark = useAppStore(s => s.isDark);
  const toggleTheme = useAppStore(s => s.toggleTheme);
  const openPersonalHub = useAppStore(s => s.openPersonalHub);

  const isCamera = variant === 'camera';

  const handleLeftButtonClick = () => {
    if (onLeftClick) {
      onLeftClick();
    } else {
      openPersonalHub();
    }
  };

  return (
    <header
      className={`relative w-full z-40 pt-[var(--android-safe-top,max(3.25rem,calc(env(safe-area-inset-top,44px)+0.85rem)))] pb-2.5 px-5 flex items-center justify-between shrink-0 pointer-events-auto transition-all duration-300 ${
        isCamera ? 'bg-gradient-to-b from-black/50 via-black/15 to-transparent' : ''
      } ${className}`}
    >
      {/* Left circular button */}
      <button
        id="top-header-left-btn"
        onClick={handleLeftButtonClick}
        className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all cursor-pointer group overflow-hidden focus:outline-none ${
          isCamera
            ? 'text-white bg-white/14 hover:bg-white/22 backdrop-blur-xl border border-white/25 shadow-[0_2px_10px_rgba(0,0,0,0.18)]'
            : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-500/10 dark:hover:bg-white/10'
        }`}
        title={leftTitle || "Open Personal Hub & Archives (个人中心与试卷档案)"}
        aria-label={leftTitle || "Open Personal Hub"}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={leftKey || (leftIcon ? 'custom-left-icon' : 'default-chevron-icon')}
            initial={{ opacity: 0, y: 6, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.88 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center"
          >
            {leftIcon || <ChevronDown className="w-4.5 h-4.5 opacity-90 group-hover:translate-y-0.5 transition-transform" />}
          </motion.span>
        </AnimatePresence>
      </button>

      {/* Center tracking-spaced metadata / Animated Center Node */}
      <div className="flex-1 flex items-center justify-center text-center px-2 overflow-visible h-8">
        <AnimatePresence mode="wait" initial={false}>
          {centerContent ? (
            <motion.div
              key={centerKey || 'custom-content'}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center"
            >
              {centerContent}
            </motion.div>
          ) : (
            <motion.div
              key={centerLabel}
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center"
            >
              <span
                className={`uppercase text-[11px] font-sans font-medium tracking-[0.25em] select-none truncate ${
                  isCamera
                    ? 'text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]'
                    : 'text-[#78716C] dark:text-stone-400'
                }`}
              >
                {centerLabel}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right circular buttons */}
      <div className="relative flex items-center gap-2">
        {rightSlot}
        <button
          id="top-header-more-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all cursor-pointer ${
            isCamera
              ? 'text-white bg-white/14 hover:bg-white/22 backdrop-blur-xl border border-white/25 shadow-[0_2px_10px_rgba(0,0,0,0.18)]'
              : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-500/10 dark:hover:bg-white/10'
          }`}
          aria-label="More options"
        >
          <MoreHorizontal className="w-4.5 h-4.5 opacity-90" />
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="absolute right-0 top-11 w-56 rounded-2xl p-2 bg-[#FDFBF7]/95 dark:bg-[#121826]/95 backdrop-blur-2xl border border-stone-200/60 dark:border-slate-800 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
              <button
                id="menu-open-notebook-btn"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenNotebook?.();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors text-left cursor-pointer"
              >
                <BookMarked className="w-4 h-4 text-[#516050] dark:text-[#8FB996]" />
                <span>Vocabulary Vault</span>
              </button>

              <button
                id="menu-toggle-theme-btn"
                onClick={() => {
                  toggleTheme();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors text-left cursor-pointer"
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Warm Cream Paper Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span>Obsidian Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

