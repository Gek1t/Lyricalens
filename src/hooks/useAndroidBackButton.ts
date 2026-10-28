import { useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { useAppStore } from '../store/useAppStore';

export function useAndroidBackButton() {
  const lastBackPressRef = useRef<number>(0);

  useEffect(() => {
    const handleBackButton = () => {
      const state = useAppStore.getState();

      // ==========================================
      // 1. Level 1: Overlays, Modals, and Drawers (highest to lowest visual hierarchy)
      // ==========================================

      // Topmost: Word Detail Fullscreen Sheet or Drawer
      if (state.isWordSheetOpen) {
        state.closeWordDetail();
        lastBackPressRef.current = 0;
        return;
      }

      // IELTS Archive Review Modal (opened from inside Personal Hub)
      if (state.activeArchiveReviewRecord) {
        state.setActiveArchiveReviewRecord(null);
        lastBackPressRef.current = 0;
        return;
      }

      // Notebook nested sub-views: Tagging modal, Flashcard practice, Batch mode
      if (state.isNotebookTagModalOpen) {
        state.setIsNotebookTagModalOpen(false);
        lastBackPressRef.current = 0;
        return;
      }
      if (state.isNotebookFlashcardOpen) {
        state.setIsNotebookFlashcardOpen(false);
        lastBackPressRef.current = 0;
        return;
      }
      if (state.isNotebookBatchMode) {
        state.setIsNotebookBatchMode(false);
        lastBackPressRef.current = 0;
        return;
      }

      // IELTS exam popovers: Timeout modal, Timer adjust menu
      if (state.isIeltsTimeoutModalOpen) {
        state.setIsIeltsTimeoutModalOpen(false);
        lastBackPressRef.current = 0;
        return;
      }
      if (state.isIeltsAdjustMenuOpen) {
        state.setIsIeltsAdjustMenuOpen(false);
        lastBackPressRef.current = 0;
        return;
      }

      // Assessment result summary modal
      if (state.isAssessmentModalOpen) {
        state.setAssessmentModalOpen(false);
        lastBackPressRef.current = 0;
        return;
      }

      // Quiz Drawer in IELTS
      if (state.isQuizDrawerOpen) {
        state.setQuizDrawerOpen(false);
        lastBackPressRef.current = 0;
        return;
      }

      // Cambridge Passage Selector Modal
      if (state.isCambridgeSelectorOpen) {
        state.closeCambridgeSelector();
        lastBackPressRef.current = 0;
        return;
      }

      // Online IELTS Search / Bookshelf Modal
      if (state.isOnlineSearchOpen) {
        state.closeOnlineSearch();
        lastBackPressRef.current = 0;
        return;
      }

      // Vocabulary Vault / Notebook Modal
      if (state.isNotebookOpen) {
        state.closeNotebook();
        lastBackPressRef.current = 0;
        return;
      }

      // Personal Hub Modal
      if (state.isPersonalHubOpen) {
        state.closePersonalHub();
        lastBackPressRef.current = 0;
        return;
      }

      // Audio Quality Selection Sheet
      if (state.isAudioQualityModalOpen) {
        state.setIsAudioQualityModalOpen(false);
        lastBackPressRef.current = 0;
        return;
      }

      // Vocab Radar Drawer
      if (state.isVocabRadarOpen) {
        state.setIsVocabRadarOpen(false);
        lastBackPressRef.current = 0;
        return;
      }

      // Playlist Drawer
      if (state.isPlaylistOpen) {
        state.setIsPlaylistOpen(false);
        lastBackPressRef.current = 0;
        return;
      }

      // Fullscreen Lyrics View
      if (state.isFullscreenLyricsOpen) {
        state.setIsFullscreenLyricsOpen(false);
        lastBackPressRef.current = 0;
        return;
      }

      // ==========================================
      // 2. Level 2: In-Space Subviews & Inner Navigations
      // ==========================================

      // In Space 2 (IELTS):
      if (state.activeSpace === 2) {
        // If in Reading or Listening test mode, return to IELTS Hub (选题界面)
        if (
          state.ieltsViewMode === 'reading' ||
          state.ieltsViewMode === 'listening' ||
          state.activePassageData ||
          state.activeListeningSectionData
        ) {
          state.setIeltsViewMode('hub');
          state.setActivePassageData(null);
          state.setActiveListeningSectionData(null);
          lastBackPressRef.current = 0;
          return;
        }

        // If in IELTS Hub subview (search/filter/bookshelf), reset to main shelf
        if (state.isIeltsHubSubView) {
          state.triggerIeltsHubReset();
          state.setIsIeltsHubSubView(false);
          lastBackPressRef.current = 0;
          return;
        }
      }

      // In Space 0 (AR):
      if (state.activeSpace === 0) {
        // If a spatial tag bubble is open, close the bubble
        if (state.arActiveBubbleId) {
          state.setArActiveBubbleId(null);
          lastBackPressRef.current = 0;
          return;
        }
        // If the camera frame is frozen, unfreeze back to live camera
        if (state.isArFrozen) {
          state.setIsArFrozen(false);
          lastBackPressRef.current = 0;
          return;
        }
      }

      // ==========================================
      // 3. Level 3: Tri-Space Navigation
      // ==========================================
      // If currently on AR Space (0) or IELTS Space (2) with no modals open -> Return to Central Music Hub (Space 1)
      if (state.activeSpace === 0 || state.activeSpace === 2) {
        state.setActiveSpace(1);
        lastBackPressRef.current = 0;
        return;
      }

      // ==========================================
      // 4. Level 4: Central Music Hub (Space 1) -> Double-tap Back to Exit App
      // ==========================================
      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        CapApp.exitApp();
      } else {
        lastBackPressRef.current = now;
        state.showToast('再按一次退出应用');
      }
    };

    let listenerHandle: PluginListenerHandle | null = null;
    let isMounted = true;

    // Register Capacitor Native Android Back Button Listener
    CapApp.addListener('backButton', () => {
      handleBackButton();
    })
      .then((handle) => {
        if (isMounted) {
          listenerHandle = handle;
        } else {
          handle.remove();
        }
      })
      .catch((err) => {
        console.warn('Capacitor backButton listener unavailable (running on web):', err);
      });

    // Also support Keyboard 'Escape' key for desktop browser testing
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBackButton();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isMounted = false;
      if (listenerHandle) {
        listenerHandle.remove();
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
