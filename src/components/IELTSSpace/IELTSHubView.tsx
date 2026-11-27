import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Search,
  ArrowRight,
  ArrowLeft,
  X,
  Globe,
  ChevronDown,
  Check,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CambridgePassage } from '../../data/ieltsPassages';
import { IELTSListeningSection } from '../../data/ieltsListening';
import {
  expandSearchTokens,
  calculateRelevanceScore,
  matchesSearchTokens,
  getPassageBilingualMeta,
  getListeningBilingualMeta,
  formatBookNameZh
} from '../../data/ieltsTopicSynonyms';
import {
  getCompleteWorkbookPassages,
  getCompleteWorkbookListening,
  computeWordHitMapForPassages,
  computeWordHitMapForListening,
  buildReadingWorkbookCatalog,
  buildListeningWorkbookCatalog,
  resolveReadingBookmarkTarget,
  resolveListeningBookmarkTarget,
  getVolumeShortBadge
} from '../../utils/ieltsWorkbookEngine';
import { db, IeltsTestRecord } from '../../db';
import { useAppStore } from '../../store/useAppStore';

interface IELTSHubViewProps {
  onStartReading: (passage: CambridgePassage, autoStartTimer?: boolean, matchedWords?: string[]) => void;
  onStartListening: (section: IELTSListeningSection) => void;
  onOpenNotebook: () => void;
  onSubViewChange?: (isSubView: boolean) => void;
  resetSignal?: number;
}

export type DisciplineKey =
  | 'ecology'
  | 'archaeology'
  | 'neuroscience'
  | 'engineering'
  | 'earth'
  | 'humanities';

export interface DisciplineTheme {
  key: DisciplineKey;
  labelZh: string;
  shortZh: string;
  heroBgClass: string;
  heroBorderClass: string;
  accentTextClass: string;
  ctaBtnClass: string;
  badgeDotClass: string;
}

export const DISCIPLINE_THEMES: Record<DisciplineKey, DisciplineTheme> = {
  ecology: {
    key: 'ecology',
    labelZh: '自然生态与海洋',
    shortZh: '自然生态',
    heroBgClass: 'from-[#EBF0EC] via-[#F2F5F1] to-[#E4ECE6] dark:from-[#14241E] dark:via-[#182B24] dark:to-[#101C17]',
    heroBorderClass: 'border-[#3B6E52]/18 dark:border-[#78B894]/20',
    accentTextClass: 'text-[#2D5A40] dark:text-[#78B894]',
    ctaBtnClass: 'bg-[#203C2D] hover:bg-[#172C21] text-[#FAF7F2] dark:bg-[#FAF7F2] dark:text-stone-900',
    badgeDotClass: 'bg-[#4E8C69]'
  },
  archaeology: {
    key: 'archaeology',
    labelZh: '考古与古代文明',
    shortZh: '考古文明',
    heroBgClass: 'from-[#F3ECE6] via-[#F7F2ED] to-[#ECE2D8] dark:from-[#261813] dark:via-[#2E1D17] dark:to-[#1C120E]',
    heroBorderClass: 'border-[#9A4B26]/18 dark:border-[#E59866]/20',
    accentTextClass: 'text-[#8C4320] dark:text-[#E59866]',
    ctaBtnClass: 'bg-[#4A2512] hover:bg-[#381B0D] text-[#FAF7F2] dark:bg-[#FAF7F2] dark:text-stone-900',
    badgeDotClass: 'bg-[#B85D32]'
  },
  neuroscience: {
    key: 'neuroscience',
    labelZh: '神经与认知心理',
    shortZh: '神经心理',
    heroBgClass: 'from-[#ECEFF5] via-[#F2F4F8] to-[#E3E8F1] dark:from-[#151C2B] dark:via-[#1B2436] dark:to-[#101622]',
    heroBorderClass: 'border-[#3B5998]/18 dark:border-[#8CA8F9]/20',
    accentTextClass: 'text-[#344E86] dark:text-[#8CA8F9]',
    ctaBtnClass: 'bg-[#1E2B48] hover:bg-[#151F36] text-[#FAF7F2] dark:bg-[#FAF7F2] dark:text-stone-900',
    badgeDotClass: 'bg-[#5271B5]'
  },
  engineering: {
    key: 'engineering',
    labelZh: '材料与前沿工程',
    shortZh: '材料工程',
    heroBgClass: 'from-[#EBF0F2] via-[#F1F5F7] to-[#E2EAEE] dark:from-[#161F26] dark:via-[#1C2830] dark:to-[#11181D]',
    heroBorderClass: 'border-[#2B647E]/18 dark:border-[#67B7DC]/20',
    accentTextClass: 'text-[#23556B] dark:text-[#67B7DC]',
    ctaBtnClass: 'bg-[#1B333F] hover:bg-[#13252E] text-[#FAF7F2] dark:bg-[#FAF7F2] dark:text-stone-900',
    badgeDotClass: 'bg-[#387D9C]'
  },
  earth: {
    key: 'earth',
    labelZh: '极地与地球科学',
    shortZh: '地球气候',
    heroBgClass: 'from-[#E9F1F2] via-[#F0F6F7] to-[#E0ECEE] dark:from-[#122328] dark:via-[#172C33] dark:to-[#0D1A1E]',
    heroBorderClass: 'border-[#1F6E7A]/18 dark:border-[#5EC2D0]/20',
    accentTextClass: 'text-[#1B5E68] dark:text-[#5EC2D0]',
    ctaBtnClass: 'bg-[#153B42] hover:bg-[#0F2B30] text-[#FAF7F2] dark:bg-[#FAF7F2] dark:text-stone-900',
    badgeDotClass: 'bg-[#288996]'
  },
  humanities: {
    key: 'humanities',
    labelZh: '语言与社会人文',
    shortZh: '社会人文',
    heroBgClass: 'from-[#F2EBF0] via-[#F7F2F5] to-[#EBE1E7] dark:from-[#24171F] dark:via-[#2C1C26] dark:to-[#191016]',
    heroBorderClass: 'border-[#823857]/18 dark:border-[#D98CB3]/20',
    accentTextClass: 'text-[#732F4C] dark:text-[#D98CB3]',
    ctaBtnClass: 'bg-[#3D1A29] hover:bg-[#2B121D] text-[#FAF7F2] dark:bg-[#FAF7F2] dark:text-stone-900',
    badgeDotClass: 'bg-[#9E476B]'
  }
};

