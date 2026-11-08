import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAppStore } from '../../store/useAppStore';
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
  const [isPrewarmed, setIsPrewarmed] = useState(false);

  // Pre-warm DOM tree during idle after boot so opening/closing PersonalHubModal has 0ms mount cost
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsPrewarmed(true);
    }, 650);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPersonalHubOpen) {
      setIsPrewarmed(true);
      if (personalHubInitialTab) {
        setActiveTab(personalHubInitialTab);
      }
    }
  }, [isPersonalHubOpen, personalHubInitialTab]);

  const handleRetestFromReview = (record: IELTSTestRecord) => {
    setReviewRecord(null);
    loadArchiveToIELTS(record);
    closePersonalHub();
    setActiveSpace(2);
  };

  if (!isPrewarmed && !isPersonalHubOpen) {
    return null;
  }

  return (
    <div
      aria-hidden={!isPersonalHubOpen}
      style={{
        visibility: isPersonalHubOpen ? 'visible' : 'hidden',
        transform: isPersonalHubOpen ? 'translate3d(0, 0%, 0)' : 'translate3d(0, -102%, 0)',
        WebkitTransform: isPersonalHubOpen ? 'translate3d(0, 0%, 0)' : 'translate3d(0, -102%, 0)',
        transition: isPersonalHubOpen
          ? 'transform var(--spring-duration-modal, 320ms) cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0s'
          : 'transform var(--spring-duration-modal, 320ms) cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 320ms',
        WebkitTransition: isPersonalHubOpen
          ? '-webkit-transform var(--spring-duration-modal, 320ms) cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0s'
          : '-webkit-transform var(--spring-duration-modal, 320ms) cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 320ms',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        contain: 'layout style paint',
      }}
      className={`absolute inset-0 z-50 w-full h-full flex flex-col bg-[#FAF8F5] dark:bg-[#0B0F17] text-stone-900 dark:text-stone-100 overflow-hidden select-none hardware-accelerated ${
        isPersonalHubOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Static Pre-feathered Ambient Mesh */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden opacity-70 dark:opacity-45"
        style={{
          contain: 'strict',
          background: `radial-gradient(circle at 15% 15%, ${withColorAlpha(ambientColors[0] || '#D4DCD2', 0.42)} 0%, transparent 60%), radial-gradient(circle at 85% 45%, ${withColorAlpha(ambientColors[1] || '#EAE2D5', 0.38)} 0%, transparent 60%), radial-gradient(circle at 40% 85%, ${withColorAlpha(ambientColors[2] || '#D2C8BA', 0.34)} 0%, transparent 65%)`,
        }}
      />

      {/* Top Tactile Segmented Bar - Balanced top safe-area breathing room */}
      <div className="relative z-10 px-5 pt-[var(--android-safe-top,max(3.25rem,calc(env(safe-area-inset-top,44px)+0.85rem)))] pb-2 flex-shrink-0 bg-transparent">
        {/* Apple-grade Milled Segmented Control */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-stone-900/[0.06] dark:bg-white/8 text-xs font-medium border border-stone-900/[0.04] dark:border-white/5 shadow-2xs">
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

      {/* Scrollable Content View - Direct Unmasked Flow (Zero Backdrop Root / Zero Top Band Seam) */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4.5 pt-2.5 pb-8 overscroll-contain touch-pan-y no-scrollbar">
          {activeTab === 'compass' && <GrowthCompassTab />}
          {activeTab === 'archives' && (
            <IELTSArchivesTab onOpenReview={(record) => setReviewRecord(record)} />
          )}
          {activeTab === 'settings' && <SettingsSyncTab />}
        </div>
      </div>

      {/* Seamless Bottom Return Handle (Wide & Flat Soft Chevron) */}
      <div className="relative z-10 flex-shrink-0 pt-1.5 pb-[max(0.625rem,calc(env(safe-area-inset-bottom,0px)+0.35rem))] flex items-center justify-center bg-transparent">
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
    </div>
  );
};
