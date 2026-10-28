import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../store/useAppStore';
import { AmbientBackground } from '../AmbientBackground';
import { GrowthCompassTab } from './GrowthCompassTab';
import { IELTSArchivesTab } from './IELTSArchivesTab';
import { SettingsSyncTab } from './SettingsSyncTab';
import { ArchiveReviewModal } from './ArchiveReviewModal';
import { IELTSTestRecord } from '../../types';

type HubTab = 'compass' | 'archives' | 'settings';

export const PersonalHubModal: React.FC = () => {
  const isPersonalHubOpen = useAppStore(s => s.isPersonalHubOpen);
  const closePersonalHub = useAppStore(s => s.closePersonalHub);
  const loadArchiveToIELTS = useAppStore(s => s.loadArchiveToIELTS);
  const setActiveSpace = useAppStore(s => s.setActiveSpace);
  const isDark = useAppStore(s => s.isDark);
  const reviewRecord = useAppStore(s => s.activeArchiveReviewRecord);
  const setReviewRecord = useAppStore(s => s.setActiveArchiveReviewRecord);

  const [activeTab, setActiveTab] = useState<HubTab>('compass');

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
          initial={{ y: '-100%', opacity: 0.95 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.85 }}
          className="absolute inset-0 z-50 w-full h-full flex flex-col bg-[#FAF8F5] dark:bg-[#0B0F17] text-stone-900 dark:text-stone-100 overflow-hidden pointer-events-auto select-none transition-colors duration-700"
        >
          {/* Exact Ambient Dynamic Background with softer intensity for personal hub */}
          <AmbientBackground intensity={0.72} />

          {/* Top Tactile Segmented Bar - Balanced top safe-area breathing room */}
          <div className="relative z-10 px-5 pt-[var(--android-safe-top,max(3.25rem,calc(env(safe-area-inset-top,44px)+0.85rem)))] pb-2.5 flex-shrink-0 bg-transparent">
            {/* Apple-grade Milled Segmented Control */}
            <div className="grid grid-cols-3 p-1 rounded-2xl bg-stone-200/50 dark:bg-white/6 text-xs font-medium border border-stone-200/40 dark:border-white/5 backdrop-blur-sm shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('compass')}
                className={`py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                  activeTab === 'compass'
                    ? 'bg-white/95 dark:bg-[#18212D]/95 text-stone-900 dark:text-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                成长数据
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('archives')}
                className={`py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                  activeTab === 'archives'
                    ? 'bg-white/95 dark:bg-[#18212D]/95 text-stone-900 dark:text-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                模考档案
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                  activeTab === 'settings'
                    ? 'bg-white/95 dark:bg-[#18212D]/95 text-stone-900 dark:text-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                同步与设置
              </button>
            </div>
          </div>

          {/* Scrollable Content View with Top & Bottom Smooth Dissolve Mask */}
          <div
            className="relative z-10 flex-1 overflow-y-auto px-4.5 pt-3 pb-8 overscroll-contain touch-pan-y no-scrollbar"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 28px, black calc(100% - 32px), transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 28px, black calc(100% - 32px), transparent 100%)',
            }}
          >
            {activeTab === 'compass' && <GrowthCompassTab />}
            {activeTab === 'archives' && (
              <IELTSArchivesTab onOpenReview={(record) => setReviewRecord(record)} />
            )}
            {activeTab === 'settings' && <SettingsSyncTab />}
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