export function resolveDiscipline(rawCategory: string, rawTitle: string): DisciplineTheme {
  const combined = `${rawCategory} ${rawTitle}`.toLowerCase();
  if (
    /ecology|botany|marine|ocean|forest|rewild|seagrass|whale|meerkat|animal|zoology|bioluminescence|hydroponic|agriculture|eco|植物|森林|海洋|生态|动物|深海|海草/.test(
      combined
    )
  ) {
    return DISCIPLINE_THEMES.ecology;
  }
  if (
    /archaeolog|history|ancient|roman|concrete|damascus|indus|hillfort|iron age|polynesian|maritime|prehistory|epigraphy|考古|古罗马|铁器|文明|历史|航海/.test(
      combined
    )
  ) {
    return DISCIPLINE_THEMES.archaeology;
  }
  if (
    /neuro|cognitive|psychology|brain|speech|taxi|hippocampus|inner speech|bias|medical|ai ethics|神经|大脑|认知|心理|内言/.test(
      combined
    )
  ) {
    return DISCIPLINE_THEMES.neuroscience;
  }
  if (
    /glaciolog|polar|antarctic|geothermal|climate|hydrology|geophysic|earth|冰川|南极|地热|地球|气候/.test(
      combined
    )
  ) {
    return DISCIPLINE_THEMES.earth;
  }
  if (
    /material|sport|tennis|racket|aerodynamic|physics|engineering|quantum|windcatcher|architecture|turbine|材料|网球|工程|物理|建筑|量子/.test(
      combined
    )
  ) {
    return DISCIPLINE_THEMES.engineering;
  }
  return DISCIPLINE_THEMES.humanities;
}

export const DisciplineArtworkSvg: React.FC<{ discipline: DisciplineKey; className?: string }> = ({
  discipline,
  className = ''
}) => {
  switch (discipline) {
    case 'ecology':
      return (
        <svg viewBox="0 0 240 240" fill="none" className={`w-full h-full stroke-current opacity-[0.12] dark:opacity-[0.14] ${className}`}>
          <circle cx="120" cy="120" r="92" strokeWidth="1.1" strokeDasharray="3 3" />
          <circle cx="120" cy="120" r="64" strokeWidth="0.8" />
          <path d="M120 28 C165 75, 165 165, 120 212 C75 165, 75 75, 120 28 Z" strokeWidth="1.2" />
          <path d="M28 120 C75 75, 165 75, 212 120 C165 165, 75 165, 28 120 Z" strokeWidth="1.2" />
        </svg>
      );
    case 'archaeology':
      return (
        <svg viewBox="0 0 240 240" fill="none" className={`w-full h-full stroke-current opacity-[0.12] dark:opacity-[0.14] ${className}`}>
          <rect x="36" y="36" width="168" height="168" strokeWidth="1.1" />
          <rect x="62" y="62" width="116" height="116" strokeWidth="0.8" strokeDasharray="4 4" />
          <circle cx="120" cy="120" r="58" strokeWidth="1.2" />
          <polygon points="120,44 196,120 120,196 44,120" strokeWidth="1.1" />
        </svg>
      );
    case 'neuroscience':
      return (
        <svg viewBox="0 0 240 240" fill="none" className={`w-full h-full stroke-current opacity-[0.12] dark:opacity-[0.14] ${className}`}>
          <circle cx="120" cy="120" r="88" strokeWidth="0.9" />
          <circle cx="120" cy="120" r="44" strokeWidth="1.1" strokeDasharray="2 4" />
          <path d="M45 95 Q120 35 195 95 T195 145 Q120 205 45 145 Z" strokeWidth="1.1" />
          <path d="M120 62 L172 120 L120 178 L68 120 Z" strokeWidth="0.9" />
        </svg>
      );
    case 'engineering':
      return (
        <svg viewBox="0 0 240 240" fill="none" className={`w-full h-full stroke-current opacity-[0.12] dark:opacity-[0.14] ${className}`}>
          <polygon points="120,24 203,72 203,168 120,216 37,168 37,72" strokeWidth="1.2" />
          <polygon points="120,56 175,88 175,152 120,184 65,152 65,88" strokeWidth="0.9" strokeDasharray="3 3" />
          <line x1="120" y1="24" x2="120" y2="216" strokeWidth="0.8" />
        </svg>
      );
    case 'earth':
      return (
        <svg viewBox="0 0 240 240" fill="none" className={`w-full h-full stroke-current opacity-[0.12] dark:opacity-[0.14] ${className}`}>
          <circle cx="120" cy="120" r="90" strokeWidth="1.2" />
          <ellipse cx="120" cy="120" rx="90" ry="38" strokeWidth="0.9" />
          <ellipse cx="120" cy="120" rx="38" ry="90" strokeWidth="0.9" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 240 240" fill="none" className={`w-full h-full stroke-current opacity-[0.12] dark:opacity-[0.14] ${className}`}>
          <circle cx="120" cy="120" r="85" strokeWidth="1.1" />
          <circle cx="95" cy="120" r="55" strokeWidth="0.9" />
          <circle cx="145" cy="120" r="55" strokeWidth="0.9" />
        </svg>
      );
  }
};

// Synchronous module-level cache so returning to IELTSHubView renders the exact same data on Frame 0 without async IndexedDB flash
let cachedHubDbWords: any[] = [];
let cachedHubCustomPassages: CambridgePassage[] = [];
let cachedHubCustomListening: IELTSListeningSection[] = [];
let cachedHubTestRecords: IeltsTestRecord[] = [];

// Compact band range formatting: "Band 6.5 - 7.5" -> "Band 6.5–7.5" so metadata rows stay crisp on one line
function formatCompactBand(raw?: string): string {
  if (!raw) return '';
  return raw.replace(/\s*-\s*/g, '–');
}

