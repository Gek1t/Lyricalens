import React, { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppStore } from '../store/useAppStore';
import { useGestureEngine } from '../hooks/useGestureEngine';
import { initDisplayRefreshRateAdapter, triggerHighRefreshBoost } from '../utils/displayRefreshRate';
import { initializeDatabase, db } from '../db';
import { SEED_SONGS } from '../db/seedData';
import { prioritizeSongsByNotebook } from '../utils/vocabEngine';
import { ARCameraPanel } from './ARSpace/ARCameraPanel';
import { MusicPlayerPanel } from './MusicSpace/MusicPlayerPanel';
import { IELTSPanel } from './IELTSSpace/IELTSPanel';
import { WordDrawer } from './WordDrawer';
import { WordDetailSheet } from './WordDetailSheet';
import { PlaylistDrawer } from './MusicSpace/PlaylistDrawer';
import { NotebookModal } from './NotebookModal';
import { AssessmentSummaryModal } from './IELTSSpace/AssessmentSummaryModal';
import { CambridgePassageSelectorModal } from './IELTSSpace/CambridgePassageSelectorModal';
import { OnlineIELTSSearchModal } from './IELTSSpace/OnlineIELTSSearchModal';
import { PersonalHubModal } from './PersonalHub/PersonalHubModal';
import { AmbientBackground } from './AmbientBackground';
import { BottomNavDots } from './BottomNavDots';
import { ToastNotification } from './ToastNotification';

// Memoize the three primary space panels so modal state toggles or space switches never trigger cascade Virtual DOM re-renders
const MemoizedARCameraPanel = React.memo(ARCameraPanel);
const MemoizedMusicPlayerPanel = React.memo(MusicPlayerPanel);
const MemoizedIELTSPanel = React.memo(IELTSPanel);

