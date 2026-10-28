import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';

export const BottomNavDots: React.FC = () => {
  const activeSpace = useAppStore(s => s.activeSpace);
  const setActiveSpace = useAppStore(s => s.setActiveSpace);
  const isPlaylistOpen = useAppStore(s => s.isPlaylistOpen);
  const isWordSheetOpen = useAppStore(s => s.isWordSheetOpen);
  const isFullscreenLyricsOpen = useAppStore(s => s.isFullscreenLyricsOpen);
  const isVocabRadarOpen = useAppStore(s => s.isVocabRadarOpen);
  const isPersonalHubOpen = useAppStore(s => s.isPersonalHubOpen);
  const isScannerActive = useAppStore(s => s.isScannerActive);
  const isDark = useAppStore(s => s.isDark);
  const activePassageData = useAppStore(s => s.activePassageData);
  const activeListeningSectionData = useAppStore(s => s.activeListeningSectionData);
  const isQuizDrawerOpen = useAppStore(s => s.isQuizDrawerOpen);
  const isNotebookOpen = useAppStore(s => s.isNotebookOpen);
  const isCambridgeSelectorOpen = useAppStore(s => s.isCambridgeSelectorOpen);
  const isAssessmentModalOpen = useAppStore(s => s.isAssessmentModalOpen);

  // Hide 3 dots when taking a test / viewing passage, or when drawers/sheets are open
  const isHidden =
    isPlaylistOpen ||
    isWordSheetOpen ||
    isFullscreenLyricsOpen ||
    isVocabRadarOpen ||
    isQuizDrawerOpen ||
    Boolean(activePassageData) ||
    Boolean(activeListeningSectionData) ||
    isPersonalHubOpen ||
    isNotebookOpen ||
    isCambridgeSelectorOpen ||
    isAssessmentModalOpen;

  // Use light translucent dots when over camera viewfinder (Space 0) or in dark mode
  const isLightDots = isDark || activeSpace === 0;

  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.nav
          key="bottom-nav-dots"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Spaces pagination"
          className="absolute bottom-[max(1rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))] left-0 right-0 z-30 flex items-center justify-center pointer-events-none"
        >
          <div className="flex items-center gap-1.5 px-2 py-1 pointer-events-auto">
            {[0, 1, 2].map((idx) => {
              const isActive = activeSpace === idx;
              return (
                <button
                  key={`nav-space-dot-${idx}`}
                  id={`nav-dot-space-${idx}`}
                  onClick={() => setActiveSpace(idx)}
                  className="relative p-2.5 focus:outline-hidden group cursor-pointer flex items-center justify-center"
                  aria-label={`Go to ${idx === 0 ? 'AR Space' : idx === 1 ? 'Music Hub' : 'IELTS Space'}`}
                >
                  <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className={`block rounded-full transition-colors duration-300 ${
                      isActive
                        ? isLightDots
                          ? 'w-4 h-1 bg-white/85 shadow-[0_1px_4px_rgba(0,0,0,0.3)]'
                          : 'w-4 h-1 bg-[#516050]'
                        : isLightDots
                          ? 'w-1 h-1 bg-white/35 hover:bg-white/60'
                          : 'w-1 h-1 bg-stone-400/45 hover:bg-stone-500/70'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};
