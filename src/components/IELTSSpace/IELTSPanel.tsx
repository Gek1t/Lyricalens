import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../../store/useAppStore';
import { SEED_PASSAGE } from '../../db/seedData';
import { CAMBRIDGE_IELTS_PASSAGES, CambridgePassage, matchBestPassageByVocab } from '../../data/ieltsPassages';
import { IELTSListeningSection } from '../../data/ieltsListening';
import { IELTSTestRecord, IELTSQuestion } from '../../types';
import { db, collectWord, bulkUpdateMastery } from '../../db';
import { TopHeader } from '../TopHeader';
import { IELTSHubView } from './IELTSHubView';
import { IELTSListeningView } from './IELTSListeningView';
import { speakWord } from '../../utils/audioEngine';
import { lookupLyricTerm, cleanWordText } from '../../utils/lyricDictionary';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  Minus,
  Sliders,
  History,
  AlertCircle,
  Type,
  MoveVertical,
  X,
  RotateCcw,
  Play,
  Pause,
  BookOpen
} from 'lucide-react';

interface IELTSPanelProps {
  onOpenNotebook: () => void;
}

interface GestureState {
  isLongPressing: boolean;
  activeParaIdx: number | null;
  startWordIdx: number | null;
  currentWordIdx: number | null;
  touchStartX: number;
  touchStartY: number;
  touchCurrentX: number;
  touchCurrentY: number;
  selectedText: string;
  fullSentence: string;
  isMultiWord: boolean;
  isDwellLocked: boolean;
  anchorX: number;
  anchorY: number;
  isEscapingUp: boolean;
  isSavingDown: boolean;
  canReArm: boolean;
}

interface TokenizedWord {
  wIdx: number;
  leading: string;
  word: string;
  clean: string;
  trailing: string;
  sentence: string;
}

interface TokenizedParagraph {
  pIdx: number;
  tokens: TokenizedWord[];
  rawText: string;
}

const STANDARD_TIME_SEC = 20 * 60; // 20 minutes standard IELTS reading passage