export const ViewPager: React.FC = () => {
  const activeSpace = useAppStore(s => s.activeSpace);
  const selectedWord = useAppStore(s => s.selectedWord);
  const isWordSheetOpen = useAppStore(s => s.isWordSheetOpen);
  const wordViewMode = useAppStore(s => s.wordViewMode);
  const closeWordDetail = useAppStore(s => s.closeWordDetail);
  const isNotebookOpen = useAppStore(s => s.isNotebookOpen);
  const openNotebook = useAppStore(s => s.openNotebook);
  const closeNotebook = useAppStore(s => s.closeNotebook);

  const handleOpenNotebook = useCallback(() => {
    triggerHighRefreshBoost(1200);
    openNotebook();
  }, [openNotebook]);

  useEffect(() => {
    triggerHighRefreshBoost(1000);
  }, [activeSpace, isWordSheetOpen, isNotebookOpen]);

  // Initialize adaptive refresh rate detector (60Hz / 90Hz / 120Hz / 144Hz) + Dexie.js database
  useEffect(() => {
    initDisplayRefreshRateAdapter();
    async function setupApp() {
      await initializeDatabase();
      try {
        const rawStored = await db.songs.toArray();
        const storedSongs = rawStored.filter(s => s && s.title !== 'Jasmine Breeze' && s.title !== 'Urban Solitude' && s.id !== '1' && s.id !== '2' && s.id !== 'song-jasmine-breeze' && s.id !== 'song-urban-solitude');
        const storedWords = await db.words.toArray();
        if (storedSongs && storedSongs.length > 0) {
          const prioritized = prioritizeSongsByNotebook(storedSongs, storedWords);
          useAppStore.getState().setSongs(prioritized);
        } else {
          // Filter current songs if any or fallback to SEED_SONGS
          const rawCurrent = useAppStore.getState().songs.length > 0 ? useAppStore.getState().songs : SEED_SONGS;
          const currentSongs = rawCurrent.filter(s => s && s.title !== 'Jasmine Breeze' && s.title !== 'Urban Solitude' && s.id !== '1' && s.id !== '2' && s.id !== 'song-jasmine-breeze' && s.id !== 'song-urban-solitude');
          const finalSongs = currentSongs.length > 0 ? currentSongs : SEED_SONGS;
          const prioritized = prioritizeSongsByNotebook(finalSongs, storedWords);
          useAppStore.getState().setSongs(prioritized);
        }
      } catch (err) {
        console.warn('Failed to load songs from DB on startup:', err);
      }
    }
    setupApp();
  }, []);

  // Enable directional gesture engine (X-axis space swipe & Y-axis song swipe)
  useGestureEngine();

  // Responsive device scaling: Match original AI Studio phone aspect ratio (~1:1.8, 412x740)
  const [scale, setScale] = useState(1);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = Capacitor.isNativePlatform() || w <= 480;
      setIsMobileDevice(isMobile);
      if (isMobile) {
        setScale(1);
      } else {
        const targetW = 412;
        const targetH = 740;
        const padding = 28;
        const scaleX = (w - padding) / targetW;
        const scaleY = (h - padding) / targetH;
        setScale(Math.min(1.0, scaleX, scaleY));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-[100dvh] flex items-center justify-center bg-[#FAF7F2] dark:bg-[#0B0F17] md:bg-[#EAE5DC] md:dark:bg-[#05070B] overflow-hidden select-none">
      {/* Scaled bounding wrapper to preserve layout centering */}
      <div
        style={
          isMobileDevice
            ? { width: '100%', height: '100%' }
            : {
                width: `${412 * scale}px`,
                height: `${740 * scale}px`,
              }
        }
        className="relative flex items-center justify-center shrink-0"
      >
        {/* Mobile Full-Bleed on real phones, Pixel-Perfect Scaled Device Preview on Desktop */}
        <div
          id="mobile-app-frame"
          onScroll={(e) => {
            if (e.currentTarget.scrollLeft !== 0) e.currentTarget.scrollLeft = 0;
            if (e.currentTarget.scrollTop !== 0) e.currentTarget.scrollTop = 0;
          }}
          style={
            isMobileDevice
              ? {}
              : {
                  width: '412px',
                  height: '740px',
                  transform: `scale(${scale})`,
                  transformOrigin: 'center center',
                }
          }
          className={`relative overflow-hidden overflow-clip bg-[#FAF7F2] dark:bg-[#0B0F17] text-stone-900 dark:text-stone-100 font-sans-ui transition-colors duration-500 flex flex-col ${
            isMobileDevice
              ? 'w-full h-full'
              : 'absolute rounded-[38px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] border border-stone-300/50 dark:border-stone-800/80'
          }`}
        >
          {/* Shared Seamless Ambient Backdrop across all 3 spaces (prevents hard vertical color cut between AR, Music, and IELTS spaces) */}
          <AmbientBackground
            intensity={activeSpace === 1 ? 1 : activeSpace === 2 ? 0.28 : 0.34}
          />

          {/* 300% Horizontal Tri-Space ViewPager Container with 60/120fps GPU Composition */}
          <div
            id="viewpager-viewport"
            className="w-[300%] h-full flex relative z-10 hardware-accelerated"
            style={{
              transform: `translate3d(-${(activeSpace * 100) / 3}%, 0, 0)`,
              WebkitTransform: `translate3d(-${(activeSpace * 100) / 3}%, 0, 0)`,
              transition: 'transform var(--spring-duration-space, 380ms) cubic-bezier(0.22, 1, 0.36, 1)',
              WebkitTransition: '-webkit-transform var(--spring-duration-space, 380ms) cubic-bezier(0.22, 1, 0.36, 1)',
              willChange: 'transform',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
              WebkitPerspective: 1000,
              perspective: 1000,
            }}
          >
            {/* Wide S-Curve Atmospheric Dark Backdrop spanning across the AR <-> Music boundary (0% to 56% of 300% track) so there is zero clip edge and zero Mach band */}
            <div
              id="ar-ambient-backdrop"
              className="absolute top-0 bottom-0 left-0 w-[56%] z-0 pointer-events-none hardware-accelerated"
              style={{
                opacity: activeSpace === 0 ? 1 : 0,
                transition: 'opacity var(--spring-duration-space, 380ms) cubic-bezier(0.22, 1, 0.36, 1)',
                WebkitTransition: 'opacity var(--spring-duration-space, 380ms) cubic-bezier(0.22, 1, 0.36, 1)',
                willChange: 'opacity',
                background:
                  'linear-gradient(to right, #0D0F12 0%, #0E1116 44%, rgba(14,17,22,0.97) 50%, rgba(15,18,24,0.90) 56%, rgba(16,20,27,0.78) 62%, rgba(18,22,30,0.62) 68%, rgba(20,24,32,0.44) 74%, rgba(22,26,34,0.27) 80%, rgba(24,28,36,0.14) 86%, rgba(26,29,37,0.06) 91%, rgba(28,30,38,0.015) 96%, rgba(28,30,38,0) 100%)',
              }}
            >
              {/* Full-width solid viewfinder core for Panel 0 when settled on AR Space — fades out smoothly during swipe so right edge never has a hard seam */}
              <div
                id="ar-solid-core"
                className="absolute top-0 bottom-0 left-0 w-[59.6%] bg-[#0D0F12] hardware-accelerated"
                style={{
                  opacity: activeSpace === 0 ? 1 : 0,
                  transition: 'opacity var(--spring-duration-space, 380ms) cubic-bezier(0.22, 1, 0.36, 1)',
                  WebkitTransition: 'opacity var(--spring-duration-space, 380ms) cubic-bezier(0.22, 1, 0.36, 1)',
                  willChange: 'opacity',
                }}
              />
            </div>

            {/* Panel 0 (Left - AR Space): Completely transparent container over the wide S-curve AR backdrop */}
            <div
              id="panel-ar-space"
              style={{ contain: 'layout style paint' }}
              className="w-1/3 h-full flex-shrink-0 relative z-10 overflow-hidden bg-transparent"
            >
              <div
                id="stage-ar-space"
                className="w-full h-full relative"
              >
                <MemoizedARCameraPanel onOpenNotebook={handleOpenNotebook} />
              </div>
            </div>

            {/* Panel 1 (Center - Music Hub) */}
            <div
              id="panel-music-space"
              style={{ contain: 'layout style paint' }}
              className="w-1/3 h-full flex-shrink-0 relative z-10 overflow-hidden bg-transparent"
            >
              <div
                id="stage-music-space"
                className="w-full h-full relative"
              >
                <MemoizedMusicPlayerPanel onOpenNotebook={handleOpenNotebook} />
              </div>
            </div>

            {/* Panel 2 (Right - IELTS Reading Space): Starts from-transparent at the left edge touching Music Space so there is 0% seam */}
            <div
              id="panel-ielts-space"
              style={{ contain: 'layout style paint' }}
              className="w-1/3 h-full flex-shrink-0 relative z-10 overflow-hidden bg-gradient-to-r from-transparent via-[#FAF7F2]/68 to-[#FAF7F2]/95 dark:from-transparent dark:via-[#0B0F17]/72 dark:to-[#0C1017]/96"
            >
              <div
                id="stage-ielts-space"
                className="w-full h-full relative"
              >
                <MemoizedIELTSPanel onOpenNotebook={handleOpenNotebook} />
              </div>
            </div>
          </div>

        {/* Bottom Nav 3-Dots */}
        <BottomNavDots />

        {/* 
          1. Fullscreen Vocabulary View (WordDetailSheet): Smooth Fade-in (入场渐显) and Fade-out (退场渐隐) with AnimatePresence.
          2. Single Tap Word Lookup: Interactive Two-State Bottom Sheet (WordDrawer).
        */}
        <WordDetailSheet />

        {wordViewMode === 'drawer' && (
          <WordDrawer
            wordItem={selectedWord}
            isOpen={isWordSheetOpen}
            onClose={closeWordDetail}
          />
        )}

        {/* Global Music Playlist Drawer (Flush bottom-anchored with smooth slide & gestures) */}
        <PlaylistDrawer />

        {/* Starred & Collected Vocabulary Vault Modal */}
        <NotebookModal
          isOpen={isNotebookOpen}
          onClose={closeNotebook}
        />

        {/* IELTS Assessment Summary Modal */}
        <AssessmentSummaryModal />

        {/* Cambridge Official Reading Passage Selector Modal */}
        <CambridgePassageSelectorModal />

        {/* Cambridge Volumes & Online Real-time Bookshelf Modal */}
        <OnlineIELTSSearchModal />

        {/* Spatial Slide-Down Personal Hub & Archive (Placed strictly inside the mobile viewport container) */}
        <PersonalHubModal />

        {/* Instant Micro-Toast for Collections */}
        <ToastNotification />
      </div>
    </div>
  </div>
  );
};