export const IELTSHubView: React.FC<IELTSHubViewProps> = ({
  onStartReading,
  onStartListening,
  onSubViewChange,
  resetSignal
}) => {
  const openOnlineSearch = useAppStore(s => s.openOnlineSearch);
  const passageDrafts = useAppStore(s => s.passageDrafts);
  const listeningRecords = useAppStore(s => s.listeningRecords);
  const workbookBookmark = useAppStore(s => s.workbookBookmark);

  const [skillMode, setSkillMode] = useState<'reading' | 'listening'>('reading');
  const [selectedBook, setSelectedBook] = useState<string>('ALL');
  const [isBookMenuOpen, setIsBookMenuOpen] = useState<boolean>(false);
  const [bookMenuOpenUp, setBookMenuOpenUp] = useState<boolean>(true);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchExpanded) {
      searchInputRef.current?.focus();
    }
  }, [isSearchExpanded]);

  // Notify parent IELTSPanel whenever search or filter sub-view is active so TopHeader shows Back arrow (←)
  const isSubViewActive = isSearchExpanded || Boolean(searchQuery.trim()) || selectedBook !== 'ALL';
  useEffect(() => {
    onSubViewChange?.(isSubViewActive);
  }, [isSubViewActive, onSubViewChange]);

  // Reset back to main IELTS Hub interface when TopHeader Back button is clicked
  useEffect(() => {
    if (resetSignal && resetSignal > 0) {
      setIsSearchExpanded(false);
      setSearchQuery('');
      setSelectedBook('ALL');
      setIsBookMenuOpen(false);
    }
  }, [resetSignal]);

  const handleResetToMainHub = () => {
    setIsSearchExpanded(false);
    setSearchQuery('');
    setSelectedBook('ALL');
    setIsBookMenuOpen(false);
  };

  // Module-backed synchronous cache for Dexie live queries so remounting never flashes empty [] state on Frame 1
  const liveDbWords = useLiveQuery(async () => {
    const res = await db.words.toArray();
    cachedHubDbWords = res;
    return res;
  }, [], cachedHubDbWords);
  const liveCustomPassages = useLiveQuery(async () => {
    const res = await db.customPassages.toArray();
    cachedHubCustomPassages = res;
    return res;
  }, [], cachedHubCustomPassages);
  const liveCustomListening = useLiveQuery(async () => {
    const res = await db.customListening.toArray();
    cachedHubCustomListening = res;
    return res;
  }, [], cachedHubCustomListening);
  const liveTestRecords = useLiveQuery(async () => {
    const res = await db.ieltsTests.toArray();
    cachedHubTestRecords = res;
    return res;
  }, [], cachedHubTestRecords);

  const allDbWords = liveDbWords ?? cachedHubDbWords;
  const customPassages = liveCustomPassages ?? cachedHubCustomPassages;
  const customListening = liveCustomListening ?? cachedHubCustomListening;
  const testRecords = liveTestRecords ?? cachedHubTestRecords;
  const userWordStrings = useMemo(() => allDbWords.map(w => w.word), [allDbWords]);

  const savedPassageIds = useMemo(() => new Set(customPassages.map(p => p.id)), [customPassages]);
  const savedListeningIds = useMemo(() => new Set(customListening.map(s => s.id)), [customListening]);

  // Complete workbook passages & listening across all primary volumes + custom library
  const allWorkbookPassages = useMemo(
    () => getCompleteWorkbookPassages(customPassages),
    [customPassages]
  );
  const allWorkbookListening = useMemo(
    () => getCompleteWorkbookListening(customListening),
    [customListening]
  );

  // Word resonance hit maps
  const readingHitMap = useMemo(
    () => computeWordHitMapForPassages(allWorkbookPassages, userWordStrings),
    [allWorkbookPassages, userWordStrings]
  );
  const listeningHitMap = useMemo(
    () => computeWordHitMapForListening(allWorkbookListening, userWordStrings),
    [allWorkbookListening, userWordStrings]
  );

  // Full structured Workbook Catalogs (Volume -> Test 1..4 -> P1..P3 / S1..S4)
  const fullReadingCatalog = useMemo(
    () => buildReadingWorkbookCatalog(allWorkbookPassages, readingHitMap, testRecords, passageDrafts),
    [allWorkbookPassages, readingHitMap, testRecords, passageDrafts]
  );
  const fullListeningCatalog = useMemo(
    () => buildListeningWorkbookCatalog(allWorkbookListening, listeningHitMap, listeningRecords, passageDrafts),
    [allWorkbookListening, listeningHitMap, listeningRecords, passageDrafts]
  );

  // Available volume filter keys
  const availableBooks = useMemo(() => {
    const activeCatalog = skillMode === 'reading' ? fullReadingCatalog : fullListeningCatalog;
    const volumeKeys = activeCatalog.map(v => v.volumeKey);
    const hasCustom = customPassages.length + customListening.length > 0;
    return hasCustom ? ['ALL', 'MY_LIBRARY', ...volumeKeys] : ['ALL', ...volumeKeys];
  }, [skillMode, fullReadingCatalog, fullListeningCatalog, customPassages.length, customListening.length]);

  // Filtered Reading Workbook Catalog (by Volume / My Library / Search query)
  const filteredReadingCatalog = useMemo(() => {
    const tokens = searchQuery.trim() ? expandSearchTokens(searchQuery) : [];

    return fullReadingCatalog
      .filter(vol => {
        if (selectedBook === 'ALL' || selectedBook === 'MY_LIBRARY') return true;
        return vol.volumeKey === selectedBook;
      })
      .map(vol => {
        const filteredTests = vol.tests
          .map(test => {
            const filteredItems = test.items.filter(item => {
              if (selectedBook === 'MY_LIBRARY' && !savedPassageIds.has(item.passage.id)) {
                return false;
              }
              if (tokens.length > 0) {
                const meta = getPassageBilingualMeta(item.passage);
                const score = calculateRelevanceScore(
                  {
                    title: `${meta.titleZh} ${item.passage.title}`,
                    category: `${meta.categoryZh} ${item.passage.category}`,
                    keyVocab: item.passage.keyVocab,
                    text: `${meta.gistZh} ${item.passage.text || ''}`
                  },
                  tokens
                );
                const hasMatch =
                  score > 0 ||
                  matchesSearchTokens(
                    `${meta.titleZh} ${meta.categoryZh} ${meta.gistZh} ${item.passage.title} ${item.passage.subtitle || ''} ${item.passage.category} ${item.volumeLabel} Test ${item.testNum} Passage ${item.passageNum} ${(item.passage.keyVocab || []).join(' ')}`,
                    tokens
                  );
                return hasMatch;
              }
              return true;
            });
            return {
              ...test,
              items: filteredItems
            };
          })
          .filter(test => test.items.length > 0);

        return {
          ...vol,
          tests: filteredTests
        };
      })
      .filter(vol => vol.tests.length > 0);
  }, [fullReadingCatalog, selectedBook, searchQuery, savedPassageIds]);

  // Filtered Listening Workbook Catalog
  const filteredListeningCatalog = useMemo(() => {
    const tokens = searchQuery.trim() ? expandSearchTokens(searchQuery) : [];

    return fullListeningCatalog
      .filter(vol => {
        if (selectedBook === 'ALL' || selectedBook === 'MY_LIBRARY') return true;
        return vol.volumeKey === selectedBook;
      })
      .map(vol => {
        const filteredTests = vol.tests
          .map(test => {
            const filteredItems = test.items.filter(item => {
              if (selectedBook === 'MY_LIBRARY' && !savedListeningIds.has(item.section.id)) {
                return false;
              }
              if (tokens.length > 0) {
                const meta = getListeningBilingualMeta(item.section);
                const score = calculateRelevanceScore(
                  {
                    title: `${meta.titleZh} ${item.section.title}`,
                    category: `${meta.categoryZh} ${item.section.scenario}`,
                    keyVocab: item.section.keyVocab,
                    text: `${meta.gistZh} ${item.section.scriptParagraphs ? item.section.scriptParagraphs.map(sp => sp.text).join(' ') : ''}`
                  },
                  tokens
                );
                const hasMatch =
                  score > 0 ||
                  matchesSearchTokens(
                    `${meta.titleZh} ${meta.categoryZh} ${meta.gistZh} ${item.section.title} ${item.section.scenario} ${item.volumeLabel} Test ${item.testNum} Section ${item.sectionNum} ${(item.section.keyVocab || []).join(' ')}`,
                    tokens
                  );
                return hasMatch;
              }
              return true;
            });
            return {
              ...test,
              items: filteredItems
            };
          })
          .filter(test => test.items.length > 0);

        return {
          ...vol,
          tests: filteredTests
        };
      })
      .filter(vol => vol.tests.length > 0);
  }, [fullListeningCatalog, selectedBook, searchQuery, savedListeningIds]);

  // Resolve Bookmark / Continue Workbook target for the Top Hero Card
  const readingBookmark = useMemo(() => {
    const targetCatalog = filteredReadingCatalog.length > 0 ? filteredReadingCatalog : fullReadingCatalog;
    return resolveReadingBookmarkTarget(targetCatalog, workbookBookmark.readingPassageId);
  }, [filteredReadingCatalog, fullReadingCatalog, workbookBookmark.readingPassageId]);

  const listeningBookmark = useMemo(() => {
    const targetCatalog = filteredListeningCatalog.length > 0 ? filteredListeningCatalog : fullListeningCatalog;
    return resolveListeningBookmarkTarget(targetCatalog, workbookBookmark.listeningSectionId);
  }, [filteredListeningCatalog, fullListeningCatalog, workbookBookmark.listeningSectionId]);

  const featuredReadingMeta = useMemo(
    () => (readingBookmark ? getPassageBilingualMeta(readingBookmark.targetItem.passage) : null),
    [readingBookmark]
  );

  const featuredListeningMeta = useMemo(
    () => (listeningBookmark ? getListeningBilingualMeta(listeningBookmark.targetItem.section) : null),
    [listeningBookmark]
  );

  const featuredReadingDiscipline = useMemo(() => {
    if (!readingBookmark || !featuredReadingMeta) return DISCIPLINE_THEMES.engineering;
    return resolveDiscipline(
      `${readingBookmark.targetItem.passage.category} ${featuredReadingMeta.categoryZh}`,
      `${readingBookmark.targetItem.passage.title} ${featuredReadingMeta.titleZh}`
    );
  }, [readingBookmark, featuredReadingMeta]);

  const featuredListeningDiscipline = useMemo(() => {
    if (!listeningBookmark || !featuredListeningMeta) return DISCIPLINE_THEMES.humanities;
    return resolveDiscipline(
      `${listeningBookmark.targetItem.section.scenario} ${featuredListeningMeta.categoryZh}`,
      `${listeningBookmark.targetItem.section.title} ${featuredListeningMeta.titleZh}`
    );
  }, [listeningBookmark, featuredListeningMeta]);

  const [isScrolled, setIsScrolled] = useState(false);
  const setIsIeltsHubScrolled = useAppStore(s => s.setIsIeltsHubScrolled);
  const [collapsedTestKeys, setCollapsedTestKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    return () => {
      setIsIeltsHubScrolled(false);
    };
  }, [setIsIeltsHubScrolled]);

  const toggleTestCollapse = (testKey: string) => {
    setCollapsedTestKeys(prev => ({
      ...prev,
      [testKey]: !prev[testKey]
    }));
  };

  return (
    <div className="relative flex-1 min-h-0 w-full flex flex-col overflow-hidden select-none">
      {/* Top Soft Feather Gradient Wash under header — only visible after scrolling */}
      <div
        className={`pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#FAF7F2] via-[#FAF7F2]/80 to-transparent dark:from-[#0C1017] dark:via-[#0C1017]/80 dark:to-transparent z-20 transition-opacity duration-200 ${
          isScrolled ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Bottom Soft Feather Gradient Wash — cushions bottom pagination dots cleanly */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#FAF7F2] from-35% via-[#FAF7F2]/92 via-65% to-transparent dark:from-[#0C1017] dark:from-35% dark:via-[#0C1017]/92 dark:via-65% dark:to-transparent z-20"
      />

      <div
        onScroll={(e) => {
          const st = e.currentTarget.scrollTop;
          const next = st > 8;
          if (next !== isScrolled) setIsScrolled(next);
          const nextBottomHide = st > 18;
          if (nextBottomHide !== useAppStore.getState().isIeltsHubScrolled) {
            setIsIeltsHubScrolled(nextBottomHide);
          }
        }}
        className="relative flex-1 min-h-0 w-full flex flex-col overflow-y-auto no-scrollbar px-4 sm:px-6 pt-3 pb-24 z-10"
      >
        <div className="max-w-2xl mx-auto w-full space-y-4">

          {/* 1. Ultra-Clean Top Masthead: 左侧「学术阅读 / 官方听力」，右侧「淘题入库 + 搜索」 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-stone-900/[0.08] dark:border-white/[0.08]">
              {/* Left: Pure Editorial Tabs */}
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => setSkillMode('reading')}
                  className={`relative py-1 text-sm transition-colors cursor-pointer whitespace-nowrap ${
                    skillMode === 'reading'
                      ? 'text-stone-900 dark:text-white font-bold'
                      : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium'
                  }`}
                >
                  <span>学术阅读</span>
                  {skillMode === 'reading' && (
                    <motion.div
                      layoutId="editorial-tab-underline"
                      className="absolute left-0 right-0 -bottom-[9px] h-[2px] bg-stone-900 dark:bg-white rounded-full"
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSkillMode('listening')}
                  className={`relative py-1 text-sm transition-colors cursor-pointer whitespace-nowrap ${
                    skillMode === 'listening'
                      ? 'text-stone-900 dark:text-white font-bold'
                      : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium'
                  }`}
                >
                  <span>官方听力</span>
                  {skillMode === 'listening' && (
                    <motion.div
                      layoutId="editorial-tab-underline"
                      className="absolute left-0 right-0 -bottom-[9px] h-[2px] bg-stone-900 dark:bg-white rounded-full"
                    />
                  )}
                </button>
              </div>

              {/* Right: Question Bank Entry + Magnifying Glass Button */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openOnlineSearch(skillMode, searchQuery.trim())}
                  className="h-7 px-2.5 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-200 bg-stone-900/[0.045] hover:bg-stone-900/[0.08] dark:bg-white/[0.07] dark:hover:bg-white/[0.12] border border-stone-900/[0.06] dark:border-white/[0.08] flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                  title="全网题库"
                >
                  <Globe className="w-3 h-3 shrink-0 opacity-75" />
                  <span>淘题入库</span>
                  {customPassages.length + customListening.length > 0 && (
                    <span className="font-mono text-[10px] opacity-75">
                      ({customPassages.length + customListening.length})
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSearchExpanded(prev => {
                      if (prev) setSearchQuery('');
                      return !prev;
                    });
                  }}
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isSearchExpanded || searchQuery
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                      : 'text-stone-500 dark:text-stone-400 hover:bg-stone-900/[0.05] dark:hover:bg-white/[0.06] hover:text-stone-900 dark:hover:text-white'
                  }`}
                  title="搜索"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expandable Search Drawer with Integrated Online Archive Button */}
            <AnimatePresence>
              {isSearchExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.16 }}
                  className="overflow-hidden"
                >
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 absolute left-3.5 text-stone-400 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          openOnlineSearch(skillMode, searchQuery.trim());
                        }
                      }}
                      placeholder="搜索篇目、学科或关键词..."
                      className="w-full pl-9 pr-28 py-2.5 text-xs rounded-2xl bg-white/85 dark:bg-white/[0.06] border border-stone-900/[0.08] dark:border-white/[0.08] focus:outline-none focus:border-stone-900/25 dark:focus:border-white/25 text-stone-800 dark:text-stone-200 placeholder:text-stone-400"
                    />

                    <div className="absolute right-1.5 flex items-center gap-1">
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        id="btn-open-volume-library"
                        onClick={() => openOnlineSearch(skillMode, searchQuery.trim())}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-stone-700 dark:text-stone-200 bg-stone-900/[0.05] hover:bg-stone-900/[0.09] dark:bg-white/[0.08] dark:hover:bg-white/[0.14] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Globe className="w-3 h-3 shrink-0 opacity-75" />
                        <span>全网题库</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. Workbook Bookmark Hero Card */}
          <AnimatePresence mode="wait" initial={false}>
            {skillMode === 'reading' && readingBookmark && featuredReadingMeta && (
              <motion.div
                id="workbook-bookmark-hero-card"
                key={`hero-reading-${selectedBook}-${readingBookmark.targetItem.passage.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                onClick={() =>
                  onStartReading(
                    readingBookmark.targetItem.passage,
                    false,
                    readingBookmark.targetItem.progress.hitWords
                  )
                }
                className={`group relative overflow-hidden rounded-[26px] bg-gradient-to-br ${featuredReadingDiscipline.heroBgClass} p-4 sm:p-5 border ${featuredReadingDiscipline.heroBorderClass} shadow-[0_10px_30px_-10px_rgba(28,25,23,0.07)] cursor-pointer transition-transform duration-200 active:scale-[0.995] transform-gpu`}
              >
                <div className={`absolute -right-10 -top-10 w-60 h-60 pointer-events-none select-none transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3 ${featuredReadingDiscipline.accentTextClass}`}>
                  <DisciplineArtworkSvg discipline={featuredReadingDiscipline.key} />
                </div>

                <div className="relative z-10 space-y-3">
                  {/* Top Workbook Bookmark Row: Quiet Source + Location */}
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300 min-w-0 flex-1 overflow-hidden">
                      <Bookmark className={`w-3.5 h-3.5 shrink-0 ${featuredReadingDiscipline.accentTextClass}`} />
                      <span className="font-sans-ui text-[11.5px] font-semibold text-stone-700 dark:text-stone-200 tracking-normal truncate">
                        {getVolumeShortBadge(readingBookmark.volumeGroup.volumeKey)}
                      </span>
                    </div>

                    <span className="font-mono tabular-nums text-[11px] text-stone-500 dark:text-stone-400 font-medium whitespace-nowrap shrink-0">
                      Test {readingBookmark.targetItem.testNum} · P{readingBookmark.targetItem.passageNum}
                    </span>
                  </div>

                  {/* Center Focal Anchor: Deep Ink Typography on Warm Archival Paper */}
                  <div className="space-y-1.5">
                    <h2 className="text-[19px] sm:text-[21px] font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-[1.32]">
                      {featuredReadingMeta.titleZh}
                    </h2>

                    <p className="font-serif-luxury italic text-[14.5px] text-stone-600 dark:text-stone-300 leading-snug">
                      {featuredReadingMeta.titleEn}
                    </p>

                    <p className="text-xs sm:text-[13px] text-stone-600/90 dark:text-stone-400 leading-relaxed line-clamp-2 pt-0.5">
                      {featuredReadingMeta.gistZh}
                    </p>
                  </div>

                  {/* Clean Single-Row Footer: Single Contextual Signal + Natural Action */}
                  <div className="pt-3 border-t border-stone-900/[0.08] dark:border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300 min-w-0 flex-1 overflow-hidden">
                      {readingBookmark.targetItem.progress.status === 'in_progress' ? (
                        <span className="text-amber-700 dark:text-amber-400 font-mono font-medium truncate">
                          已答 {readingBookmark.targetItem.progress.answeredCount}/{readingBookmark.targetItem.progress.totalQuestions} 题
                        </span>
                      ) : readingBookmark.testGroup.earnedTotalQuestions > 0 ? (
                        <span className={`font-mono font-medium truncate ${featuredReadingDiscipline.accentTextClass}`}>
                          本套已得 {readingBookmark.testGroup.earnedCorrect}/{readingBookmark.testGroup.earnedTotalQuestions}
                        </span>
                      ) : readingBookmark.targetItem.progress.hitCount > 0 ? (
                        <span className={`font-medium tabular-nums truncate ${featuredReadingDiscipline.accentTextClass}`}>
                          生词共鸣 +{readingBookmark.targetItem.progress.hitCount}
                        </span>
                      ) : (
                        <span className="text-stone-500 dark:text-stone-400 font-mono tabular-nums truncate">
                          {formatCompactBand(readingBookmark.targetItem.passage.bandDifficulty)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onStartReading(
                          readingBookmark.targetItem.passage,
                          false,
                          readingBookmark.targetItem.progress.hitWords
                        );
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all group-hover:translate-x-0.5 cursor-pointer whitespace-nowrap shrink-0 ${featuredReadingDiscipline.ctaBtnClass}`}
                    >
                      <span>{readingBookmark.isResume ? '继续阅读' : '开始精读'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {skillMode === 'listening' && listeningBookmark && featuredListeningMeta && (
              <motion.div
                id="workbook-bookmark-hero-card"
                key={`hero-listening-${selectedBook}-${listeningBookmark.targetItem.section.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => onStartListening(listeningBookmark.targetItem.section)}
                className={`group relative overflow-hidden rounded-[26px] bg-gradient-to-br ${featuredListeningDiscipline.heroBgClass} p-4 sm:p-5 border ${featuredListeningDiscipline.heroBorderClass} shadow-[0_10px_30px_-10px_rgba(28,25,23,0.07)] cursor-pointer transition-transform duration-200 active:scale-[0.995] transform-gpu`}
              >
                <div className={`absolute -right-10 -top-10 w-60 h-60 pointer-events-none select-none transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3 ${featuredListeningDiscipline.accentTextClass}`}>
                  <DisciplineArtworkSvg discipline={featuredListeningDiscipline.key} />
                </div>

                <div className="relative z-10 space-y-3">
                  {/* Top Workbook Bookmark Masthead: Quiet Source + Location */}
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300 min-w-0 flex-1 overflow-hidden">
                      <Bookmark className={`w-3.5 h-3.5 shrink-0 ${featuredListeningDiscipline.accentTextClass}`} />
                      <span className="font-sans-ui text-[11.5px] font-semibold text-stone-700 dark:text-stone-200 tracking-normal truncate">
                        {getVolumeShortBadge(listeningBookmark.volumeGroup.volumeKey)}
                      </span>
                    </div>

                    <span className="font-mono tabular-nums text-[11px] text-stone-500 dark:text-stone-400 font-medium whitespace-nowrap shrink-0">
                      Test {listeningBookmark.targetItem.testNum} · S{listeningBookmark.targetItem.sectionNum}
                    </span>
                  </div>

                  {/* Center Headline */}
                  <div className="space-y-1.5">
                    <h2 className="text-[19px] sm:text-[21px] font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-[1.32]">
                      {featuredListeningMeta.titleZh}
                    </h2>

                    <p className="font-serif-luxury italic text-[14.5px] text-stone-600 dark:text-stone-300 leading-snug">
                      {featuredListeningMeta.titleEn}
                    </p>

                    <p className="text-xs sm:text-[13px] text-stone-600/90 dark:text-stone-400 leading-relaxed line-clamp-2 pt-0.5">
                      {featuredListeningMeta.gistZh}
                    </p>
                  </div>

                  {/* Clean Single-Row Footer */}
                  <div className="pt-3 border-t border-stone-900/[0.08] dark:border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 min-w-0 flex-1 overflow-hidden">
                      {listeningBookmark.targetItem.progress.status === 'in_progress' ? (
                        <span className="text-amber-700 dark:text-amber-400 font-mono font-medium truncate">
                          已答 {listeningBookmark.targetItem.progress.answeredCount}/{listeningBookmark.targetItem.progress.totalQuestions} 题
                        </span>
                      ) : listeningBookmark.testGroup.earnedTotalQuestions > 0 ? (
                        <span className={`font-mono font-medium truncate ${featuredListeningDiscipline.accentTextClass}`}>
                          本套已得 {listeningBookmark.testGroup.earnedCorrect}/{listeningBookmark.testGroup.earnedTotalQuestions}
                        </span>
                      ) : (
                        <span className="text-stone-500 dark:text-stone-400 font-mono tabular-nums truncate">
                          {formatCompactBand(listeningBookmark.targetItem.section.bandDifficulty)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onStartListening(listeningBookmark.targetItem.section);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all group-hover:translate-x-0.5 cursor-pointer whitespace-nowrap shrink-0 ${featuredListeningDiscipline.ctaBtnClass}`}
                    >
                      <span>{listeningBookmark.isResume ? '继续听力' : '开始精听'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3. Paper-Workbook Catalog: 分册 -> Test 1~4 -> P1/P2/P3 */}
          <div id="workbook-directory-section" className="space-y-4 pt-1">
            {/* Quick Volume Switcher Strip + Volume Dropdown */}
            <div className="flex items-center justify-between gap-2 border-b border-stone-900/[0.07] dark:border-white/[0.07] pb-2">
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar min-w-0 flex-1 pr-6 [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent_100%)]">
                {availableBooks.map(book => {
                  const active = selectedBook === book;
                  const shortLabel =
                    book === 'ALL'
                      ? '全部卷册'
                      : book === 'MY_LIBRARY'
                        ? '个人馆藏'
                        : getVolumeShortBadge(book);
                  return (
                    <button
                      key={`spine-tab-${book}`}
                      type="button"
                      onClick={() => setSelectedBook(book)}
                      className={`text-xs whitespace-nowrap transition-colors cursor-pointer pb-1 ${
                        active
                          ? 'text-stone-900 dark:text-white font-bold border-b-2 border-stone-900 dark:border-white'
                          : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium'
                      }`}
                    >
                      {shortLabel}
                    </button>
                  );
                })}
              </div>

              {/* Volume Picker Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    if (!isBookMenuOpen) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const scrollEl = e.currentTarget.closest('.overflow-y-auto');
                      const containerRect = scrollEl ? scrollEl.getBoundingClientRect() : null;
                      const bottomEdge = containerRect ? containerRect.bottom : window.innerHeight;
                      const topEdge = containerRect ? containerRect.top : 0;
                      const spaceBelow = bottomEdge - rect.bottom - 56;
                      const spaceAbove = rect.top - topEdge;
                      setBookMenuOpenUp(spaceBelow < 264 && spaceAbove > spaceBelow);
                    }
                    setIsBookMenuOpen(prev => !prev);
                  }}
                  className={`h-7 px-2.5 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                    selectedBook !== 'ALL'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold'
                      : 'text-stone-600 dark:text-stone-300 bg-stone-900/[0.04] dark:bg-white/[0.05] hover:bg-stone-900/[0.08] dark:hover:bg-white/[0.09] font-medium'
                  }`}
                >
                  <span>
                    {selectedBook === 'ALL'
                      ? '卷册筛选'
                      : selectedBook === 'MY_LIBRARY'
                        ? `个人馆藏 (${skillMode === 'reading' ? customPassages.length : customListening.length})`
                        : getVolumeShortBadge(selectedBook)}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isBookMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isBookMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsBookMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: bookMenuOpenUp ? 6 : -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: bookMenuOpenUp ? 4 : -4, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className={`absolute right-0 ${
                          bookMenuOpenUp ? 'bottom-full mb-1.5 origin-bottom-right' : 'top-full mt-1.5 origin-top-right'
                        } w-48 max-h-64 overflow-y-auto no-scrollbar rounded-2xl p-1.5 bg-[#FDFCF9] dark:bg-[#141822] border border-stone-200/95 dark:border-white/[0.12] shadow-[0_18px_38px_-10px_rgba(28,25,23,0.22),0_4px_12px_rgba(28,25,23,0.06)] dark:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.8)] z-40 space-y-0.5`}
                      >
                        {availableBooks.map(book => {
                          const active = selectedBook === book;
                          const label =
                            book === 'ALL'
                              ? '全部真题册'
                              : book === 'MY_LIBRARY'
                                ? `个人馆藏 (${skillMode === 'reading' ? customPassages.length : customListening.length})`
                                : getVolumeShortBadge(book);
                          return (
                            <button
                              key={`book-opt-${book}`}
                              type="button"
                              onClick={() => {
                                setSelectedBook(book);
                                setIsBookMenuOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                                active
                                  ? 'bg-stone-900/[0.06] dark:bg-white/[0.09] text-stone-950 dark:text-white font-semibold'
                                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-900/[0.04] dark:hover:bg-white/[0.05]'
                              }`}
                            >
                              <span className="truncate">{label}</span>
                              {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`archive-catalog-${skillMode}-${selectedBook}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                {skillMode === 'reading' ? (
                  filteredReadingCatalog.length > 0 ? (
                    filteredReadingCatalog.map(volume => (
                      <section key={`editorial-vol-r-${volume.volumeKey}`} className="space-y-3">
                        {/* Volume Masthead */}
                        <div className="flex items-baseline justify-between gap-3 pt-1 pb-2 border-b border-stone-900/15 dark:border-white/15">
                          <h3 className="font-serif-luxury text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 truncate">
                            {volume.volumeLabel}
                          </h3>
                          {volume.completedItemsCount > 0 && (
                            <span className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 shrink-0">
                              {volume.completedItemsCount}/{volume.totalItemsCount}
                            </span>
                          )}
                        </div>

                        {/* Complete Test 1 ~ Test 4 Sheets with Smooth Accordion */}
                        <div className="space-y-3">
                          {volume.tests.map(test => {
                            const testKey = `r-${volume.volumeKey}-t${test.testNum}`;
                            const isCollapsed = Boolean(collapsedTestKeys[testKey]);
                            const completionRatio = test.totalItems > 0 ? (test.completedCount / test.totalItems) * 100 : 0;

                            return (
                              <div
                                key={`vol-${volume.volumeKey}-test-${test.testNum}`}
                                className="rounded-2xl border border-stone-900/[0.08] dark:border-white/[0.08] bg-white/55 dark:bg-white/[0.02] overflow-hidden"
                              >
                                {/* Clickable Paper Test Sheet Header */}
                                <button
                                  type="button"
                                  onClick={() => toggleTestCollapse(testKey)}
                                  aria-expanded={!isCollapsed}
                                  className="w-full px-4 py-2.5 bg-stone-900/[0.025] dark:bg-white/[0.03] hover:bg-stone-900/[0.045] dark:hover:bg-white/[0.05] transition-colors flex flex-col gap-1.5 cursor-pointer text-left focus:outline-none"
                                >
                                  <div className="w-full flex items-center justify-between gap-2">
                                    <span className="font-serif-luxury text-base font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                                      Test {test.testNum}
                                    </span>

                                    <div className="flex items-center gap-2 shrink-0 text-xs font-mono tabular-nums">
                                      {test.isTestCompleted ? (
                                        <span className="text-[#2D5A40] dark:text-[#78B894] font-semibold flex items-center gap-1">
                                          <Check className="w-3.5 h-3.5 shrink-0" />
                                          <span>{test.earnedCorrect}/{test.earnedTotalQuestions}</span>
                                        </span>
                                      ) : test.completedCount > 0 || test.inProgressCount > 0 ? (
                                        <span className="text-stone-600 dark:text-stone-300 font-medium">
                                          {test.completedCount}/{test.totalItems}
                                        </span>
                                      ) : null}
                                      <ChevronDown
                                        className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                                          isCollapsed ? '-rotate-90' : 'rotate-0'
                                        }`}
                                      />
                                    </div>
                                  </div>

                                  {completionRatio > 0 && (
                                    <div className="w-full h-[2px] rounded-full bg-stone-900/[0.06] dark:bg-white/[0.06] overflow-hidden">
                                      <div
                                        className="h-full bg-[#2D5A40] dark:bg-[#78B894] transition-all duration-300"
                                        style={{ width: `${completionRatio}%` }}
                                      />
                                    </div>
                                  )}
                                </button>

                                {/* Smooth Accordion Body: Ordered P1 -> P2 -> P3 Rows */}
                                <AnimatePresence initial={false}>
                                  {!isCollapsed && (
                                    <motion.div
                                      key={`test-body-${testKey}`}
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                      className="overflow-hidden border-t border-stone-900/[0.06] dark:border-white/[0.06]"
                                    >
                                      <div className="divide-y divide-stone-900/[0.06] dark:divide-white/[0.06]">
                                        {test.items.map(item => {
                                          const { passage, progress } = item;
                                          const meta = getPassageBilingualMeta(passage);
                                          const disc = resolveDiscipline(
                                            `${passage.category} ${meta.categoryZh}`,
                                            `${passage.title} ${meta.titleZh}`
                                          );
                                          const isBookmarked = readingBookmark?.targetItem.passage.id === passage.id;

                                          return (
                                            <article
                                              key={`passage-workbook-row-${volume.volumeKey}-t${test.testNum}-p${passage.passageNum}-${passage.id}`}
                                              onClick={() => onStartReading(passage, false, progress.hitWords)}
                                              className={`group py-3.5 px-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                                                isBookmarked
                                                  ? 'bg-stone-900/[0.035] dark:bg-white/[0.05]'
                                                  : 'hover:bg-stone-900/[0.025] dark:hover:bg-white/[0.025]'
                                              }`}
                                            >
                                              {/* Left: Clean Passage Index */}
                                              <div className="w-10 shrink-0 pt-0.5 flex items-center gap-1.5">
                                                {progress.status === 'completed' ? (
                                                  <span className="w-2 h-2 rounded-full bg-[#2D5A40] dark:bg-[#78B894] shrink-0" title="已完成" />
                                                ) : progress.status === 'in_progress' ? (
                                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="进行中" />
                                                ) : (
                                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${disc.badgeDotClass}`} />
                                                )}
                                                <span className="font-serif-luxury text-lg font-bold leading-none text-stone-800 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white transition-colors tabular-nums">
                                                  P{passage.passageNum}
                                                </span>
                                              </div>

                                              {/* Center: Title + Subtitle + Minimal Discipline Tag */}
                                              <div className="min-w-0 flex-1 space-y-1">
                                                <h4 className="text-[15px] font-bold text-stone-900 dark:text-stone-100 group-hover:text-stone-950 dark:group-hover:text-white transition-colors leading-snug">
                                                  {meta.titleZh}
                                                </h4>

                                                <p className="font-serif-luxury italic text-xs text-stone-500 dark:text-stone-400 truncate">
                                                  {meta.titleEn}
                                                </p>

                                                <div className="flex items-center gap-x-1.5 text-[10.5px] leading-none text-stone-400 dark:text-stone-500 whitespace-nowrap pt-0.5 min-w-0">
                                                  <span className={`font-medium truncate min-w-0 ${disc.accentTextClass}`}>
                                                    {disc.shortZh}
                                                  </span>
                                                  {progress.hitCount > 0 && (
                                                    <span className="inline-flex items-center gap-1 shrink-0">
                                                      <span aria-hidden="true" className="opacity-50">·</span>
                                                      <span className="text-amber-700 dark:text-amber-400 font-medium tabular-nums">
                                                        生词 +{progress.hitCount}
                                                      </span>
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Right: Active Score Only (Untouched Rows Stay Quiet with Arrow) */}
                                              <div className="shrink-0 self-center pl-1 flex items-center gap-1.5">
                                                {progress.status === 'completed' ? (
                                                  <span className="text-xs font-mono font-bold tabular-nums text-[#2D5A40] dark:text-[#78B894] flex items-center gap-0.5">
                                                    <Check className="w-3 h-3 shrink-0" />
                                                    <span>{progress.correctCount}/{progress.totalQuestions}</span>
                                                  </span>
                                                ) : progress.status === 'in_progress' ? (
                                                  <span className="text-xs font-mono font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                                                    {progress.answeredCount}/{progress.totalQuestions}
                                                  </span>
                                                ) : null}
                                                <ArrowRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-900 dark:group-hover:text-stone-100 group-hover:translate-x-0.5 transition-all" />
                                              </div>
                                            </article>
                                          );
                                        })}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ))
                  ) : (
                    <div className="py-12 px-4 rounded-3xl bg-white/50 dark:bg-white/[0.03] border border-stone-900/[0.06] dark:border-white/[0.06] text-center space-y-3.5">
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        本地未找到与「{searchQuery}」匹配的阅读篇目
                      </p>
                      <div className="flex items-center justify-center gap-2.5 flex-wrap">
                        <button
                          type="button"
                          onClick={handleResetToMainHub}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900/[0.06] hover:bg-stone-900/[0.1] dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-stone-700 dark:text-stone-200 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>返回目录</span>
                        </button>

                        {searchQuery.trim() && (
                          <button
                            type="button"
                            onClick={() => openOnlineSearch('reading', searchQuery.trim())}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 text-xs font-semibold shadow-xs cursor-pointer hover:bg-stone-800 dark:hover:bg-white transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>全网检索「{searchQuery}」</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                ) : filteredListeningCatalog.length > 0 ? (
                  filteredListeningCatalog.map(volume => (
                    <section key={`editorial-vol-l-${volume.volumeKey}`} className="space-y-3">
                      {/* Volume Masthead */}
                      <div className="flex items-baseline justify-between gap-3 pt-1 pb-2 border-b border-stone-900/15 dark:border-white/15">
                        <h3 className="font-serif-luxury text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 truncate">
                          {volume.volumeLabel}
                        </h3>
                        {volume.completedItemsCount > 0 && (
                          <span className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 shrink-0">
                            {volume.completedItemsCount}/{volume.totalItemsCount}
                          </span>
                        )}
                      </div>

                      {/* Complete Test 1 ~ Test 4 Listening Sheets with Smooth Accordion */}
                      <div className="space-y-3">
                        {volume.tests.map(test => {
                          const testKey = `l-${volume.volumeKey}-t${test.testNum}`;
                          const isCollapsed = Boolean(collapsedTestKeys[testKey]);
                          const completionRatio = test.totalItems > 0 ? (test.completedCount / test.totalItems) * 100 : 0;

                          return (
                            <div
                              key={`vol-l-${volume.volumeKey}-test-${test.testNum}`}
                              className="rounded-2xl border border-stone-900/[0.08] dark:border-white/[0.08] bg-white/55 dark:bg-white/[0.02] overflow-hidden"
                            >
                              {/* Clickable Paper Test Sheet Header */}
                              <button
                                type="button"
                                onClick={() => toggleTestCollapse(testKey)}
                                aria-expanded={!isCollapsed}
                                className="w-full px-4 py-2.5 bg-stone-900/[0.025] dark:bg-white/[0.03] hover:bg-stone-900/[0.045] dark:hover:bg-white/[0.05] transition-colors flex flex-col gap-1.5 cursor-pointer text-left focus:outline-none"
                              >
                                <div className="w-full flex items-center justify-between gap-2">
                                  <span className="font-serif-luxury text-base font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                                    Test {test.testNum}
                                  </span>

                                  <div className="flex items-center gap-2 shrink-0 text-xs font-mono tabular-nums">
                                    {test.isTestCompleted ? (
                                      <span className="text-[#2D5A40] dark:text-[#78B894] font-semibold flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5 shrink-0" />
                                        <span>{test.earnedCorrect}/{test.earnedTotalQuestions}</span>
                                      </span>
                                    ) : test.completedCount > 0 || test.inProgressCount > 0 ? (
                                      <span className="text-stone-600 dark:text-stone-300 font-medium">
                                        {test.completedCount}/{test.totalItems}
                                      </span>
                                    ) : null}
                                    <ChevronDown
                                      className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                                        isCollapsed ? '-rotate-90' : 'rotate-0'
                                      }`}
                                    />
                                  </div>
                                </div>

                                {completionRatio > 0 && (
                                  <div className="w-full h-[2px] rounded-full bg-stone-900/[0.06] dark:bg-white/[0.06] overflow-hidden">
                                    <div
                                      className="h-full bg-[#2D5A40] dark:bg-[#78B894] transition-all duration-300"
                                      style={{ width: `${completionRatio}%` }}
                                    />
                                  </div>
                                )}
                              </button>

                              {/* Smooth Accordion Body: Ordered S1 -> S2 -> S3 -> S4 Rows */}
                              <AnimatePresence initial={false}>
                                {!isCollapsed && (
                                  <motion.div
                                    key={`test-body-${testKey}`}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    className="overflow-hidden border-t border-stone-900/[0.06] dark:border-white/[0.06]"
                                  >
                                    <div className="divide-y divide-stone-900/[0.06] dark:divide-white/[0.06]">
                                      {test.items.map(item => {
                                        const { section, progress } = item;
                                        const meta = getListeningBilingualMeta(section);
                                        const disc = resolveDiscipline(
                                          `${section.scenario} ${meta.categoryZh}`,
                                          `${section.title} ${meta.titleZh}`
                                        );
                                        const isBookmarked = listeningBookmark?.targetItem.section.id === section.id;

                                        return (
                                          <article
                                            key={`section-workbook-row-${volume.volumeKey}-t${test.testNum}-s${section.sectionNum}-${section.id}`}
                                            onClick={() => onStartListening(section)}
                                            className={`group py-3.5 px-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                                              isBookmarked
                                                ? 'bg-amber-700/[0.045] dark:bg-amber-400/[0.06]'
                                                : 'hover:bg-stone-900/[0.025] dark:hover:bg-white/[0.025]'
                                            }`}
                                          >
                                            <div className="w-10 shrink-0 pt-0.5 flex items-center gap-1.5">
                                              {progress.status === 'completed' ? (
                                                <span className="w-2 h-2 rounded-full bg-[#2D5A40] dark:bg-[#78B894] shrink-0" title="已完成" />
                                              ) : progress.status === 'in_progress' ? (
                                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="进行中" />
                                              ) : (
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${disc.badgeDotClass}`} />
                                              )}
                                              <span className="font-serif-luxury text-lg font-bold leading-none text-stone-800 dark:text-stone-200 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors tabular-nums">
                                                S{section.sectionNum}
                                              </span>
                                            </div>

                                            <div className="min-w-0 flex-1 space-y-1">
                                              <h4 className="text-[15px] font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-snug">
                                                {meta.titleZh}
                                              </h4>

                                              <p className="font-serif-luxury italic text-xs text-stone-500 dark:text-stone-400 truncate">
                                                {meta.titleEn}
                                              </p>

                                              <div className="flex items-center gap-x-1.5 text-[10.5px] leading-none text-stone-400 dark:text-stone-500 whitespace-nowrap pt-0.5 min-w-0">
                                                <span className={`font-medium truncate min-w-0 ${disc.accentTextClass}`}>
                                                  {meta.categoryZh}
                                                </span>
                                                {progress.hitCount > 0 && (
                                                  <span className="inline-flex items-center gap-1 shrink-0">
                                                    <span aria-hidden="true" className="opacity-50">·</span>
                                                    <span className="text-amber-700 dark:text-amber-400 font-medium tabular-nums">
                                                      生词 +{progress.hitCount}
                                                    </span>
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            <div className="shrink-0 self-center pl-1 flex items-center gap-1.5">
                                              {progress.status === 'completed' ? (
                                                <span className="text-xs font-mono font-bold tabular-nums text-[#2D5A40] dark:text-[#78B894] flex items-center gap-0.5">
                                                  <Check className="w-3 h-3 shrink-0" />
                                                  <span>{progress.correctCount}/{progress.totalQuestions}</span>
                                                </span>
                                              ) : progress.status === 'in_progress' ? (
                                                <span className="text-xs font-mono font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                                                  {progress.answeredCount}/{progress.totalQuestions}
                                                </span>
                                              ) : null}
                                              <ArrowRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-amber-700 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                          </article>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="py-12 px-4 rounded-3xl bg-white/50 dark:bg-white/[0.03] border border-stone-900/[0.06] dark:border-white/[0.06] text-center space-y-3.5">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      本地未找到与「{searchQuery}」匹配的听力篇目
                    </p>
                    <div className="flex items-center justify-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={handleResetToMainHub}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900/[0.06] hover:bg-stone-900/[0.1] dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-stone-700 dark:text-stone-200 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>返回目录</span>
                      </button>

                      {searchQuery.trim() && (
                        <button
                          type="button"
                          onClick={() => openOnlineSearch('listening', searchQuery.trim())}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-xs cursor-pointer hover:bg-amber-700 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>全网检索「{searchQuery}」</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
};
