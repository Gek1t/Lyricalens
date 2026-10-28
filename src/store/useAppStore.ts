import { create } from 'zustand';
import { WordItem, SongItem, IELTSTestRecord, AudioQuality, AUDIO_QUALITY_OPTIONS } from '../types';
import { CambridgePassage, CAMBRIDGE_IELTS_PASSAGES } from '../data/ieltsPassages';
import { SEED_SONGS } from '../db/seedData';
import { toggleWordStar, collectWord } from '../db';

interface AppState {
  // Navigation
  activeSpace: number; // 0: AR, 1: Music, 2: IELTS
  setActiveSpace: (space: number) => void;

  // Theme
  isDark: boolean;
  toggleTheme: () => void;

  // Music Player
  songs: SongItem[];
  currentSongIndex: number;
  songTransitionDirection: 'up' | 'down' | 'left' | 'right';
  isPlaying: boolean;
  isPlaylistOpen: boolean;
  isFullscreenLyricsOpen: boolean;
  isVocabRadarOpen: boolean;
  isAudioQualityModalOpen: boolean;
  setIsAudioQualityModalOpen: (open: boolean) => void;
  audioQuality: AudioQuality;
  setAudioQuality: (quality: AudioQuality) => void;
  currentTime: number;
  duration: number;
  ambientColors: [string, string, string];
  activeLyricIndex: number;
  userScrollingLyrics: boolean;
  lyricsOffsets: Record<string, number>;
  setLyricsOffset: (songId: string, offsetSec: number) => void;
  setSongs: (songs: SongItem[]) => void;
  setCurrentSongIndex: (index: number, direction?: 'up' | 'down' | 'left' | 'right') => void;
  setIsPlaying: (playing: boolean) => void;
  setIsPlaylistOpen: (open: boolean) => void;
  setIsFullscreenLyricsOpen: (open: boolean) => void;
  setIsVocabRadarOpen: (open: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (dur: number) => void;
  setAmbientColors: (colors: [string, string, string]) => void;
  setActiveLyricIndex: (index: number) => void;
  setUserScrollingLyrics: (scrolling: boolean) => void;
  nextSong: (direction?: 'up' | 'down' | 'left' | 'right') => void;
  prevSong: (direction?: 'up' | 'down' | 'left' | 'right') => void;

  // Word Detail Page (Full Screen) vs Quick Drawer
  selectedWord: WordItem | null;
  isWordSheetOpen: boolean;
  wordViewMode: 'drawer' | 'fullscreen';
  heroOriginRect: { x: number; y: number; width: number; height: number } | null;
  openWordDetail: (word: WordItem, heroRect?: { x: number; y: number; width: number; height: number } | null, mode?: 'drawer' | 'fullscreen') => void;
  closeWordDetail: () => void;
  toggleSelectedWordStar: () => Promise<void>;

  // IELTS & Quiz
  isQuizDrawerOpen: boolean;
  setQuizDrawerOpen: (open: boolean) => void;
  currentQuizQuestionIndex: number;
  setCurrentQuizQuestionIndex: (idx: number) => void;
  userAnswers: Record<number, string>;
  setUserAnswer: (questionId: number, answer: string) => void;
  resetUserAnswers: () => void;
  assessmentResult: IELTSTestRecord | null;
  isAssessmentModalOpen: boolean;
  setAssessmentModalOpen: (open: boolean) => void;
  setAssessmentResult: (result: IELTSTestRecord | null) => void;
  isGeneratingPassage: boolean;
  setIsGeneratingPassage: (generating: boolean) => void;
  targetIELTSWords: string[] | null;
  setTargetIELTSWords: (words: string[] | null) => void;
  generateIELTSTestFromWords: (words: string[]) => void;
  isCambridgeSelectorOpen: boolean;
  setCambridgeSelectorOpen: (open: boolean) => void;
  openCambridgeSelector: () => void;
  closeCambridgeSelector: () => void;
  isOnlineSearchOpen: boolean;
  onlineSearchInitialSkill: 'reading' | 'listening';
  onlineSearchInitialQuery: string;
  openOnlineSearch: (skill?: 'reading' | 'listening', query?: string) => void;
  closeOnlineSearch: () => void;
  currentPassageId: string;
  setCurrentPassageId: (id: string) => void;
  activePassageData: any | null;
  setActivePassageData: (passage: any) => void;
  loadCambridgePassage: (passage: any, matchedWords?: string[]) => void;
  activeListeningSectionData: any | null;
  setActiveListeningSectionData: (section: any | null) => void;
  loadCambridgeListening: (section: any) => void;
  selectedCambridgePassage: { passage: CambridgePassage; matchedWords?: string[] } | null;
  setSelectedCambridgePassage: (val: { passage: CambridgePassage; matchedWords?: string[] } | null) => void;
  selectCambridgePassage: (passage: CambridgePassage, matchedWords?: string[]) => void;
  ieltsViewMode: 'hub' | 'reading' | 'listening';
  setIeltsViewMode: (mode: 'hub' | 'reading' | 'listening') => void;
  isIeltsHubSubView: boolean;
  setIsIeltsHubSubView: (isSub: boolean) => void;
  ieltsHubResetSignal: number;
  triggerIeltsHubReset: () => void;
  isIeltsTimeoutModalOpen: boolean;
  setIsIeltsTimeoutModalOpen: (open: boolean) => void;
  isIeltsAdjustMenuOpen: boolean;
  setIsIeltsAdjustMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;

  // AR Scanner
  isScannerActive: boolean;
  setScannerActive: (active: boolean) => void;
  isArFrozen: boolean;
  setIsArFrozen: (frozen: boolean) => void;
  arActiveBubbleId: string | null;
  setArActiveBubbleId: (id: string | null) => void;

  // Personal Hub & Archive Panel
  isPersonalHubOpen: boolean;
  setIsPersonalHubOpen: (open: boolean) => void;
  openPersonalHub: () => void;
  closePersonalHub: () => void;
  activeArchiveReviewRecord: IELTSTestRecord | null;
  setActiveArchiveReviewRecord: (record: IELTSTestRecord | null) => void;
  isCheckedInToday: boolean;
  checkInToday: () => void;
  activeArchivePassage: IELTSTestRecord | null;
  loadArchiveToIELTS: (record: IELTSTestRecord) => void;

  // Vocabulary Vault / Notebook Modal
  isNotebookOpen: boolean;
  notebookInitialFilter: 'ALL' | 'DUE_REVIEW' | 'UNMASTERED' | 'MASTERED' | 'LEVEL_1' | 'LEVEL_0' | 'IELTS';
  notebookAutoFlashcard: boolean;
  isNotebookFlashcardOpen: boolean;
  setIsNotebookFlashcardOpen: (open: boolean) => void;
  isNotebookTagModalOpen: boolean;
  setIsNotebookTagModalOpen: (open: boolean) => void;
  isNotebookBatchMode: boolean;
  setIsNotebookBatchMode: (batch: boolean) => void;
  openNotebook: (
    filter?: 'ALL' | 'DUE_REVIEW' | 'UNMASTERED' | 'MASTERED' | 'LEVEL_1' | 'LEVEL_0' | 'IELTS',
    autoStartFlashcard?: boolean
  ) => void;
  closeNotebook: () => void;

  // Notification Toast for silent collections
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  activeSpace: 1, // Start on Music Hub as primary anchor
  setActiveSpace: (space) => set({ activeSpace: Math.max(0, Math.min(2, space)) }),

  // Theme
  isDark: false,
  toggleTheme: () => {
    const next = !get().isDark;
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDark: next });
  },

  // Music Player
  songs: SEED_SONGS,
  currentSongIndex: 0,
  songTransitionDirection: 'right',
  isPlaying: false,
  isPlaylistOpen: false,
  isFullscreenLyricsOpen: false,
  isVocabRadarOpen: false,
  audioQuality: (() => {
    try {
      const saved = localStorage.getItem('lyricalens_audio_quality') as AudioQuality;
      if (['standard', 'higher', 'exhigh', 'lossless', 'hires'].includes(saved)) {
        return saved;
      }
      return 'exhigh';
    } catch {
      return 'exhigh';
    }
  })(),
  setAudioQuality: (quality: AudioQuality) => {
    try {
      localStorage.setItem('lyricalens_audio_quality', quality);
    } catch (e) {
      console.error('Failed to save audio quality:', e);
    }
    set({ audioQuality: quality });
  },
  currentTime: 0,
  duration: 168,
  ambientColors: SEED_SONGS[0]?.palette || ['#7C8F6E', '#C4AC82', '#A69880'],
  activeLyricIndex: 0,
  userScrollingLyrics: false,
  lyricsOffsets: (() => {
    try {
      const saved = localStorage.getItem('ambient_lyrics_offsets');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  })(),
  setLyricsOffset: (songId: string, offsetSec: number) => {
    const prev = get().lyricsOffsets;
    const next = { ...prev, [songId]: Math.round(offsetSec * 10) / 10 };
    try {
      localStorage.setItem('ambient_lyrics_offsets', JSON.stringify(next));
    } catch (e) {
      console.error('Failed to save lyrics offset:', e);
    }
    set({ lyricsOffsets: next });
  },
  setSongs: (songs) => {
    const currIdx = get().currentSongIndex;
    const safeIdx = songs.length > 0 ? Math.min(currIdx, songs.length - 1) : 0;
    const activeSong = songs[safeIdx];
    set({
      songs,
      currentSongIndex: safeIdx,
      ambientColors: activeSong?.palette || get().ambientColors || ['#7C8F6E', '#C4AC82', '#A69880']
    });
  },
  setCurrentSongIndex: (index, direction) => {
    const songs = get().songs;
    if (!songs || songs.length === 0) {
      set({ currentSongIndex: 0 });
      return;
    }
    const bounded = (index + songs.length) % songs.length;
    const defaultDir = index >= get().currentSongIndex ? 'right' : 'left';
    set({
      currentSongIndex: bounded,
      songTransitionDirection: direction || defaultDir,
      ambientColors: songs[bounded]?.palette || get().ambientColors || ['#7C8F6E', '#C4AC82', '#A69880'],
      currentTime: 0,
      activeLyricIndex: 0
    });
  },
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsPlaylistOpen: (isPlaylistOpen) => set({ isPlaylistOpen }),
  setIsFullscreenLyricsOpen: (isFullscreenLyricsOpen) => set({ isFullscreenLyricsOpen }),
  setIsVocabRadarOpen: (isVocabRadarOpen) => set({ isVocabRadarOpen }),
  isAudioQualityModalOpen: false,
  setIsAudioQualityModalOpen: (isAudioQualityModalOpen) => set({ isAudioQualityModalOpen }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setAmbientColors: (ambientColors) => set({ ambientColors }),
  setActiveLyricIndex: (activeLyricIndex) => set({ activeLyricIndex }),
  setUserScrollingLyrics: (userScrollingLyrics) => set({ userScrollingLyrics }),
  nextSong: (direction = 'right') => {
    const { currentSongIndex, songs } = get();
    if (!songs || songs.length === 0) return;
    const nextIdx = (currentSongIndex + 1) % songs.length;
    get().setCurrentSongIndex(nextIdx, direction);
  },
  prevSong: (direction = 'left') => {
    const { currentSongIndex, songs } = get();
    if (!songs || songs.length === 0) return;
    const prevIdx = (currentSongIndex - 1 + songs.length) % songs.length;
    get().setCurrentSongIndex(prevIdx, direction);
  },

  // Word Detail Page (Full Screen)
  selectedWord: null,
  isWordSheetOpen: false,
  wordViewMode: 'drawer',
  heroOriginRect: null,
  openWordDetail: (word, heroRect = null, mode = 'drawer') => {
    set({ selectedWord: word, isWordSheetOpen: true, heroOriginRect: heroRect, wordViewMode: mode });
  },
  closeWordDetail: () => set({ isWordSheetOpen: false, heroOriginRect: null }),
  toggleSelectedWordStar: async () => {
    const { selectedWord } = get();
    if (!selectedWord) return;
    const nextStarred = await toggleWordStar(selectedWord.word);
    set({
      selectedWord: { ...selectedWord, isStarred: nextStarred }
    });
  },

  // IELTS & Quiz
  isQuizDrawerOpen: false,
  setQuizDrawerOpen: (isQuizDrawerOpen) => set({ isQuizDrawerOpen }),
  currentQuizQuestionIndex: 0,
  setCurrentQuizQuestionIndex: (currentQuizQuestionIndex) => set({ currentQuizQuestionIndex }),
  userAnswers: {},
  setUserAnswer: (questionId, answer) => {
    set((state) => ({
      userAnswers: { ...state.userAnswers, [questionId]: answer }
    }));
  },
  resetUserAnswers: () => set({ userAnswers: {} }),
  assessmentResult: null,
  isAssessmentModalOpen: false,
  setAssessmentModalOpen: (isAssessmentModalOpen) => set({ isAssessmentModalOpen }),
  setAssessmentResult: (assessmentResult) => set({ assessmentResult }),
  isGeneratingPassage: false,
  setIsGeneratingPassage: (isGeneratingPassage) => set({ isGeneratingPassage }),
  targetIELTSWords: null,
  setTargetIELTSWords: (targetIELTSWords) => set({ targetIELTSWords }),
  generateIELTSTestFromWords: (words: string[]) => {
    set({ targetIELTSWords: words, activeSpace: 2 });
  },
  isCambridgeSelectorOpen: false,
  setCambridgeSelectorOpen: (isCambridgeSelectorOpen) => set({ isCambridgeSelectorOpen }),
  openCambridgeSelector: () => set({ isCambridgeSelectorOpen: true }),
  closeCambridgeSelector: () => set({ isCambridgeSelectorOpen: false }),
  isOnlineSearchOpen: false,
  onlineSearchInitialSkill: 'reading',
  onlineSearchInitialQuery: '',
  openOnlineSearch: (skill = 'reading', query = '') =>
    set({
      isOnlineSearchOpen: true,
      onlineSearchInitialSkill: skill,
      onlineSearchInitialQuery: query
    }),
  closeOnlineSearch: () => set({ isOnlineSearchOpen: false, onlineSearchInitialQuery: '' }),
  currentPassageId: 'c18-t1-p2',
  setCurrentPassageId: (currentPassageId) => set({ currentPassageId }),
  activePassageData: null,
  setActivePassageData: (activePassageData) => set({ activePassageData }),
  loadCambridgePassage: (passage: any, matchedWords?: string[]) => {
    if (typeof passage === 'string') {
      const found = CAMBRIDGE_IELTS_PASSAGES.find(p => p.id === passage);
      if (found) {
        set({
          currentPassageId: found.id,
          activePassageData: {
            id: found.id,
            title: found.title,
            subtitle: found.subtitle,
            timeAllowedMins: found.timeAllowedMins,
            text: found.text,
            questions: found.questions
          },
          userAnswers: {},
          currentQuizQuestionIndex: 0,
          isCambridgeSelectorOpen: false,
          isOnlineSearchOpen: false,
          activeSpace: 2,
          ieltsViewMode: 'reading'
        });
        return;
      }
      set({
        currentPassageId: passage,
        userAnswers: {},
        currentQuizQuestionIndex: 0,
        isCambridgeSelectorOpen: false,
        isOnlineSearchOpen: false,
        activeSpace: 2,
        ieltsViewMode: 'reading'
      });
      return;
    }

    set({
      currentPassageId: passage.id,
      activePassageData: {
        id: passage.id,
        title: passage.title,
        subtitle: passage.subtitle,
        timeAllowedMins: passage.timeAllowedMins,
        text: passage.text,
        questions: passage.questions
      },
      userAnswers: {},
      currentQuizQuestionIndex: 0,
      isCambridgeSelectorOpen: false,
      isOnlineSearchOpen: false,
      activeSpace: 2,
      ieltsViewMode: 'reading'
    });
  },
  activeListeningSectionData: null,
  setActiveListeningSectionData: (section) => set({ activeListeningSectionData: section }),
  loadCambridgeListening: (section: any) => {
    set({
      activeListeningSectionData: section,
      isCambridgeSelectorOpen: false,
      isOnlineSearchOpen: false,
      activeSpace: 2,
      ieltsViewMode: 'listening'
    });
  },
  selectedCambridgePassage: null,
  setSelectedCambridgePassage: (selectedCambridgePassage) => set({ selectedCambridgePassage }),
  selectCambridgePassage: (passage, matchedWords) => {
    get().loadCambridgePassage(passage, matchedWords);
  },
  ieltsViewMode: 'hub',
  setIeltsViewMode: (ieltsViewMode) => set({ ieltsViewMode }),
  isIeltsHubSubView: false,
  setIsIeltsHubSubView: (isIeltsHubSubView) => set({ isIeltsHubSubView }),
  ieltsHubResetSignal: 0,
  triggerIeltsHubReset: () => set(state => ({ ieltsHubResetSignal: state.ieltsHubResetSignal + 1 })),
  isIeltsTimeoutModalOpen: false,
  setIsIeltsTimeoutModalOpen: (isIeltsTimeoutModalOpen) => set({ isIeltsTimeoutModalOpen }),
  isIeltsAdjustMenuOpen: false,
  setIsIeltsAdjustMenuOpen: (val) =>
    set(state => ({
      isIeltsAdjustMenuOpen: typeof val === 'function' ? val(state.isIeltsAdjustMenuOpen) : val
    })),

  // AR Scanner
  isScannerActive: true,
  setScannerActive: (isScannerActive) => set({ isScannerActive }),
  isArFrozen: false,
  setIsArFrozen: (isArFrozen) => set({ isArFrozen }),
  arActiveBubbleId: null,
  setArActiveBubbleId: (arActiveBubbleId) => set({ arActiveBubbleId }),

  // Personal Hub & Archive Panel
  isPersonalHubOpen: false,
  setIsPersonalHubOpen: (isPersonalHubOpen) => set({ isPersonalHubOpen }),
  openPersonalHub: () => set({ isPersonalHubOpen: true }),
  closePersonalHub: () => set({ isPersonalHubOpen: false, activeArchiveReviewRecord: null }),
  activeArchiveReviewRecord: null,
  setActiveArchiveReviewRecord: (activeArchiveReviewRecord) => set({ activeArchiveReviewRecord }),
  isCheckedInToday: (() => {
    try {
      if (localStorage.getItem('lyricalens_streak_fresh_v3') !== 'true') {
        localStorage.removeItem('lyricalens_checkin_history');
        localStorage.removeItem('lyricalens_checked_in_date');
        localStorage.setItem('lyricalens_streak_fresh_v3', 'true');
        return false;
      }
      const today = new Date().toISOString().slice(0, 10);
      return localStorage.getItem('lyricalens_checked_in_date') === today;
    } catch {
      return false;
    }
  })(),
  checkInToday: () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('lyricalens_checked_in_date', today);
    } catch (e) {
      console.warn('Failed to save check-in state:', e);
    }
    set({ isCheckedInToday: true });
  },
  activeArchivePassage: null,
  loadArchiveToIELTS: (record) => {
    set({
      activeArchivePassage: record,
      activeSpace: 2,
      isPersonalHubOpen: false,
      activeArchiveReviewRecord: null
    });
  },

  // Vocabulary Vault / Notebook Modal
  isNotebookOpen: false,
  notebookInitialFilter: 'ALL',
  notebookAutoFlashcard: false,
  isNotebookFlashcardOpen: false,
  setIsNotebookFlashcardOpen: (isNotebookFlashcardOpen) => set({ isNotebookFlashcardOpen }),
  isNotebookTagModalOpen: false,
  setIsNotebookTagModalOpen: (isNotebookTagModalOpen) => set({ isNotebookTagModalOpen }),
  isNotebookBatchMode: false,
  setIsNotebookBatchMode: (isNotebookBatchMode) => set({ isNotebookBatchMode }),
  openNotebook: (filter = 'ALL', autoStartFlashcard = false) =>
    set({
      isNotebookOpen: true,
      notebookInitialFilter: filter,
      notebookAutoFlashcard: autoStartFlashcard,
      isNotebookFlashcardOpen: autoStartFlashcard,
      isPersonalHubOpen: false
    }),
  closeNotebook: () =>
    set({
      isNotebookOpen: false,
      notebookAutoFlashcard: false,
      isNotebookFlashcardOpen: false,
      isNotebookTagModalOpen: false,
      isNotebookBatchMode: false
    }),

  // Notification Toast
  toastMessage: null,
  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 2400);
  }
}));