export const IELTSPanel: React.FC<IELTSPanelProps> = ({ onOpenNotebook }) => {
  const viewMode = useAppStore(s => s.ieltsViewMode);
  const setViewMode = useAppStore(s => s.setIeltsViewMode);
  const isHubSubView = useAppStore(s => s.isIeltsHubSubView);
  const setIsHubSubView = useAppStore(s => s.setIsIeltsHubSubView);
  const hubResetSignal = useAppStore(s => s.ieltsHubResetSignal);
  const triggerIeltsHubReset = useAppStore(s => s.triggerIeltsHubReset);
  const [activeListeningSection, setActiveListeningSection] = useState<IELTSListeningSection | null>(null);
  const [passageData, setPassageData] = useState<{
    title: string;
    subtitle: string;
    timeAllowedMins: number;
    text: string;
    questions: IELTSQuestion[];
  }>(SEED_PASSAGE);
  const [drawerHeightPercent, setDrawerHeightPercent] = useState<number>(26);
  const [isDragging, setIsDragging] = useState(false);
  
  // Real-time notebook words for hit calculation
  const allDbWords = useLiveQuery(() => db.words.toArray()) || [];
  const userWordStrings = useMemo(() => allDbWords.map(w => w.word), [allDbWords]);
  
  // Timer & Extension States
  const [timerSeconds, setTimerSeconds] = useState<number>(STANDARD_TIME_SEC);
  const [totalAddedSeconds, setTotalAddedSeconds] = useState<number>(0);
  const [extensionCount, setExtensionCount] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const isTimeoutModalOpen = useAppStore(s => s.isIeltsTimeoutModalOpen);
  const setIsTimeoutModalOpen = useAppStore(s => s.setIsIeltsTimeoutModalOpen);
  const isAdjustMenuOpen = useAppStore(s => s.isIeltsAdjustMenuOpen);
  const setIsAdjustMenuOpen = useAppStore(s => s.setIsIeltsAdjustMenuOpen);
  const [isCustomStepOpen, setIsCustomStepOpen] = useState<boolean>(false);
  
  // History memory for last extension
  const [lastExtensionMinutes, setLastExtensionMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ielts_last_extension_mins');
      return saved ? parseInt(saved, 10) || 5 : 5;
    } catch {
      return 5;
    }
  });
  const [customMinutes, setCustomMinutes] = useState<number>(5);

  // In-situ animation feedbacks
  const [particleFeedback, setParticleFeedback] = useState<{ id: number; text: string; key: number } | null>(null);
  const [isPulseAnim, setIsPulseAnim] = useState<boolean>(false);

  const [isPassageScrolled, setIsPassageScrolled] = useState(false);

  // Active adjustment drawer ('font' | 'spacing' | null)
  const [activeAdjustPanel, setActiveAdjustPanel] = useState<'font' | 'spacing' | null>(null);

  // Continuous font size state with safe min (14px) / max (26px) bounds
  const MIN_FONT_SIZE = 13;
  const MAX_FONT_SIZE = 24;
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('ielts_reading_font_size');
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= MIN_FONT_SIZE && parsed <= MAX_FONT_SIZE) return parsed;
    }
    return 15.5; // Default 15.5px
  });

  // Continuous line spacing state with safe min (1.4) / max (2.6) multiplier or pt bounds
  const MIN_LINE_SPACING = 1.4;
  const MAX_LINE_SPACING = 2.6;
  const [lineSpacing, setLineSpacing] = useState<number>(() => {
    const saved = localStorage.getItem('ielts_reading_line_spacing');
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= MIN_LINE_SPACING && parsed <= MAX_LINE_SPACING) return parsed;
    }
    return 1.85; // Default 1.85 line-height ratio
  });

  const handleFontSizeChange = (val: number) => {
    const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, val));
    setFontSize(clamped);
    localStorage.setItem('ielts_reading_font_size', clamped.toString());
  };

  const handleLineSpacingChange = (val: number) => {
    const clamped = Math.max(MIN_LINE_SPACING, Math.min(MAX_LINE_SPACING, val));
    setLineSpacing(clamped);
    localStorage.setItem('ielts_reading_line_spacing', clamped.toString());
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number>(0);
  const dragStartHeightRef = useRef<number>(26);

  const activeSpace = useAppStore(s => s.activeSpace);
  const currentQuizQuestionIndex = useAppStore(s => s.currentQuizQuestionIndex);
  const setCurrentQuizQuestionIndex = useAppStore(s => s.setCurrentQuizQuestionIndex);
  const userAnswers = useAppStore(s => s.userAnswers);
  const setUserAnswer = useAppStore(s => s.setUserAnswer);
  const resetUserAnswers = useAppStore(s => s.resetUserAnswers);
  const setAssessmentResult = useAppStore(s => s.setAssessmentResult);
  const setAssessmentModalOpen = useAppStore(s => s.setAssessmentModalOpen);
  const isGeneratingPassage = useAppStore(s => s.isGeneratingPassage);
  const setIsGeneratingPassage = useAppStore(s => s.setIsGeneratingPassage);
  const isWordSheetOpen = useAppStore(s => s.isWordSheetOpen);
  const openWordDetail = useAppStore(s => s.openWordDetail);
  const showToast = useAppStore(s => s.showToast);

  const openCambridgeSelector = useAppStore(s => s.openCambridgeSelector);
  const activePassageData = useAppStore(s => s.activePassageData);
  const setActivePassageData = useAppStore(s => s.setActivePassageData);
  const currentPassageId = useAppStore(s => s.currentPassageId);
  const setCurrentPassageId = useAppStore(s => s.setCurrentPassageId);

  const targetIELTSWords = useAppStore(s => s.targetIELTSWords);
  const setTargetIELTSWords = useAppStore(s => s.setTargetIELTSWords);
  const activeArchivePassage = useAppStore(s => s.activeArchivePassage);
  const activeListeningSectionData = useAppStore(s => s.activeListeningSectionData);
  const setActiveListeningSectionData = useAppStore(s => s.setActiveListeningSectionData);

  // Query collected words from Dexie database to highlight in text
  const collectedWords = useLiveQuery(() => db.words.toArray(), []);
  const savedWordsSet = useMemo(() => {
    if (!collectedWords) return new Set<string>();
    const set = new Set<string>();
    for (const item of collectedWords) {
      if (item.word) {
        const clean = cleanWordText(item.word).toLowerCase();
        if (clean) set.add(clean);
      }
    }
    return set;
  }, [collectedWords]);

  // Query custom online passages from Dexie
  const customPassages = useLiveQuery(() => db.customPassages.toArray(), []) || [];

  // Active Cambridge Passage Metadata for clean editorial header display
  const activeCambridgeInfo = useMemo(() => {
    const allPassages = [...customPassages, ...CAMBRIDGE_IELTS_PASSAGES];
    return allPassages.find(p => p.id === currentPassageId) || {
      id: currentPassageId || 'c18_t1_p2',
      cambridgeBook: 'Cambridge IELTS',
      testNum: 1,
      passageNum: 1,
      category: 'Academic Reading',
      title: passageData.title,
      bandDifficulty: 'Band 7.5 - 8.5'
    };
  }, [currentPassageId, passageData.title, customPassages]);

  // Active quiz questions
  const questions: IELTSQuestion[] = passageData.questions;
  const currentQuestion = questions[currentQuizQuestionIndex] || questions[0];

  // Gesture State Machine for long press and sliding phrase selection
  const [gestureState, setGestureState] = useState<GestureState>({
    isLongPressing: false,
    activeParaIdx: null,
    startWordIdx: null,
    currentWordIdx: null,
    touchStartX: 0,
    touchStartY: 0,
    touchCurrentX: 0,
    touchCurrentY: 0,
    selectedText: '',
    fullSentence: '',
    isMultiWord: false,
    isDwellLocked: false,
    anchorX: 0,
    anchorY: 0,
    isEscapingUp: false,
    isSavingDown: false,
    canReArm: false
  });

  const [highlightAnchor, setHighlightAnchor] = useState<{
    paraIdx: number;
    startWord: number;
    endWord: number;
  } | null>(null);

  const passageContainerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const dwellTimerRef = useRef<number | null>(null);
  const autoScrollAnimRef = useRef<number | null>(null);
  const autoScrollSpeedRef = useRef<number>(0);

  const touchStartPosRef = useRef<{
    x: number;
    y: number;
    paraIdx: number;
    wordIdx: number;
    wordText: string;
    sentence: string;
  } | null>(null);

  // Trigger tactile haptic feedback safely
  const triggerHaptic = (pattern: number | number[] = 15) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // ignore
    }
  };

  // Stop auto-scroll loop
  const stopAutoScroll = () => {
    if (autoScrollAnimRef.current !== null) {
      cancelAnimationFrame(autoScrollAnimRef.current);
      autoScrollAnimRef.current = null;
    }
    autoScrollSpeedRef.current = 0;
  };

  // Edge auto-scroll loop
  const stepAutoScroll = () => {
    const container = passageContainerRef.current;
    if (container && autoScrollSpeedRef.current !== 0) {
      container.scrollTop += autoScrollSpeedRef.current;
      autoScrollAnimRef.current = requestAnimationFrame(stepAutoScroll);
    } else {
      stopAutoScroll();
    }
  };

  // Check edge auto-scroll near top/bottom
  const updateEdgeScroll = (clientY: number) => {
    const container = passageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const edgeThreshold = 70;
    const maxSpeed = 10;

    if (clientY < rect.top + edgeThreshold && clientY > rect.top - 20) {
      const ratio = 1 - Math.max(0, (clientY - rect.top) / edgeThreshold);
      autoScrollSpeedRef.current = -Math.max(2, ratio * maxSpeed);
      if (autoScrollAnimRef.current === null) {
        autoScrollAnimRef.current = requestAnimationFrame(stepAutoScroll);
      }
    } else if (clientY > rect.bottom - edgeThreshold && clientY < rect.bottom + 20) {
      const ratio = 1 - Math.max(0, (rect.bottom - clientY) / edgeThreshold);
      autoScrollSpeedRef.current = Math.max(2, ratio * maxSpeed);
      if (autoScrollAnimRef.current === null) {
        autoScrollAnimRef.current = requestAnimationFrame(stepAutoScroll);
      }
    } else {
      stopAutoScroll();
    }
  };

  // Clear dwell timer
  const clearDwellTimer = () => {
    if (dwellTimerRef.current !== null) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
  };

  // Schedule Dwell Lock (200ms stationary)
  const scheduleDwellLock = (clientX: number, clientY: number) => {
    clearDwellTimer();
    dwellTimerRef.current = window.setTimeout(() => {
      triggerHaptic([18, 35, 18]); // Dwell-lock tactile pulse
      setGestureState((prev) => ({
        ...prev,
        isDwellLocked: true,
        canReArm: true,
        anchorX: clientX,
        anchorY: clientY,
        isSavingDown: false,
        isEscapingUp: false
      }));
    }, 200);
  };

  // Clear highlight when word sheet is closed
  useEffect(() => {
    if (!isWordSheetOpen) {
      setHighlightAnchor(null);
    }
  }, [isWordSheetOpen]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearDwellTimer();
      stopAutoScroll();
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  // Drag to resize quiz drawer
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = drawerHeightPercent;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaY = dragStartYRef.current - moveEvent.clientY;
      const deltaPercent = (deltaY / rect.height) * 100;
      const nextPercent = Math.min(Math.max(dragStartHeightRef.current + deltaPercent, 18), 92);
      setDrawerHeightPercent(nextPercent);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const isExpanded = drawerHeightPercent >= 36;

  // Timer countdown logic with timeout detection (only runs when active space is IELTS and user started)
  useEffect(() => {
    if (!isTimerRunning || activeSpace !== 2) return;

    const timer = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          setIsTimeoutModalOpen(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning, activeSpace]);

  // Select and load an authentic Cambridge IELTS reading test
  const handleSelectCambridgePassage = (passage: CambridgePassage, matchedWords?: string[]) => {
    setPassageData({
      title: passage.title,
      subtitle: passage.subtitle,
      timeAllowedMins: passage.timeAllowedMins,
      text: passage.text,
      questions: passage.questions
    });
    setCurrentPassageId(passage.id);
    setCurrentQuizQuestionIndex(0);
    resetUserAnswers();
    setTimerSeconds(passage.timeAllowedMins * 60);
    setTotalAddedSeconds(0);
    setExtensionCount(0);
    setIsTimerRunning(false);
    setHasStarted(false);
    setViewMode('reading');
  };

  // Start reading from IELTS Hub Shelf
  const handleStartFromHub = (passage: CambridgePassage, autoStartTimer = false, matchedWords?: string[]) => {
    handleSelectCambridgePassage(passage, matchedWords);
    if (autoStartTimer) {
      setIsTimerRunning(true);
      setHasStarted(true);
    }
    setViewMode('reading');
  };

  // Start listening practice from IELTS Hub Shelf
  const handleStartListening = (section: IELTSListeningSection) => {
    setActiveListeningSection(section);
    setViewMode('listening');
  };

  // Listen to activeListeningSectionData from store
  useEffect(() => {
    if (activeListeningSectionData) {
      setActiveListeningSection(activeListeningSectionData);
      setViewMode('listening');
      setActiveListeningSectionData(null);
    }
  }, [activeListeningSectionData, setActiveListeningSectionData]);

  // Listen to activePassageData selected from CambridgePassageSelectorModal or store
  useEffect(() => {
    if (activePassageData) {
      setPassageData({
        title: activePassageData.title,
        subtitle: activePassageData.subtitle,
        timeAllowedMins: activePassageData.timeAllowedMins || 20,
        text: activePassageData.text,
        questions: activePassageData.questions
      });
      setCurrentQuizQuestionIndex(0);
      resetUserAnswers();
      setTimerSeconds((activePassageData.timeAllowedMins || 20) * 60);
      setTotalAddedSeconds(0);
      setExtensionCount(0);
      setIsTimerRunning(false);
      setHasStarted(false);
      setViewMode('reading');
      setActivePassageData(null);
    }
  }, [activePassageData, setActivePassageData]);

  // Listen to targetIELTSWords from Vocabulary Vault: match the Cambridge official passage with highest hit rate!
  useEffect(() => {
    if (targetIELTSWords && targetIELTSWords.length > 0) {
      const { passage, matchedWords, hitCount } = matchBestPassageByVocab(targetIELTSWords);
      handleSelectCambridgePassage(passage, matchedWords);
      setTargetIELTSWords(null);
      setViewMode('reading');
    }
  }, [targetIELTSWords]);

  // Listen to activeArchivePassage loaded from Personal Hub & Archive
  useEffect(() => {
    if (activeArchivePassage) {
      setPassageData({
        title: activeArchivePassage.passageTitle,
        subtitle: activeArchivePassage.passageSubtitle || 'ARCHIVED PASSAGE · ACADEMIC READING',
        timeAllowedMins: 20,
        text: activeArchivePassage.passageText,
        questions: activeArchivePassage.questions
      });
      setTimerSeconds(STANDARD_TIME_SEC);
      setTotalAddedSeconds(0);
      setExtensionCount(0);
      setIsTimerRunning(false);
      setHasStarted(false);
      setViewMode('reading');
      showToast(`Loaded Archive: "${activeArchivePassage.passageTitle}"`);
    }
  }, [activeArchivePassage]);

  // Automatically close adjustment menus when returning to hub
  useEffect(() => {
    if (viewMode === 'hub') {
      setIsAdjustMenuOpen(false);
      setActiveAdjustPanel(null);
    }
  }, [viewMode]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Toggle start / pause exam timer
  const handleToggleTimer = () => {
    setIsTimerRunning(prev => {
      const next = !prev;
      if (next && !hasStarted) {
        setHasStarted(true);
      }
      return next;
    });
  };

  // Reset exam timer to initial standard 20:00
  const handleResetTimer = () => {
    setTimerSeconds(STANDARD_TIME_SEC);
    setTotalAddedSeconds(0);
    setExtensionCount(0);
    setIsTimerRunning(false);
    setHasStarted(false);
    showToast('Timer reset to 20:00');
  };

  // Add time extension with in-situ particle animation & pulse
  const handleAddTime = (minutes: number) => {
    const addedSec = minutes * 60;
    setTimerSeconds(prev => prev + addedSec);
    setTotalAddedSeconds(prev => prev + addedSec);
    setExtensionCount(prev => prev + 1);
    setIsTimerRunning(true);
    setHasStarted(true);
    setIsTimeoutModalOpen(false);
    setIsAdjustMenuOpen(false);

    // Save habit
    setLastExtensionMinutes(minutes);
    try {
      localStorage.setItem('ielts_last_extension_mins', String(minutes));
    } catch {
      // ignore
    }

    // Trigger in-situ particle floating badge
    const feedbackText = `+${minutes < 10 ? '0' + minutes : minutes}:00`;
    setParticleFeedback({ id: Date.now(), text: feedbackText, key: Date.now() });
    setIsPulseAnim(true);
    setTimeout(() => setIsPulseAnim(false), 600);

    // Haptic feedback
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([15, 35]);
      }
    } catch {
      // ignore
    }
  };

  // Parse passage into structured paragraphs and word tokens
  const parsedParagraphs: TokenizedParagraph[] = useMemo(() => {
    const rawParagraphs = passageData.text.split('\n\n');

    return rawParagraphs.map((paraText, pIdx) => {
      const cleanPara = paraText.replace(/<target(?:\s+id="[^"]+")?>([^<]+)<\/target>/gi, '$1');
      const rawWords = cleanPara.trim().split(/\s+/);
      const tokens: TokenizedWord[] = [];

      rawWords.forEach((rawToken, wIdx) => {
        const match = rawToken.match(/^([^a-zA-Z0-9]*)([\w'-]+)([^a-zA-Z0-9]*)$/);
        let leading = '';
        let word = rawToken;
        let trailing = '';

        if (match) {
          leading = match[1] || '';
          word = match[2] || rawToken;
          trailing = match[3] || '';
        }

        const clean = cleanWordText(word);
        tokens.push({
          wIdx,
          leading,
          word,
          clean,
          trailing,
          sentence: cleanPara
        });
      });

      return {
        pIdx,
        tokens,
        rawText: cleanPara
      };
    });
  }, [passageData]);

  // Click on a single word in the passage
  const handleSingleWordClick = async (
    wordText: string,
    fullSentence: string,
    targetEl?: HTMLElement | null
  ) => {
    const cleaned = cleanWordText(wordText);
    if (!cleaned) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch {
      // ignore
    }

    let heroRect: { x: number; y: number; width: number; height: number } | null = null;
    if (targetEl) {
      const r = targetEl.getBoundingClientRect();
      heroRect = { x: r.left, y: r.top, width: r.width, height: r.height };
    }

    const wordData = await lookupLyricTerm(cleaned, fullSentence);
    openWordDetail(wordData, heroRect);
    speakWord(cleaned, 'en-GB');
  };

  // 1. TouchStart / MouseDown on a word in passage
  const handleWordTouchStart = (
    e: React.TouchEvent | React.MouseEvent,
    paraIdx: number,
    wordIdx: number,
    wordText: string,
    sentence: string
  ) => {
    const point = 'touches' in e ? e.touches[0] : e;

    touchStartPosRef.current = {
      x: point.clientX,
      y: point.clientY,
      paraIdx,
      wordIdx,
      wordText,
      sentence
    };

    // Long press 250ms threshold
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      triggerHaptic(20);

      setGestureState({
        isLongPressing: true,
        activeParaIdx: paraIdx,
        startWordIdx: wordIdx,
        currentWordIdx: wordIdx,
        touchStartX: point.clientX,
        touchStartY: point.clientY,
        touchCurrentX: point.clientX,
        touchCurrentY: point.clientY,
        selectedText: wordText,
        fullSentence: sentence,
        isMultiWord: false,
        isDwellLocked: false,
        anchorX: point.clientX,
        anchorY: point.clientY,
        isEscapingUp: false,
        isSavingDown: false,
        canReArm: false
      });

      // Schedule dwell lock (200ms stationary)
      scheduleDwellLock(point.clientX, point.clientY);
    }, 250);
  };

  // 2. TouchMove / MouseMove
  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    const point = 'touches' in e ? e.touches[0] : e;

    if (!gestureState.isLongPressing && touchStartPosRef.current) {
      const dx = Math.abs(point.clientX - touchStartPosRef.current.x);
      const dy = Math.abs(point.clientY - touchStartPosRef.current.y);
      if (dx > 8 || dy > 8) {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      }
      return;
    }

    if (!gestureState.isLongPressing || gestureState.activeParaIdx === null) return;
    if (e.cancelable) e.preventDefault();

    let targetWordIdx = gestureState.startWordIdx ?? 0;
    const wordElements = document.querySelectorAll(
      `[data-passage-para="${gestureState.activeParaIdx}"]`
    );
    wordElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (
        point.clientX >= rect.left - 8 &&
        point.clientX <= rect.right + 8 &&
        point.clientY >= rect.top - 14 &&
        point.clientY <= rect.bottom + 14
      ) {
        const idx = parseInt(el.getAttribute('data-passage-word') || '0', 10);
        targetWordIdx = idx;
      }
    });

    const pIdx = gestureState.activeParaIdx;
    const paraTokens = parsedParagraphs[pIdx]?.tokens || [];
    const startIdx = gestureState.startWordIdx ?? targetWordIdx;
    const minIdx = Math.min(startIdx, targetWordIdx);
    const maxIdx = Math.max(startIdx, targetWordIdx);
    const selectedWords = paraTokens.slice(minIdx, maxIdx + 1).map(w => w.word);
    const phraseText = selectedWords.join(' ');
    const isMulti = minIdx !== maxIdx;

    const dxFromStart = point.clientX - gestureState.touchStartX;
    const dyFromStart = point.clientY - gestureState.touchStartY;

    // === Track A: Single Word Fast Path ===
    if (!isMulti && !gestureState.isDwellLocked) {
      if (dyFromStart > 25 && Math.abs(dyFromStart) > Math.abs(dxFromStart) * 1.1) {
        clearDwellTimer();
        setGestureState((prev) => ({
          ...prev,
          currentWordIdx: targetWordIdx,
          touchCurrentX: point.clientX,
          touchCurrentY: point.clientY,
          selectedText: phraseText,
          isSavingDown: dyFromStart > 35,
          isEscapingUp: false,
          isMultiWord: false
        }));
        return;
      } else if (dyFromStart < -25 && Math.abs(dyFromStart) > Math.abs(dxFromStart) * 1.1) {
        clearDwellTimer();
        setGestureState((prev) => ({
          ...prev,
          currentWordIdx: targetWordIdx,
          touchCurrentX: point.clientX,
          touchCurrentY: point.clientY,
          selectedText: phraseText,
          isSavingDown: false,
          isEscapingUp: dyFromStart < -35,
          isMultiWord: false
        }));
        return;
      }
    }

    // === Track B - Phase 1: Free Range Selection & Edge Scrolling (Multi-Word Safe Path) ===
    if (!gestureState.isDwellLocked) {
      updateEdgeScroll(point.clientY);

      // In Free Selection phase, strictly BLOCK vertical triggers
      setGestureState((prev) => ({
        ...prev,
        currentWordIdx: targetWordIdx,
        touchCurrentX: point.clientX,
        touchCurrentY: point.clientY,
        selectedText: phraseText,
        isMultiWord: isMulti,
        isSavingDown: false,
        isEscapingUp: false
      }));

      // Reschedule dwell timer on every motion
      scheduleDwellLock(point.clientX, point.clientY);
      return;
    }

    // === Track B - Phase 2 & 3: Locked State & Action Dispatch ===
    if (gestureState.isDwellLocked) {
      const dxFromAnchor = point.clientX - gestureState.anchorX;
      const dyFromAnchor = point.clientY - gestureState.anchorY;

      // Re-arm Unlock check: Horizontal movement (>20px) unlocks back to Free Selection
      if (gestureState.canReArm && Math.abs(dxFromAnchor) > 20 && Math.abs(dxFromAnchor) > Math.abs(dyFromAnchor)) {
        triggerHaptic(12); // Re-arm tick
        setGestureState((prev) => ({
          ...prev,
          isDwellLocked: false,
          canReArm: false,
          isSavingDown: false,
          isEscapingUp: false,
          isMultiWord: isMulti,
          currentWordIdx: targetWordIdx,
          selectedText: phraseText
        }));
        scheduleDwellLock(point.clientX, point.clientY);
        return;
      }

      // Phase 3: Vertical Action Dispatch
      const isSavingDown = dyFromAnchor > 35;
      const isEscapingUp = dyFromAnchor < -35;

      setGestureState((prev) => ({
        ...prev,
        touchCurrentX: point.clientX,
        touchCurrentY: point.clientY,
        isSavingDown,
        isEscapingUp
      }));
    }
  };

  // 3. TouchEnd / MouseUp
  const handlePointerUp = async (e?: React.TouchEvent | React.MouseEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    clearDwellTimer();
    stopAutoScroll();

    if (!gestureState.isLongPressing) {
      touchStartPosRef.current = null;
      return;
    }

    const {
      isEscapingUp,
      isSavingDown,
      selectedText,
      activeParaIdx,
      startWordIdx,
      currentWordIdx,
      fullSentence,
      isMultiWord,
      isDwellLocked,
      touchStartY,
      touchCurrentY
    } = gestureState;

    const dyTotal = touchCurrentY - touchStartY;

    // 1. Single Word Fast Path immediate release check
    if (!isMultiWord && !isDwellLocked) {
      if (dyTotal > 35) {
        if (selectedText.trim()) {
          const wordData = await lookupLyricTerm(selectedText, fullSentence);
          await collectWord({ ...wordData, isStarred: true });
          triggerHaptic([20, 50]);
          showToast(`Saved to Vault: "${selectedText}"`);
        }
        resetGesture();
        return;
      } else if (dyTotal < -35) {
        triggerHaptic(15);
        resetGesture();
        return;
      }
    }

    // 2. Action Dispatch in Locked Mode
    if (isEscapingUp) {
      triggerHaptic(15);
      resetGesture();
      return;
    }

    if (isSavingDown) {
      if (selectedText.trim()) {
        const wordData = await lookupLyricTerm(selectedText, fullSentence);
        await collectWord({ ...wordData, isStarred: true });
        triggerHaptic([20, 50]);
        showToast(`Saved to Vault: "${selectedText}"`);
      }
      resetGesture();
      return;
    }

    // 3. Normal release -> Open Full Screen Word Detail with hero animation
    if (selectedText.trim() && activeParaIdx !== null) {
      const minIdx = Math.min(startWordIdx ?? 0, currentWordIdx ?? 0);
      const maxIdx = Math.max(startWordIdx ?? 0, currentWordIdx ?? 0);

      setHighlightAnchor({
        paraIdx: activeParaIdx,
        startWord: minIdx,
        endWord: maxIdx
      });

      const startEl = document.querySelector(
        `[data-passage-para="${activeParaIdx}"][data-passage-word="${minIdx}"]`
      );
      const endEl = document.querySelector(
        `[data-passage-para="${activeParaIdx}"][data-passage-word="${maxIdx}"]`
      );

      let heroRect: { x: number; y: number; width: number; height: number } | null = null;
      if (startEl && endEl) {
        const r1 = startEl.getBoundingClientRect();
        const r2 = endEl.getBoundingClientRect();
        heroRect = {
          x: Math.min(r1.left, r2.left),
          y: Math.min(r1.top, r2.top),
          width: Math.max(r1.right, r2.right) - Math.min(r1.left, r2.left),
          height: Math.max(r1.bottom, r2.bottom) - Math.min(r1.top, r2.top)
        };
      }

      const wordData = await lookupLyricTerm(selectedText, fullSentence);
      triggerHaptic(20);
      openWordDetail(wordData, heroRect);
      speakWord(selectedText, 'en-GB');
    }

    resetGesture();
  };

  const resetGesture = () => {
    stopAutoScroll();
    clearDwellTimer();
    setGestureState({
      isLongPressing: false,
      activeParaIdx: null,
      startWordIdx: null,
      currentWordIdx: null,
      touchStartX: 0,
      touchStartY: 0,
      touchCurrentX: 0,
      touchCurrentY: 0,
      selectedText: '',
      fullSentence: '',
      isMultiWord: false,
      isDwellLocked: false,
      anchorX: 0,
      anchorY: 0,
      isEscapingUp: false,
      isSavingDown: false,
      canReArm: false
    });
    touchStartPosRef.current = null;
  };

  // Helper to check if a word is saved in user's vocabulary book
  const isWordSaved = (clean: string) => {
    return clean && savedWordsSet.has(clean.toLowerCase());
  };

  // Helper to accurately compare user answers with correct answers (handles prefixes, casing, whitespace)
  const isQuestionAnswerCorrect = (userAns: string | undefined, correctAns: string | undefined): boolean => {
    if (!userAns || !correctAns) return false;
    const u = userAns.trim().toLowerCase();
    const c = correctAns.trim().toLowerCase();
    if (u === c) return true;
    if (c.startsWith(u + '.') || c.startsWith(u + ' ') || c.startsWith(u + ')')) return true;
    if (u.startsWith(c + '.') || u.startsWith(c + ' ') || u.startsWith(c + ')')) return true;
    return false;
  };

  // Submit test and calculate Band Score with Honesty Record
  const handleSubmitTest = async () => {
    setIsTimeoutModalOpen(false);
    let correct = 0;
    const conqueredList: string[] = [];

    questions.forEach((q) => {
      const isCorrect = isQuestionAnswerCorrect(userAnswers[q.id], q.correctAnswer);
      if (isCorrect) {
        correct++;
        if (q.targetVocab) {
          conqueredList.push(q.targetVocab.toLowerCase().trim());
        }
      }
    });

    const totalQ = Math.max(1, questions.length);
    const ratio = correct / totalQ;
    let band = 4.0;
    if (ratio >= 0.92) band = 9.0;
    else if (ratio >= 0.83) band = 8.5;
    else if (ratio >= 0.75) band = 8.0;
    else if (ratio >= 0.66) band = 7.5;
    else if (ratio >= 0.58) band = 7.0;
    else if (ratio >= 0.50) band = 6.5;
    else if (ratio >= 0.40) band = 6.0;
    else if (ratio >= 0.30) band = 5.5;
    else if (ratio > 0) band = 5.0;

    const totalTimeSpent = Math.max(1, (STANDARD_TIME_SEC + totalAddedSeconds) - timerSeconds);

    // Upgrade correctly tested target words to Level 3 (已掌握)
    if (conqueredList.length > 0) {
      await bulkUpdateMastery(conqueredList, 3);
    }

    const testRecord: IELTSTestRecord = {
      timestamp: Date.now(),
      bandScore: band,
      correctCount: correct,
      totalQuestions: questions.length,
      timeSpentSec: totalTimeSpent,
      standardTimeSec: STANDARD_TIME_SEC,
      extensionCount,
      totalAddedSeconds,
      isOvertime: extensionCount > 0 || totalTimeSpent > STANDARD_TIME_SEC,
      passageTitle: passageData.title,
      passageSubtitle: passageData.subtitle,
      passageText: passageData.text,
      questions,
      answers: userAnswers,
      conqueredWords: conqueredList
    };

    await db.ieltsTests.add(testRecord);
    setAssessmentResult(testRecord);
    setAssessmentModalOpen(true);
    setDrawerHeightPercent(28);
    setIsTimerRunning(false);
    setHasStarted(false);
  };

  // Generate real-time IELTS reading passage
  const handleSynthesizeWithGemini = async (overrideWords?: string[]) => {
    setIsGeneratingPassage(true);
    const hasCustom = overrideWords && overrideWords.length > 0;
    let wordStrings: string[] = [];

    try {
      if (hasCustom) {
        wordStrings = overrideWords;
      } else {
        const userWords = await db.words.limit(10).toArray();
        wordStrings = userWords.map(w => w.word);
      }

      let aiConfig: any = null;
      try {
        const saved = localStorage.getItem('lyricalens_ai_config');
        if (saved) aiConfig = JSON.parse(saved);
      } catch (e) {
        // ignore
      }

      const response = await fetch('/api/gemini/ielts-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          words: wordStrings.length > 0 ? wordStrings : ['ephemeral', 'resilience', 'catalyst', 'meticulous'],
          topic: 'Biophilic Architecture and Urban Ecosystem Resurgence',
          aiConfig
        })
      });

      const data = await response.json();
      if (data.passage) {
        setPassageData(data.passage);
        setCurrentQuizQuestionIndex(0);
        setTimerSeconds(STANDARD_TIME_SEC);
        setTotalAddedSeconds(0);
        setExtensionCount(0);
        setIsTimerRunning(false);
        setHasStarted(false);
        showToast(hasCustom ? `已载入包含 ${wordStrings.length} 个生词的定制真题` : '已载入剑桥学术阅读篇章');
      }
    } catch (err) {
      console.warn('Network AI generate unavailable, falling back to authentic Cambridge passage:', err);
      const matchResult = matchBestPassageByVocab(wordStrings);
      const fallback = matchResult ? matchResult.passage : CAMBRIDGE_IELTS_PASSAGES[0];
      if (fallback) {
        setPassageData(fallback);
        setCurrentQuizQuestionIndex(0);
        setTimerSeconds(STANDARD_TIME_SEC);
        setTotalAddedSeconds(0);
        setExtensionCount(0);
        setIsTimerRunning(false);
        setHasStarted(false);
      }
      showToast('已载入剑桥学术阅读真题');
    } finally {
      setIsGeneratingPassage(false);
    }
  };

  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  const isReadingMode = viewMode === 'reading';
  const isListeningMode = viewMode === 'listening' && Boolean(activeListeningSection);

  return (
    <div
      ref={containerRef}
      onTouchMove={isReadingMode ? handlePointerMove : undefined}
      onMouseMove={isReadingMode ? handlePointerMove : undefined}
      onTouchEnd={isReadingMode ? handlePointerUp : undefined}
      onMouseUp={isReadingMode ? handlePointerUp : undefined}
      onTouchCancel={isReadingMode ? handlePointerUp : undefined}
      className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-gradient-to-r from-[#FAF7F2]/45 via-[#FAF7F2]/82 to-[#FAF7F2]/95 dark:from-[#0B0F17]/50 dark:via-[#0B0F17]/85 dark:to-[#0C1017]/96 select-none"
    >
      {/* Dedicated Clean Academic Paper Background Overlay */}
      <div
        className="absolute inset-0 opacity-[0.018] dark:opacity-[0.015] pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(rgba(0,0,0,0.35) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Persistent Top Header with Smooth Animated Left Icon & Center Node */}
      <TopHeader
        centerLabel={isListeningMode ? 'IELTS LISTENING' : 'IELTS ACADEMIC'}
        centerKey={
          isReadingMode
            ? 'ielts-timer-header'
            : isListeningMode
            ? 'ielts-listening-header'
            : undefined
        }
        leftKey={
          isReadingMode
            ? 'reading-back-arrow'
            : isListeningMode
            ? 'listening-back-arrow'
            : isHubSubView
            ? 'hub-subview-back-arrow'
            : 'hub-default-chevron'
        }
        leftIcon={
          isReadingMode || isListeningMode || isHubSubView ? (
            <ArrowLeft className="w-4.5 h-4.5 group-hover:-translate-x-0.5 transition-transform" />
          ) : undefined
        }
        leftTitle={
          isReadingMode || isListeningMode
            ? '返回题库书架 (Back to Study Shelf)'
            : isHubSubView
            ? '返回雅思主界面 (Back to IELTS Hub)'
            : undefined
        }
        onLeftClick={
          isReadingMode || isListeningMode
            ? () => {
                setIsAdjustMenuOpen(false);
                setActiveAdjustPanel(null);
                setViewMode('hub');
              }
            : isHubSubView
            ? () => {
                triggerIeltsHubReset();
                setIsHubSubView(false);
              }
            : undefined
        }
        centerContent={
          isReadingMode ? (
            <div className="relative flex items-center justify-center">
              {/* Crystal Glass Tabular-Nums Timer Button */}
              <button
                id="ielts-timer-capsule-btn"
                type="button"
                onClick={() => {
                  setActiveAdjustPanel(null);
                  setIsAdjustMenuOpen(prev => !prev);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono tabular-nums tracking-wider font-semibold active:scale-95 transition-all cursor-pointer group focus:outline-none ${
                  isAdjustMenuOpen
                    ? 'bg-white dark:bg-[#182132] border-[#516050]/50 dark:border-[#8FB996]/50 text-[#516050] dark:text-[#8FB996] ring-2 ring-[#516050]/12 dark:ring-[#8FB996]/15 shadow-xs'
                    : timerSeconds <= 60 && isTimerRunning
                    ? 'bg-rose-500/12 border-rose-500/35 text-rose-700 dark:text-rose-300'
                    : isTimerRunning
                    ? 'bg-[#516050]/10 dark:bg-[#8FB996]/15 border-[#516050]/25 dark:border-[#8FB996]/30 text-[#516050] dark:text-[#8FB996]'
                    : 'bg-white/85 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/[0.1] border-stone-200/80 dark:border-white/[0.08] text-stone-800 dark:text-stone-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
                }`}
                title={isTimerRunning ? 'Timer running · Click to pause/adjust' : 'Timer stopped · Click to start/adjust'}
              >
                <Clock className={`w-3.5 h-3.5 transition-colors ${
                  timerSeconds <= 60 && isTimerRunning
                    ? 'text-rose-500 animate-pulse'
                    : 'text-[#516050] dark:text-[#8FB996]'
                }`} />
                
                {/* Tabular Digits with In-situ Pulse Animation */}
                <span className={`inline-block tabular-nums transition-all duration-200 ${isPulseAnim ? 'scale-110 text-[#516050] dark:text-[#8FB996] font-bold' : ''}`}>
                  {formatTimer(timerSeconds)}
                </span>

                <span className="text-stone-400 dark:text-stone-500 font-sans-ui text-[10px] tracking-normal">
                  {isTimerRunning ? '· 计时中' : `· P${activeCambridgeInfo.passageNum || 1}`}
                </span>

                <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${isAdjustMenuOpen ? 'rotate-180 text-[#516050] dark:text-[#8FB996]' : 'group-hover:translate-y-0.5'}`} />
              </button>

              {/* In-situ Particle Floating Animation (+05:00) */}
              <AnimatePresence>
                {particleFeedback && (
                  <motion.div
                    key={particleFeedback.key}
                    initial={{ opacity: 1, y: 0, scale: 0.9 }}
                    animate={{ opacity: 0, y: -22, scale: 1.08 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute -top-3.5 -right-3 pointer-events-none px-2 py-0.5 rounded-full bg-[#516050] dark:bg-[#6B8F71] text-white font-mono tabular-nums font-bold text-[10px] shadow-lg z-50 whitespace-nowrap"
                  >
                    {particleFeedback.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : undefined
        }
        onOpenNotebook={onOpenNotebook}
      />

      {/* Animated Viewport Transition Between IELTS Hub, Listening Studio, and Academic Reading View */}
      <AnimatePresence mode="wait" initial={false}>
        {viewMode === 'hub' ? (
          <motion.div
            key="ielts-stage-hub"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex-1 min-h-0 w-full flex flex-col overflow-hidden"
          >
            <IELTSHubView
              onStartReading={handleStartFromHub}
              onStartListening={handleStartListening}
              onOpenNotebook={onOpenNotebook}
              onSubViewChange={setIsHubSubView}
              resetSignal={hubResetSignal}
            />
          </motion.div>
        ) : isListeningMode && activeListeningSection ? (
          <motion.div
            key={`listening-stage-${activeListeningSection.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex-1 min-h-0 w-full flex flex-col overflow-hidden"
          >
            <IELTSListeningView
              section={activeListeningSection}
              onBack={() => setViewMode('hub')}
              onOpenNotebook={onOpenNotebook}
            />
          </motion.div>
        ) : (
          <motion.div
            key="ielts-stage-reading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex-1 min-h-0 w-full flex flex-col justify-between overflow-hidden"
          >
            {/* Frosted Glass Micro-Adjustment Popover (考中主动调节浮层) */}
            <AnimatePresence>
              {isAdjustMenuOpen && (
                <>
                  {/* Backdrop Mask (Scoped below TopHeader so timer capsule stays crisp) */}
                  <div
                    className="absolute inset-0 z-40 bg-stone-900/15 dark:bg-black/35 backdrop-blur-[1.5px]"
                    onClick={() => setIsAdjustMenuOpen(false)}
                  />

                  {/* Dropdown Card Anchored Directly Beneath Header Capsule */}
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-2 left-1/2 -translate-x-1/2 z-50 w-[310px] sm:w-[340px] p-4 rounded-3xl bg-[#FDFBF7]/95 dark:bg-[#121826]/95 backdrop-blur-2xl border border-stone-200/80 dark:border-white/[0.08] shadow-2xl space-y-3.5"
                  >
                    {/* Header Title */}
                    <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-white/[0.06] pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#516050] dark:text-[#8FB996]" />
                        <span className="text-xs font-semibold text-stone-800 dark:text-stone-100 tracking-wide font-sans-ui">
                          模考计时与加时
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAdjustMenuOpen(false)}
                        className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Start / Pause & Reset Action Bar */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="ielts-timer-toggle-btn"
                        onClick={handleToggleTimer}
                        className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xs cursor-pointer ${
                          isTimerRunning
                            ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-[#516050] hover:bg-[#3F4C3E] dark:bg-[#6B8F71] dark:hover:bg-[#4A6B50] text-white'
                        }`}
                      >
                        {isTimerRunning ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>暂停计时</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{hasStarted ? '继续计时' : '开始模考计时'}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        id="ielts-timer-reset-btn"
                        onClick={handleResetTimer}
                        className="py-2.5 px-3 rounded-2xl text-xs font-semibold bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        title="重置为 20:00"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>重置</span>
                      </button>
                    </div>

                    {/* Tier 1: Quick Preset Capsules */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase font-semibold tracking-wider text-stone-400 dark:text-stone-500 font-mono flex items-center justify-between">
                        <span>QUICK EXTENSION</span>
                        <span>TAP TO ADD</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 5, 10, 15].map((mins) => {
                          const isLastUsed = mins === lastExtensionMinutes;
                          return (
                            <button
                              key={mins}
                              type="button"
                              id={`quick-extend-${mins}min-btn`}
                              onClick={() => handleAddTime(mins)}
                              className={`relative py-2.5 rounded-2xl text-xs font-mono tabular-nums font-semibold transition-all active:scale-95 border cursor-pointer flex flex-col items-center justify-center ${
                                isLastUsed
                                  ? 'bg-[#516050] text-white border-[#516050] shadow-xs'
                                  : 'bg-white dark:bg-[#1A2234] border-stone-200/80 dark:border-white/[0.08] text-stone-700 dark:text-stone-200 hover:border-stone-400'
                              }`}
                            >
                              <span>+{mins}′</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tier 2: Collapsible Custom Stepper */}
                    <div className="pt-1 border-t border-stone-200/50 dark:border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => setIsCustomStepOpen(prev => !prev)}
                        className="w-full flex items-center justify-between text-xs font-sans-ui text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white py-1 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          <Sliders className="w-3.5 h-3.5" />
                          <span>自定义加时</span>
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCustomStepOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isCustomStepOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden pt-2 space-y-2.5"
                          >
                            {/* Stepper row: [ - ] +X min [ + ] */}
                            <div className="flex items-center justify-between bg-stone-100 dark:bg-slate-800/70 p-2 rounded-2xl border border-stone-200/80 dark:border-white/[0.08]">
                              <button
                                type="button"
                                onClick={() => setCustomMinutes(prev => Math.max(1, prev - 1))}
                                className="w-8 h-8 rounded-xl bg-white dark:bg-[#1A2234] border border-stone-200 dark:border-slate-700 flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-stone-50 active:scale-95 cursor-pointer"
                                aria-label="Decrease minutes"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <div className="text-center font-mono tabular-nums">
                                <span className="text-base font-bold text-stone-900 dark:text-stone-100">
                                  +{customMinutes}
                                </span>
                                <span className="text-xs text-stone-600 dark:text-stone-300 ml-1">mins ({customMinutes}:00)</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setCustomMinutes(prev => Math.min(60, prev + 1))}
                                className="w-8 h-8 rounded-xl bg-white dark:bg-[#1A2234] border border-stone-200 dark:border-slate-700 flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-stone-50 active:scale-95 cursor-pointer"
                                aria-label="Increase minutes"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Confirm Button */}
                            <button
                              type="button"
                              onClick={() => handleAddTime(customMinutes)}
                              className="w-full py-2.5 rounded-2xl bg-[#516050] hover:bg-[#3F4C3E] dark:bg-[#6B8F71] text-white text-xs font-semibold tracking-wider transition-all active:scale-98 shadow-xs cursor-pointer uppercase font-mono tabular-nums"
                            >
                              Confirm +{customMinutes} Mins
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Timeout Expiry Modal (超时被动双轨弹窗) */}
            <AnimatePresence>
              {isTimeoutModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 12 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-sm rounded-[32px] bg-[#FDFBF7] dark:bg-[#121826] border border-stone-200/90 dark:border-slate-800 shadow-2xl p-6 flex flex-col items-center text-center space-y-4 pointer-events-auto"
                  >
                    {/* Timeout Icon Badge */}
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <Clock className="w-8 h-8 animate-pulse" />
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1.5">
                      <h3 className="font-serif-luxury text-xl font-bold text-stone-900 dark:text-stone-100">
                        Standard Time Expired
                      </h3>
                      <p className="text-xs font-mono tabular-nums uppercase tracking-widest text-stone-500 dark:text-stone-400">
                        STANDARD 20:00 EXPIRED
                      </p>
                      <p className="text-xs font-sans-ui text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
                        The official standard 20:00 mock exam duration has completed ({answeredCount}/{questions.length} answered). You can submit to view your assessment now or add extra time to continue.
                      </p>
                    </div>

                    {/* Dual-Track Single-Tap Actions */}
                    <div className="w-full space-y-2.5 pt-2">
                      {/* Primary Button */}
                      <button
                        id="timeout-submit-test-btn"
                        type="button"
                        onClick={handleSubmitTest}
                        className="w-full py-3.5 px-5 rounded-full bg-[#516050] hover:bg-[#3F4C3E] dark:bg-[#6B8F71] dark:hover:bg-[#4A6B50] text-white font-sans-ui text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer"
                      >
                        <span>Submit & View Band Score</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      {/* Secondary Button */}
                      <button
                        id="timeout-resume-extend-btn"
                        type="button"
                        onClick={() => handleAddTime(lastExtensionMinutes)}
                        className="w-full py-3 px-5 rounded-full bg-stone-200/80 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-stone-200 font-sans-ui text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer font-mono tabular-nums"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Extend & Continue (+{lastExtensionMinutes} min)</span>
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Top Soft Feather Gradient Wash under header — only visible after scrolling */}
            <div
              className={`pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#FAF7F2] via-[#FAF7F2]/80 to-transparent dark:from-[#0C1017] dark:via-[#0C1017]/80 dark:to-transparent z-20 transition-opacity duration-200 ${
                isPassageScrolled ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Top Selection Banner during touch long-press */}
            <AnimatePresence>
              {gestureState.isLongPressing && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-3 left-0 right-0 z-50 px-4 pointer-events-none"
                >
                  <div
                    className={`w-full max-w-lg mx-auto px-4 py-2.5 rounded-2xl backdrop-blur-xl border flex items-center justify-between gap-3 shadow-xl transition-all duration-200 ${
                      gestureState.isEscapingUp
                        ? 'bg-rose-950/95 border-rose-500/60 text-rose-100 shadow-rose-950/50 scale-[0.98]'
                        : gestureState.isSavingDown
                        ? 'bg-[#0f2918]/95 border-emerald-500/60 text-emerald-100 shadow-emerald-950/50 scale-[1.02]'
                        : 'bg-[#141414]/90 dark:bg-[#11161d]/90 border-white/15 text-white'
                    }`}
                  >
                    <div className="flex items-center min-w-0 flex-1 overflow-hidden">
                      <span
                        className={`font-serif-luxury italic text-sm sm:text-base font-medium truncate tracking-wide ${
                          gestureState.isEscapingUp
                            ? 'text-rose-200 line-through opacity-80'
                            : gestureState.isSavingDown
                            ? 'text-emerald-300 font-semibold'
                            : 'text-stone-100'
                        }`}
                      >
                        {gestureState.isSavingDown ? `★ "${gestureState.selectedText}"` : `"${gestureState.selectedText}"`}
                      </span>
                    </div>

                    <div className="flex-shrink-0 flex items-center pl-2">
                      {gestureState.isEscapingUp ? (
                        <span className="text-xs font-semibold text-rose-300 tracking-wide font-sans-ui animate-bounce flex items-center gap-1">
                          ✕ Release to Cancel
                        </span>
                      ) : gestureState.isSavingDown ? (
                        <span className="text-xs font-semibold text-emerald-300 tracking-wide font-sans-ui animate-bounce flex items-center gap-1">
                          ★ Release to Save to Vault
                        </span>
                      ) : gestureState.isDwellLocked ? (
                        <span className="text-xs text-emerald-300 dark:text-emerald-400 font-sans-ui tracking-wide flex items-center gap-1.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Locked · Slide Down to Save / Up to Cancel</span>
                        </span>
                      ) : gestureState.isMultiWord ? (
                        <span className="text-xs text-amber-300/90 font-sans-ui tracking-wide flex items-center gap-1">
                          <span>Selecting phrases · Dwell to Lock</span>
                        </span>
                      ) : (
                        <span className="text-xs text-stone-300 font-sans-ui tracking-wide">
                          · Slide Down to Save · Release to Inspect
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Academic Reading Passage View */}
            <div
              ref={passageContainerRef}
              onScroll={(e) => {
                const scrolled = e.currentTarget.scrollTop > 10;
                if (scrolled !== isPassageScrolled) {
                  setIsPassageScrolled(scrolled);
                }
              }}
              className="relative flex-1 overflow-y-auto no-scrollbar px-6 sm:px-8 pt-3 pb-64 z-10 touch-pan-y"
            >
              <div className="max-w-lg mx-auto">
                {/* Unboxed Editorial Running Header Bar with Coordinated Entrance */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-between gap-2.5 mb-4 pt-1"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Unboxed Editorial Meta Trail */}
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={`meta-${activeCambridgeInfo.cambridgeBook}-${activeCambridgeInfo.testNum}-${activeCambridgeInfo.passageNum}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums uppercase tracking-wider text-stone-400 dark:text-stone-500 truncate"
                      >
                        <span className="text-stone-700 dark:text-stone-300 font-semibold">
                          {activeCambridgeInfo.cambridgeBook}
                        </span>
                        <span>·</span>
                        <span>T{activeCambridgeInfo.testNum} P{activeCambridgeInfo.passageNum}</span>
                        {activeCambridgeInfo.category && (
                          <>
                            <span>·</span>
                            <span className="font-sans-ui normal-case text-stone-500 dark:text-stone-400 truncate">
                              {activeCambridgeInfo.category}
                            </span>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Right Action Cluster: Typography (Aa) & Passage Switcher (换篇) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      id="ielts-typography-btn"
                      type="button"
                      onClick={() => {
                        setIsAdjustMenuOpen(false);
                        setActiveAdjustPanel(activeAdjustPanel ? null : 'font');
                      }}
                      className={`flex items-center justify-center px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all cursor-pointer active:scale-95 focus:outline-none ${
                        activeAdjustPanel
                          ? 'bg-[#516050] text-white border-[#516050] shadow-xs'
                          : 'bg-white/85 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border-stone-200/80 dark:border-white/[0.08] text-stone-700 dark:text-stone-300'
                      }`}
                      title="调节正文字号与行距 (Typography Settings)"
                      aria-label="Adjust font size and line spacing"
                    >
                      <span className="font-serif-luxury font-semibold text-xs leading-none tracking-tight">Aa</span>
                    </button>

                    <button
                      id="cambridge-passages-btn"
                      type="button"
                      onClick={() => {
                        setActiveAdjustPanel(null);
                        openCambridgeSelector();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/85 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-stone-200/80 dark:border-white/[0.08] text-[#516050] dark:text-[#8FB996] text-[11px] font-medium transition-all cursor-pointer active:scale-95 shrink-0 focus:outline-none"
                      title="切换剑桥雅思官方真题库"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>换篇</span>
                    </button>
                  </div>
                </motion.div>

                {/* Animated Passage Body (smoothly transitions both on initial enter and when switching passages via 换篇) */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`passage-article-${passageData.title}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.24, delay: 0.02, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* Academic Article Title */}
                    <h1
                      id="passage-academic-title"
                      className="font-serif-luxury text-2xl sm:text-[27px] font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-[1.24] mb-4"
                    >
                      {passageData.title}
                    </h1>

                    {/* Subtle Editorial Hairline Rule */}
                    <div className="w-full h-px bg-stone-200/70 dark:bg-white/[0.07] mb-5" />

                    {/* Interactive Paragraphs with Multi-word Gesture & Click Support */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                      className="space-y-5"
                    >
                      {parsedParagraphs.map((para) => {
                        const isParaFocused = gestureState.isLongPressing && gestureState.activeParaIdx === para.pIdx;
                        const minWordIdx = isParaFocused && gestureState.startWordIdx !== null && gestureState.currentWordIdx !== null
                          ? Math.min(gestureState.startWordIdx, gestureState.currentWordIdx)
                          : -1;
                        const maxWordIdx = isParaFocused && gestureState.startWordIdx !== null && gestureState.currentWordIdx !== null
                          ? Math.max(gestureState.startWordIdx, gestureState.currentWordIdx)
                          : -1;

                        const hasAnchor = highlightAnchor && highlightAnchor.paraIdx === para.pIdx;

                        return (
                          <p
                            key={para.pIdx}
                            style={{
                              fontSize: `${fontSize}px`,
                              lineHeight: lineSpacing
                            }}
                            className="font-serif-luxury text-stone-850 dark:text-stone-150 tracking-normal select-none transition-[font-size,line-height] duration-150 subpixel-antialiased"
                          >
                            {para.tokens.map((token, wIdx) => {
                              const isInGesture = isParaFocused && wIdx >= minWordIdx && wIdx <= maxWordIdx;
                              const isAnchor = hasAnchor && wIdx >= highlightAnchor.startWord && wIdx <= highlightAnchor.endWord;
                              const isSaved = isWordSaved(token.clean);

                              const isFirstSelected = isInGesture && wIdx === minWordIdx;
                              const isLastSelected = isInGesture && wIdx === maxWordIdx;
                              const isSingleSelected = isInGesture && minWordIdx === maxWordIdx;

                              const savedUnderlineClasses = isSaved
                                ? 'underline decoration-[#516050]/60 dark:decoration-[#8FB996]/70 underline-offset-[3px] decoration-[1.5px] font-medium text-stone-900 dark:text-stone-100'
                                : '';

                              // Determine connected rounded edges for a seamless highlight ribbon
                              let selectionClasses = '';
                              if (isInGesture) {
                                const isEscaping = gestureState.isEscapingUp;
                                const isSaving = gestureState.isSavingDown;
                                const isLocked = gestureState.isDwellLocked;

                                // Continuous pill/ribbon geometry: only outer boundary words get outer pill curves
                                const rounded = isSingleSelected
                                  ? 'rounded-md'
                                  : isFirstSelected
                                  ? 'rounded-l-md rounded-r-none'
                                  : isLastSelected
                                  ? 'rounded-r-md rounded-l-none'
                                  : 'rounded-none';

                                if (isEscaping) {
                                  selectionClasses = `${rounded} bg-rose-500/20 dark:bg-rose-500/30 text-rose-800 dark:text-rose-200 line-through opacity-80 shadow-xs`;
                                } else if (isSaving) {
                                  selectionClasses = `${rounded} bg-emerald-500/25 dark:bg-emerald-500/35 text-emerald-950 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500/50`;
                                } else if (isLocked) {
                                  selectionClasses = `${rounded} bg-[#516050]/25 dark:bg-[#7EA783]/30 text-stone-950 dark:text-white shadow-sm ring-1 ring-[#516050]/50 dark:ring-[#8FB996]/60`;
                                } else {
                                  // Free selection phase: subtle natural warm sage wash with seamless continuity
                                  selectionClasses = `${rounded} bg-[#516050]/20 dark:bg-[#7EA783]/25 text-stone-950 dark:text-white`;
                                }
                              } else if (isAnchor) {
                                selectionClasses = 'rounded-md bg-[#516050]/15 dark:bg-[#7EA783]/20 text-stone-950 dark:text-white';
                              } else {
                                selectionClasses = `hover:bg-stone-300/30 dark:hover:bg-slate-700/40 hover:text-stone-950 dark:hover:text-white ${savedUnderlineClasses}`;
                              }

                              return (
                                <React.Fragment key={`tok-${para.pIdx}-${wIdx}`}>
                                  {token.leading && <span>{token.leading}</span>}
                                  <span
                                    data-passage-para={para.pIdx}
                                    data-passage-word={wIdx}
                                    onTouchStart={(e) => handleWordTouchStart(e, para.pIdx, wIdx, token.word, token.sentence)}
                                    onMouseDown={(e) => handleWordTouchStart(e, para.pIdx, wIdx, token.word, token.sentence)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!gestureState.isLongPressing) {
                                        handleSingleWordClick(token.word, token.sentence, e.currentTarget);
                                      }
                                    }}
                                    className={`relative inline-block transition-colors duration-100 cursor-pointer select-none px-[2px] py-[1px] -mx-[1px] rounded-[5px] ${selectionClasses}`}
                                  >
                                    {token.word}
                                  </span>
                                  {token.trailing && <span>{token.trailing}</span>}
                                  {wIdx < para.tokens.length - 1 && ' '}
                                </React.Fragment>
                              );
                            })}
                          </p>
                        );
                      })}
                    </motion.div>

                    {/* Passage footer indicator */}
                    <div className="pt-10 pb-6 text-center">
                      <span className="text-[11px] font-mono tracking-widest text-stone-400 dark:text-stone-500 uppercase">
                        —— END OF PASSAGE ——
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Soft Upward Feather Gradient Scrim above Quiz Drawer — prevents harsh half-cut text lines */}
            <div
              style={{
                bottom: `${drawerHeightPercent}%`,
                transition: isDragging ? 'none' : 'bottom 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className="pointer-events-none absolute left-0 right-0 h-9 bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2]/85 to-transparent dark:from-[#0C1017] dark:via-[#0C1017]/85 dark:to-transparent z-20"
            />

            {/* Floating Bottom Quiz Sheet with Resizable Height & Elevated Warm Ivory Surface */}
            <motion.div
              id="ielts-quiz-drawer"
              initial={{ opacity: 0, y: 36, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 28, scale: 0.99 }}
              transition={{ duration: 0.28, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: `${drawerHeightPercent}%`,
                transition: isDragging ? 'none' : 'height 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className="absolute bottom-0 left-0 right-0 z-30 bg-[#FDFCF9]/98 dark:bg-[#111722]/98 backdrop-blur-2xl border-t border-stone-300/75 dark:border-white/[0.1] rounded-t-[26px] shadow-[0_-10px_32px_rgba(28,25,23,0.07)] dark:shadow-[0_-12px_36px_rgba(0,0,0,0.45)] flex flex-col overflow-hidden"
            >
              {/* Drawer Drag Handle Bar */}
              <div
                onPointerDown={handleDragStart}
                className="w-full pt-2 pb-1 flex flex-col items-center justify-center cursor-ns-resize select-none touch-none shrink-0"
              >
                <div className="w-9 h-1 bg-stone-300/90 dark:bg-white/20 rounded-full hover:bg-stone-400 transition-colors" />
              </div>

              {/* Drawer Content Body with Smooth State Transitions */}
              <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-3.5 pt-0.5 flex flex-col justify-between">
                <AnimatePresence mode="wait" initial={false}>
                  {!isExpanded ? (
                    /* Collapsed / Peek Mode (< 36% height) */
                    <motion.div
                      key="peek-mode"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-col justify-between h-full gap-1.5"
                    >
                      {/* Top Metadata Header with Interactive Navigation Controls */}
                      <div className="flex items-center justify-between text-[11px] font-mono tabular-nums pb-1.5 border-b border-stone-200/60 dark:border-white/[0.06] shrink-0">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCurrentQuizQuestionIndex(Math.max(0, currentQuizQuestionIndex - 1))}
                            disabled={currentQuizQuestionIndex === 0}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-300 disabled:opacity-25 disabled:pointer-events-none hover:bg-stone-200/70 dark:hover:bg-white/10 transition-all cursor-pointer focus:outline-none"
                            title="上一题"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-semibold tracking-wider text-stone-900 dark:text-stone-100 text-xs">
                            Q{currentQuizQuestionIndex + 1}
                            <span className="text-[10.5px] text-stone-400 font-normal"> / {questions.length || 1}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setCurrentQuizQuestionIndex(Math.min((questions.length || 1) - 1, currentQuizQuestionIndex + 1))}
                            disabled={currentQuizQuestionIndex >= (questions.length || 1) - 1}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-300 disabled:opacity-25 disabled:pointer-events-none hover:bg-stone-200/70 dark:hover:bg-white/10 transition-all cursor-pointer focus:outline-none"
                            title="下一题"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Question Quick Dots Indicator */}
                        <div className="flex items-center gap-1 max-w-[140px] overflow-x-auto no-scrollbar py-0.5">
                          {questions.map((q, idx) => (
                            <button
                              key={`peek-dot-${q.id || idx}`}
                              type="button"
                              onClick={() => setCurrentQuizQuestionIndex(idx)}
                              className={`rounded-full transition-all cursor-pointer focus:outline-none ${
                                idx === currentQuizQuestionIndex
                                  ? 'w-4 h-1.5 bg-[#516050] dark:bg-[#8FB996]'
                                  : userAnswers[q.id]
                                  ? 'w-1.5 h-1.5 bg-[#516050]/55 dark:bg-[#8FB996]/55'
                                  : 'w-1.5 h-1.5 bg-stone-300 dark:bg-stone-700'
                              }`}
                              title={`第 ${idx + 1} 题`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] text-stone-400 font-mono tabular-nums">
                            {progressPercent}%
                          </span>
                          {progressPercent === 100 && (
                            <button
                              type="button"
                              onClick={handleSubmitTest}
                              className="px-2.5 py-0.5 rounded-full bg-[#516050] text-white text-[10px] font-semibold tracking-wide hover:bg-[#3F4C3E] active:scale-95 transition-all cursor-pointer focus:outline-none"
                            >
                              交卷
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Unboxed Editorial Question Prompt — Full Text Visibility without 2-line Clamping */}
                      <div className="flex-1 min-h-0 flex items-center overflow-y-auto no-scrollbar py-0.5 px-0.5">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={`peek-q-prompt-${currentQuizQuestionIndex}-${passageData.title}`}
                            initial={{ opacity: 0, y: 5, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.99 }}
                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full"
                          >
                            <p className="font-sans-ui text-xs sm:text-[13px] font-medium text-stone-850 dark:text-stone-100 leading-[1.5]">
                              <span className="font-mono tabular-nums text-[#516050] dark:text-[#8FB996] font-bold mr-1.5">
                                {currentQuizQuestionIndex + 1}.
                              </span>
                              {questions[currentQuizQuestionIndex]?.prompt || questions[0]?.prompt || 'Select whether the statement agrees with the information in the passage.'}
                            </p>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Quick Options - Clean Tactile Segmented Buttons */}
                      {(() => {
                        const activeQ = questions[currentQuizQuestionIndex] || questions[0];
                        const optionsToShow = activeQ?.options?.length ? activeQ.options : ['TRUE', 'FALSE', 'NOT GIVEN'];
                        const isMultiCol = optionsToShow.length <= 3 && !optionsToShow.some(o => o.length > 15);
                        return (
                          <div className={`grid ${isMultiCol ? 'grid-cols-3' : optionsToShow.length === 4 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 pt-0.5 shrink-0`}>
                            {optionsToShow.map((opt, oIdx) => {
                              const isSelected = !!activeQ?.id && (
                                userAnswers[activeQ.id] === opt ||
                                userAnswers[activeQ.id]?.trim().toLowerCase() === opt.trim().toLowerCase()
                              );
                              const displayLabel = opt === 'NOT GIVEN' ? 'NOT GIVEN' : opt;
                              return (
                                <button
                                  key={`peek-opt-${opt}-${oIdx}`}
                                  type="button"
                                  onClick={() => {
                                    if (activeQ?.id) {
                                      setUserAnswer(activeQ.id, opt);
                                      if (!isTimerRunning && !hasStarted) {
                                        setIsTimerRunning(true);
                                        setHasStarted(true);
                                      }
                                      if (currentQuizQuestionIndex < questions.length - 1) {
                                        setTimeout(() => {
                                          setCurrentQuizQuestionIndex(currentQuizQuestionIndex + 1);
                                        }, 240);
                                      }
                                    }
                                  }}
                                  className={`py-2 px-2.5 rounded-xl text-[11px] font-mono uppercase tracking-wider font-semibold transition-all active:scale-96 border cursor-pointer text-center truncate focus:outline-none ${
                                    isSelected
                                      ? 'bg-[#516050] text-white border-[#516050] shadow-xs'
                                      : 'bg-white dark:bg-white/[0.04] text-stone-700 dark:text-stone-300 border-stone-200/85 dark:border-white/[0.08] hover:border-stone-300'
                                  }`}
                                  title={opt}
                                >
                                  {displayLabel}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </motion.div>
                  ) : (
                    /* Resized / Expanded Mode (>= 36% height) */
                    <motion.div
                      key="expanded-mode"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-col justify-between h-full space-y-3"
                    >
                      {/* Question Header & Content */}
                      <div className="overflow-y-auto no-scrollbar space-y-3.5">
                        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums font-semibold tracking-wider text-stone-500 dark:text-stone-400">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setCurrentQuizQuestionIndex(Math.max(0, currentQuizQuestionIndex - 1))}
                              disabled={currentQuizQuestionIndex === 0}
                              className="w-5 h-5 rounded-full flex items-center justify-center text-stone-700 dark:text-stone-300 disabled:opacity-25 disabled:pointer-events-none hover:bg-stone-200/70 dark:hover:bg-white/10 transition-all cursor-pointer focus:outline-none"
                              title="上一题"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-stone-900 dark:text-stone-100">
                              QUESTION {currentQuizQuestionIndex + 1} <span className="text-stone-400 font-normal">/ {questions.length || 1}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setCurrentQuizQuestionIndex(Math.min((questions.length || 1) - 1, currentQuizQuestionIndex + 1))}
                              disabled={currentQuizQuestionIndex >= (questions.length || 1) - 1}
                              className="w-5 h-5 rounded-full flex items-center justify-center text-stone-700 dark:text-stone-300 disabled:opacity-25 disabled:pointer-events-none hover:bg-stone-200/70 dark:hover:bg-white/10 transition-all cursor-pointer focus:outline-none"
                              title="下一题"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span>{progressPercent}% COMPLETED</span>
                        </div>

                        {/* Minimal Hairline Progress Bar */}
                        <div className="w-full h-[2px] bg-stone-200/80 dark:bg-white/[0.08] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#516050] dark:bg-[#8FB996] transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        {/* Animated Question Prompt & Options in Expanded Mode */}
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={`expanded-q-${currentQuizQuestionIndex}-${passageData.title}`}
                            initial={{ opacity: 0, y: 8, scale: 0.985 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.985 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-3"
                          >
                            {/* Unboxed Editorial Question Prompt */}
                            {currentQuestion && (
                              <div className="py-1 px-0.5">
                                <p className="font-sans-ui text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 leading-relaxed">
                                  <span className="font-mono tabular-nums text-[#516050] dark:text-[#8FB996] font-bold mr-1.5">
                                    {currentQuizQuestionIndex + 1}.
                                  </span>
                                  {currentQuestion.prompt}
                                </p>
                              </div>
                            )}

                            {/* Grouped Editorial Option List */}
                            {currentQuestion && (
                              <div className="rounded-2xl bg-white/90 dark:bg-[#141A26] border border-stone-200/75 dark:border-white/[0.08] divide-y divide-stone-200/60 dark:divide-white/[0.06] overflow-hidden">
                                {(currentQuestion.options || ['TRUE', 'FALSE', 'NOT GIVEN']).map((option, optIdx) => {
                                  const isSelected = !!currentQuestion?.id && (
                                    userAnswers[currentQuestion.id] === option ||
                                    userAnswers[currentQuestion.id]?.trim().toLowerCase() === option.trim().toLowerCase()
                                  );
                                  return (
                                    <button
                                      key={`expanded-opt-${option}-${optIdx}`}
                                      type="button"
                                      id={`quiz-option-${option.toLowerCase().replace(/\s+/g, '-')}`}
                                      onClick={() => {
                                        setUserAnswer(currentQuestion.id, option);
                                        if (!isTimerRunning && !hasStarted) {
                                          setIsTimerRunning(true);
                                          setHasStarted(true);
                                        }
                                        if (currentQuizQuestionIndex < questions.length - 1) {
                                          setTimeout(() => {
                                            setCurrentQuizQuestionIndex(currentQuizQuestionIndex + 1);
                                          }, 240);
                                        }
                                      }}
                                      className={`w-full py-3 px-4 font-sans-ui text-xs tracking-wide font-medium transition-colors cursor-pointer flex items-center justify-between text-left focus:outline-none ${
                                        isSelected
                                          ? 'bg-[#516050] text-white font-semibold'
                                          : 'text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-white/[0.03]'
                                      }`}
                                    >
                                      <span>{option}</span>
                                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                        isSelected
                                          ? 'border-white bg-white/20 text-white'
                                          : 'border-stone-300 dark:border-stone-600'
                                      }`}>
                                        {isSelected ? '✓' : ''}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>

                        {/* Horizontal Question Switcher Dots */}
                        <div className="flex items-center justify-center gap-2 py-1">
                          {questions.map((q, idx) => (
                            <button
                              key={`quiz-switcher-dot-${q.id ?? ''}-${idx}`}
                              type="button"
                              onClick={() => setCurrentQuizQuestionIndex(idx)}
                              className={`h-1.5 rounded-full transition-all cursor-pointer focus:outline-none ${
                                idx === currentQuizQuestionIndex
                                  ? 'w-6 bg-[#516050] dark:bg-[#8FB996]'
                                  : userAnswers[q.id]
                                  ? 'w-1.5 bg-[#516050]/50 dark:bg-[#8FB996]/50'
                                  : 'w-1.5 bg-stone-300 dark:bg-stone-700'
                              }`}
                              aria-label={`Question ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Submit Test & View Vocabulary Button */}
                      <div className="pt-2 pb-1 shrink-0">
                        <button
                          id="quiz-submit-test-btn"
                          type="button"
                          onClick={handleSubmitTest}
                          className="w-full py-3 px-5 rounded-full bg-[#516050] hover:bg-[#3F4C3E] dark:bg-[#6B8F71] dark:hover:bg-[#4A6B50] text-white font-sans-ui text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer focus:outline-none"
                        >
                          <span>提交试卷并查看评估报告</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unified Editorial Typography Popover (Anchored cleanly under top-right Aa button) */}
      <AnimatePresence>
        {activeAdjustPanel && (
          <div className="absolute inset-0 z-50 pointer-events-auto">
            {/* Backdrop click to dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setActiveAdjustPanel(null)}
              className="absolute inset-0 bg-stone-900/12 dark:bg-black/35 backdrop-blur-[1px]"
            />

            {/* Compact Typography Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-5 sm:right-8 top-24 w-72 p-4 rounded-3xl bg-[#FDFBF7]/98 dark:bg-[#121826]/98 backdrop-blur-2xl border border-stone-200/90 dark:border-white/[0.08] shadow-2xl z-50 space-y-4 select-none"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-white/[0.06] pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-[#516050] dark:text-[#8FB996]" />
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-100 tracking-wide">
                    阅读排版设置
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleFontSizeChange(15.5);
                      handleLineSpacingChange(1.85);
                    }}
                    title="恢复默认字号与行距"
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none flex items-center gap-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>重置</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAdjustPanel(null)}
                    title="关闭"
                    className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Font Size Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-500 dark:text-stone-400 font-medium">字号大小</span>
                  <span className="font-mono tabular-nums font-semibold text-stone-800 dark:text-stone-200">
                    {fontSize.toFixed(1)}px
                  </span>
                </div>
                <div className="flex items-center gap-2.5 bg-stone-100/80 dark:bg-slate-800/60 px-3 py-2 rounded-2xl border border-stone-200/70 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleFontSizeChange(fontSize - 0.5)}
                    className="font-serif-luxury text-xs text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white px-1 cursor-pointer focus:outline-none"
                    title="缩小字号"
                  >
                    A-
                  </button>
                  <input
                    id="ielts-font-size-slider"
                    type="range"
                    min={MIN_FONT_SIZE}
                    max={MAX_FONT_SIZE}
                    step={0.5}
                    value={fontSize}
                    onChange={(e) => handleFontSizeChange(parseFloat(e.target.value))}
                    className="flex-1 accent-[#516050] dark:accent-[#8FB996] h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleFontSizeChange(fontSize + 0.5)}
                    className="font-serif-luxury text-sm font-bold text-stone-700 dark:text-stone-200 hover:text-stone-950 dark:hover:text-white px-1 cursor-pointer focus:outline-none"
                    title="放大字号"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Line Spacing Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-500 dark:text-stone-400 font-medium">行距舒适度</span>
                  <span className="font-mono tabular-nums font-semibold text-stone-800 dark:text-stone-200">
                    {lineSpacing.toFixed(2)}×
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: '紧凑', val: 1.55 },
                    { label: '标准', val: 1.85 },
                    { label: '舒展', val: 2.15 }
                  ].map((preset) => {
                    const isSelected = Math.abs(lineSpacing - preset.val) < 0.08;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleLineSpacingChange(preset.val)}
                        className={`py-1.5 rounded-xl text-[11px] font-medium border transition-all cursor-pointer focus:outline-none ${
                          isSelected
                            ? 'bg-[#516050] text-white border-[#516050] shadow-xs'
                            : 'bg-white dark:bg-[#1A2234] border-stone-200/80 dark:border-white/[0.08] text-stone-600 dark:text-stone-300 hover:border-stone-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2.5 bg-stone-100/80 dark:bg-slate-800/60 px-3 py-2 rounded-2xl border border-stone-200/70 dark:border-white/[0.06]">
                  <MoveVertical className="w-3 h-3 text-stone-400 shrink-0" />
                  <input
                    id="ielts-line-spacing-slider"
                    type="range"
                    min={MIN_LINE_SPACING}
                    max={MAX_LINE_SPACING}
                    step={0.05}
                    value={lineSpacing}
                    onChange={(e) => handleLineSpacingChange(parseFloat(e.target.value))}
                    className="flex-1 accent-[#516050] dark:accent-[#8FB996] h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer appearance-none"
                  />
                  <MoveVertical className="w-3.5 h-3.5 text-stone-700 dark:text-stone-200 shrink-0" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
