import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../store/useAppStore';
import { triggerHighRefreshBoost } from '../../utils/displayRefreshRate';
import { withColorAlpha } from '../../utils/colorExtractor';
import { GrowthCompassTab } from './GrowthCompassTab';
import { IELTSArchivesTab } from './IELTSArchivesTab';
import { SettingsSyncTab } from './SettingsSyncTab';
import { ArchiveReviewModal } from './ArchiveReviewModal';
import { IELTSTestRecord } from '../../types';

type HubTab = 'compass' | 'archives' | 'settings';

export const PersonalHubModal: React.FC = () => {
  const isPersonalHubOpen = useAppStore(s => s.isPersonalHubOpen);
  const personalHubInitialTab = useAppStore(s => s.personalHubInitialTab);
  const closePersonalHub = useAppStore(s => s.closePersonalHub);
  const loadArchiveToIELTS = useAppStore(s => s.loadArchiveToIELTS);
  const setActiveSpace = useAppStore(s => s.setActiveSpace);
  const reviewRecord = useAppStore(s => s.activeArchiveReviewRecord);
  const setReviewRecord = useAppStore(s => s.setActiveArchiveReviewRecord);
  const ambientColors = useAppStore(s => s.ambientColors);

  const [activeTab, setActiveTab] = useState<HubTab>(personalHubInitialTab || 'compass');
  const [isContentMounted, setIsContentMounted] = useState(false);

  useEffect(() => {
    if (isPersonalHubOpen) {
      triggerHighRefreshBoost(1400);
      if (personalHubInitialTab) {
        setActiveTab(personalHubInitialTab);
      }
      // Defer heavy tab DOM & IndexedDB queries by 1 VSync frame so Frame 0 of the slide-down spring is 100% jank-free
      const raf = requestAnimationFrame(() => {
        setIsContentMounted(true);
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setIsContentMounted(false);
    }
  }, [isPersonalHubOpen, personalHubInitialTab]);

  const handleRetestFromReview = (record: IELTSTestRecord) => {
    setReviewRecord(null);
    loadArchiveToIELTS(record);
    closePersonalHub();
    setActiveSpace(2);
  };

  return (
    <AnimatePresence>
      {isPersonalHubOpen && (
        <motion.div
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 310, mass: 0.8 }}
          style={{
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          className="absolute inset-0 z-50 w-full h-full flex flex-col bg-[#FAF8F5] dark:bg-[#0B0F17] text-stone-900 dark:text-stone-100 overflow-hidden pointer-events-auto select-none hardware-accelerated"
        >
          {/* Static Pre-feathered Ambient Mesh (Avoids running a 2nd animated AmbientBackground instance during slide-down) */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden opacity-70 dark:opacity-45"
            style={{
              contain: 'strict',
              background: `radial-gradient(circle at 15% 15%, ${withColorAlpha(ambientColors[0] || '#D4DCD2', 0.42)} 0%, transparent 60%), radial-gradient(circle at 85% 45%, ${withColorAlpha(ambientColors[1] || '#EAE2D5', 0.38)} 0%, transparent 60%), radial-gradient(circle at 40% 85%, ${withColorAlpha(ambientColors[2] || '#D2C8BA', 0.34)} 0%, transparent 65%)`,
            }}
          />

          {/* Top Tactile Segmented Bar - Balanced top safe-area breathing room */}
          <div className="relative z-10 px-5 pt-[var(--android-safe-top,max(3.25rem,calc(env(safe-area-inset-top,44px)+0.85rem)))] pb-2.5 flex-shrink-0 bg-transparent">
            {/* Apple-grade Milled Segmented Control */}
            <div className="grid grid-cols-3 p-1 rounded-2xl bg-stone-200/60 dark:bg-white/8 text-xs font-medium border border-stone-200/40 dark:border-white/5 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('compass')}
                className={`py-1.5 rounded-xl transition-colors cursor-pointer text-center ${
                  activeTab === 'compass'
                    ? 'bg-white dark:bg-[#18212D] text-stone-900 dark:text-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                成长数据
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('archives')}
                className={`py-1.5 rounded-xl transition-colors cursor-pointer text-center ${
                  activeTab === 'archives'
                    ? 'bg-white dark:bg-[#18212D] text-stone-900 dark:text-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                模考档案
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`py-1.5 rounded-xl transition-colors cursor-pointer text-center ${
                  activeTab === 'settings'
                    ? 'bg-white dark:bg-[#18212D] text-stone-900 dark:text-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                同步与设置
              </button>
            </div>
          </div>

          {/* Scrollable Content View with Lightweight Top/Bottom Gradient Fade Overlays (Replaces expensive CSS mask-image) */}
          <div className="relative z-10 flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-5 bg-gradient-to-b from-[#FAF8F5] dark:from-[#0B0F17] to-transparent z-20" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#FAF8F5] dark:from-[#0B0F17] to-transparent z-20" />
            <div
              className="flex-1 overflow-y-auto px-4.5 pt-3 pb-8 overscroll-contain touch-pan-y no-scrollbar"
              style={{ contain: 'layout paint' }}
            >
              {isContentMounted && activeTab === 'compass' && <GrowthCompassTab />}
              {isContentMounted && activeTab === 'archives' && (
                <IELTSArchivesTab onOpenReview={(record) => setReviewRecord(record)} />
              )}
              {isContentMounted && activeTab === 'settings' && <SettingsSyncTab />}
            </div>
          </div>

          {/* Seamless Bottom Return Handle (Wide & Flat Soft Chevron) */}
          <div className="relative z-10 flex-shrink-0 pt-2 pb-[max(0.625rem,calc(env(safe-area-inset-bottom,0px)+0.35rem))] flex items-center justify-center bg-transparent">
            <button
              id="personal-hub-bottom-return-btn"
              type="button"
              onClick={closePersonalHub}
              className="group py-1.5 px-8 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              title="收起返回主界面"
              aria-label="收起返回"
            >
              {/* Wide & Flat Soft Chevron */}
              <svg
                width="56"
                height="8"
                viewBox="0 0 56 8"
                fill="none"
                className="text-stone-400/80 group-hover:text-stone-600 dark:text-stone-500/80 dark:group-hover:text-stone-300 transition-colors"
              >
                <path
                  d="M2 6.5L28 1.5L54 6.5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Fullscreen IELTS Archive Review View */}
          <AnimatePresence>
            {reviewRecord && (
              <ArchiveReviewModal
                record={reviewRecord}
                isOpen={!!reviewRecord}
                onClose={() => setReviewRecord(null)}
                onRetest={handleRetestFromReview}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
