import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BookOpen,
  Headphones,
  Check,
  Plus,
  Trash2,
  Loader2,
  Search,
  Library,
  X,
  Sparkles,
  CheckCheck,
  Download,
  Radio,
  RefreshCw,
  Flame,
  Globe,
  Globe2,
  Play,
  ArrowRight,
  Clock,
  Bookmark,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Grid,
  Layers,
  Calendar,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Filter
} from 'lucide-react';
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
import { resolveDiscipline, DisciplineArtworkSvg, DISCIPLINE_THEMES } from './IELTSHubView';
import {
  IELTSVolume,
  OFFICIAL_IELTS_VOLUMES,
  getVolumeAllPassages,
  getVolumeAllListening,
  getVolumeImportStatus
} from '../../data/ieltsVolumes';
import { buildStandard40QuestionVolume, checkIELTSQueryExists } from '../../data/ieltsDynamicGenerator';
import {
  ExamTimelineSession,
  EXAM_TIMELINE_SESSIONS,
  filterExamTimeline,
  buildVolumeFromTimelineSession
} from '../../data/ieltsExamTimeline';
import { IELTS_2026_AUTUMN_RECALL_VOLUME } from '../../data/seasonalIeltsRecallArchive';
import {
  db,
  saveCustomPassage,
  saveCustomPassagesBulk,
  saveCustomListeningSection,
  saveCustomListeningBulk,
  deleteCustomPassage,
  deleteCustomListeningSection
} from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { Capacitor } from '@capacitor/core';
import { searchAndCompileIeltsVolumeClient } from '../../utils/clientIeltsSearch';

interface OnlineIELTSSearchModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onStartReading?: (passage: CambridgePassage, autoStartTimer?: boolean, matchedWords?: string[]) => void;
  onStartListening?: (section: IELTSListeningSection) => void;
  initialQuery?: string;
  initialSkill?: 'reading' | 'listening';
}

interface SeasonalFeedItem {
  id: string;
  title: string;
  season: string;
  updateTime: string;
  hotScore: string;
  category: string;
  readingCount: number;
  listeningCount: number;
  description: string;
  tests: Array<{
    testNum: number;
    readingPassages: CambridgePassage[];
    listeningSections: IELTSListeningSection[];
  }>;
}

export const OnlineIELTSSearchModal: React.FC<OnlineIELTSSearchModalProps> = ({
  isOpen,
  onClose,
  onStartReading,
  onStartListening,
  initialQuery = '',
  initialSkill
}) => {
  const storeIsOpen = useAppStore(s => s.isOnlineSearchOpen);
  const storeClose = useAppStore(s => s.closeOnlineSearch);
  const showToast = useAppStore(s => s.showToast);
  const storeLoadReading = useAppStore(s => s.loadCambridgePassage);
  const storeLoadListening = useAppStore(s => s.loadCambridgeListening);
  const storeInitialSkill = useAppStore(s => s.onlineSearchInitialSkill);
  const storeInitialQuery = useAppStore(s => s.onlineSearchInitialQuery);

  const effectiveIsOpen = isOpen !== undefined ? isOpen : storeIsOpen;
  const handleClose = onClose || storeClose;

  const handleLaunchReading = (passage: CambridgePassage, autoStartTimer?: boolean, matchedWords?: string[]) => {
    if (onStartReading) {
      onStartReading(passage, autoStartTimer, matchedWords);
    } else {
      storeLoadReading(passage);
    }
    handleClose();
  };

  const handleLaunchListening = (section: IELTSListeningSection) => {
    if (onStartListening) {
      onStartListening(section);
    } else {
      storeLoadListening(section);
    }
    handleClose();
  };

  // Active Top Tab: Live Seasonal Feed (考季机经) | Web Search (全网搜卷) | My Library (馆藏)
  const [activeTab, setActiveTab] = useState<'live-feed' | 'web-search' | 'my-library'>('live-feed');
  const [isModalScrolled, setIsModalScrolled] = useState<boolean>(false);
  const [skillFilter, setSkillFilter] = useState<'reading' | 'listening'>(initialSkill || 'reading');
  const [onlyUnsaved, setOnlyUnsaved] = useState<boolean>(false);
  const [onlyNewTopics, setOnlyNewTopics] = useState<boolean>(false);
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);
  const [libraryDisciplineFilter, setLibraryDisciplineFilter] = useState<string>('ALL');
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>('cambridge-volume-19');
  const [selectedTestNum, setSelectedTestNum] = useState<number>(1);
  const [isVolumePickerOpen, setIsVolumePickerOpen] = useState<boolean>(false);
  const [importingVolumeId, setImportingVolumeId] = useState<string | null>(null);
  const [importingTestKey, setImportingTestKey] = useState<string | null>(null);

  // Official volumes state with cloud dynamic synchronization
  const [cloudOfficialVolumes, setCloudOfficialVolumes] = useState<IELTSVolume[]>(OFFICIAL_IELTS_VOLUMES);
  const [isSyncingOfficial, setIsSyncingOfficial] = useState<boolean>(false);
  const [officialSyncLabel, setOfficialSyncLabel] = useState<string>('剑桥官方真题全集 (剑10~剑19 权威现行官方真题)');
  const [officialLastChecked, setOfficialLastChecked] = useState<string>('刚刚已同步');

  // Real-time Seasonal Live Feed state
  const [seasonalFeeds, setSeasonalFeeds] = useState<SeasonalFeedItem[]>([]);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState<boolean>(false);
  const [seasonLabel, setSeasonLabel] = useState<string>('2026 考季换题季');
  const [liveFeedSkill, setLiveFeedSkill] = useState<'all' | 'reading' | 'listening'>('all');
  const [lastFeedRefreshedTime, setLastFeedRefreshedTime] = useState<string>('刚刚');
  const [feedSearchQuery, setFeedSearchQuery] = useState<string>('');

  // Exam Timeline (考场时间轴动态流) State
  const [timelineSessions, setTimelineSessions] = useState<ExamTimelineSession[]>(EXAM_TIMELINE_SESSIONS);
  const [timelineRegionFilter, setTimelineRegionFilter] = useState<'all' | 'asia_pacific' | 'mainland_china' | 'global'>('all');
  const [timelineViewMode, setTimelineViewMode] = useState<'timeline' | 'feed-list'>('timeline');
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(new Set(['session-2026-08-29-ap']));

  // Official Volume In-Tab Instant Search State
  const [volumeSearchQuery, setVolumeSearchQuery] = useState<string>('');
  const [isVolumeSearchOpen, setIsVolumeSearchOpen] = useState<boolean>(false);

  // Web search compile state
  const [webQuery, setWebQuery] = useState<string>(initialQuery || '');
  const [isSearchingWeb, setIsSearchingWeb] = useState<boolean>(false);
  const [searchingStep, setSearchingStep] = useState<number>(1);
  const [compiledVolume, setCompiledVolume] = useState<IELTSVolume | null>(null);
  const [foundRealArticles, setFoundRealArticles] = useState<Array<{
    title: string;
    url: string;
    snippet: string;
    source?: string;
  }>>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchNotFound, setSearchNotFound] = useState<{
    query: string;
    message: string;
    hint?: string;
    suggestedQueries?: string[];
  } | null>(null);

  const effectiveFoundArticles = useMemo(() => {
    if (foundRealArticles && foundRealArticles.length > 0) return foundRealArticles;
    if (compiledVolume?.sources && compiledVolume.sources.length > 0) {
      return compiledVolume.sources.map(s => ({
        title: s.title,
        url: s.url,
        snippet: s.snippet || '',
        source: s.domain
      }));
    }
    return [];
  }, [foundRealArticles, compiledVolume]);

  // Live DB queries
  const allDbWords = useLiveQuery(() => db.words.toArray()) || [];
  const customPassages = useLiveQuery(() => db.customPassages.toArray()) || [];
  const customListening = useLiveQuery(() => db.customListening.toArray()) || [];

  const userWordStrings = useMemo(() => allDbWords.map(w => w.word.toLowerCase()), [allDbWords]);
  const savedPassageIds = useMemo(() => new Set(customPassages.map(p => p.id)), [customPassages]);
  const savedListeningIds = useMemo(() => new Set(customListening.map(s => s.id)), [customListening]);

  // Instant keyword search across all official Cambridge volumes (剑10 ~ 剑19) with bilingual expansion & relevance ranking
  const officialSearchResults = useMemo(() => {
    const q = volumeSearchQuery.trim();
    if (!q) return null;

    const tokens = expandSearchTokens(q);
    const matchingPassages: Array<{ volume: IELTSVolume; testNum: number; passage: CambridgePassage; score: number }> = [];
    const matchingListening: Array<{ volume: IELTSVolume; testNum: number; section: IELTSListeningSection; score: number }> = [];

    const seenPassageIds = new Set<string>();
    const seenListeningIds = new Set<string>();

    for (const vol of cloudOfficialVolumes) {
      for (const test of vol.tests) {
        for (const p of test.readingPassages || []) {
          if (seenPassageIds.has(p.id)) continue;
          const score = calculateRelevanceScore(p, tokens);
          const hasMatch = score > 0 || matchesSearchTokens(
            `${p.title} ${p.subtitle || ''} ${p.category || ''} ${p.cambridgeBook || ''} ${(p.keyVocab || []).join(' ')} ${p.text || ''}`,
            tokens
          );
          if (hasMatch) {
            seenPassageIds.add(p.id);
            matchingPassages.push({ volume: vol, testNum: test.testNum, passage: p, score: Math.max(score, 10) });
          }
        }
        for (const s of test.listeningSections || []) {
          if (seenListeningIds.has(s.id)) continue;
          const score = calculateRelevanceScore({
            title: s.title,
            category: s.scenario,
            keyVocab: s.keyVocab,
            text: s.scriptParagraphs ? s.scriptParagraphs.map(sp => sp.text).join(' ') : ''
          }, tokens);
          const hasMatch = score > 0 || matchesSearchTokens(
            `${s.title} ${s.scenario || ''} ${s.speakerRole || ''} ${s.cambridgeBook || ''} ${(s.keyVocab || []).join(' ')}`,
            tokens
          );
          if (hasMatch) {
            seenListeningIds.add(s.id);
            matchingListening.push({ volume: vol, testNum: test.testNum, section: s, score: Math.max(score, 10) });
          }
        }
      }
    }

    matchingPassages.sort((a, b) => b.score - a.score);
    matchingListening.sort((a, b) => b.score - a.score);

    const filteredPassages = skillFilter === 'listening' ? [] : matchingPassages;
    const filteredListening = skillFilter === 'reading' ? [] : matchingListening;

    return {
      passages: filteredPassages,
      listening: filteredListening,
      totalCount: filteredPassages.length + filteredListening.length,
      allPassagesCount: matchingPassages.length,
      allListeningCount: matchingListening.length
    };
  }, [cloudOfficialVolumes, volumeSearchQuery, skillFilter]);

  // Combine built-in, cloud-synced and online custom compiled volumes (deduplicated)
  const allVolumes = useMemo(() => {
    const list = [...cloudOfficialVolumes];
    if (compiledVolume && !list.some(v => v.id === compiledVolume.id)) {
      list.unshift(compiledVolume);
    }
    const seen = new Set<string>();
    return list.filter(v => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  }, [cloudOfficialVolumes, compiledVolume]);

  const activeVolume = useMemo(() => {
    return allVolumes.find(v => v.id === selectedVolumeId) || allVolumes[0];
  }, [allVolumes, selectedVolumeId]);

  // Dynamically compute tests that contain content in the active volume
  const availableTests = useMemo(() => {
    if (!activeVolume?.tests) return [];
    const valid = activeVolume.tests.filter(t => 
      (t.readingPassages && t.readingPassages.length > 0) || 
      (t.listeningSections && t.listeningSections.length > 0)
    );
    return valid.length > 0 ? valid : activeVolume.tests;
  }, [activeVolume]);

  // Keep selectedTestNum valid when switching volumes
  useEffect(() => {
    if (availableTests.length > 0) {
      if (!availableTests.some(t => t.testNum === selectedTestNum)) {
        setSelectedTestNum(availableTests[0].testNum);
      }
    }
  }, [availableTests, selectedTestNum]);

  const getShortBookLabel = (vol: IELTSVolume) => {
    if (vol.volumeNumber) {
      if (vol.volumeNumber <= 30) return `剑 ${vol.volumeNumber}`;
      if (vol.volumeNumber === 2026 || vol.volumeNumber === 2025 || vol.volumeNumber === 2024) return '26机经';
      return `${vol.volumeNumber}卷`;
    }
    return vol.bookTitle.replace(/剑桥雅思(官方)?真题集?\s*/, '剑').replace(/\(.*\)/, '').trim() || vol.bookTitle;
  };

  const getFullBookLabel = (vol: IELTSVolume) => {
    if (vol.volumeNumber) {
      if (vol.volumeNumber <= 30) {
        if (vol.volumeNumber === 19) return `剑桥雅思真题 19 (最新官方)`;
        return `剑桥雅思真题 ${vol.volumeNumber}`;
      }
      if (vol.volumeNumber === 2026 || vol.volumeNumber === 2025 || vol.volumeNumber === 2024) return '2026 考场真题机经';
      return `${vol.volumeNumber} 试题卷`;
    }
    return vol.bookTitle.replace(/\(.*\)/, '').trim() || vol.bookTitle;
  };

  const volumeStatuses = useMemo(() => {
    const map: Record<string, ReturnType<typeof getVolumeImportStatus>> = {};
    allVolumes.forEach(vol => {
      map[vol.id] = getVolumeImportStatus(vol, customPassages, customListening);
    });
    return map;
  }, [allVolumes, customPassages, customListening]);

  // Sync official volumes from server (with client-side fallback)
  const syncOfficialVolumes = async (isManual = false) => {
    setIsSyncingOfficial(true);
    let loadedFromServer = false;
    try {
      if (!Capacitor.isNativePlatform() && navigator.onLine) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch('/api/ielts/official-volumes', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.syncLabel) setOfficialSyncLabel(data.syncLabel);
          if (data.volumes && Array.isArray(data.volumes) && data.volumes.length > 0) {
            setCloudOfficialVolumes(data.volumes);
            loadedFromServer = true;
          }
        }
      }
    } catch {
      // Fallback to local official volumes
    } finally {
      if (!loadedFromServer) {
        setCloudOfficialVolumes(prev => (prev && prev.length > 0 ? prev : OFFICIAL_IELTS_VOLUMES));
        setOfficialSyncLabel('官方剑桥雅思全套真题集 (已校准至剑19)');
      }
      setOfficialLastChecked(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
      setIsSyncingOfficial(false);
      if (isManual) {
        showToast('已同步最新官方真题（剑10~剑19权威现行官方真题全集）');
      }
    }
  };

  // Fetch real-time seasonal exam feed (with client-side offline fallback)
  const fetchSeasonalFeed = async (isManual = false, query = '', region = timelineRegionFilter) => {
    setIsLoadingFeeds(true);
    const startTime = Date.now();
    let loadedFromServer = false;
    try {
      if (!Capacitor.isNativePlatform() && navigator.onLine) {
        const qParam = query.trim() ? `&q=${encodeURIComponent(query.trim())}` : '';
        const rParam = region ? `&region=${region}` : '';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`/api/ielts/live-seasonal-feed?_t=${Date.now()}${qParam}${rParam}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.feeds) {
            setSeasonalFeeds(data.feeds);
            setSeasonLabel(data.seasonLabel || '2026 考季换题季');
          }
          if (data.examTimeline && Array.isArray(data.examTimeline) && data.examTimeline.length > 0) {
            setTimelineSessions(data.examTimeline);
            loadedFromServer = true;
          }
        }
      }
    } catch (err) {
      // Graceful client fallback
    }

    if (!loadedFromServer) {
      setSeasonLabel('2026 考季换题季');
      setTimelineSessions(EXAM_TIMELINE_SESSIONS);
      setSeasonalFeeds([
        {
          id: query ? `seasonal-client-${Date.now()}` : 'seasonal-2026-latest',
          title: query ? `2026 实时考场机经 ·「${query}」回忆专项` : `2026 最新考季 · 亚太与大陆考场最新回忆真卷`,
          season: query ? `实时联网追踪 ·「${query}」考场考题` : `2026 考季换题季 · 本周考场回忆高频原题`,
          updateTime: '今日最新同步',
          hotScore: '99.6% 命中率',
          category: '考场全真大卷 (40+40题标准配比)',
          readingCount: IELTS_2026_AUTUMN_RECALL_VOLUME.tests[0]?.readingPassages?.length || 3,
          listeningCount: 4,
          description: query
            ? `实时全网追踪「${query}」在 2026 亚太与大陆考场出现的真题回忆长文、词汇考点与权威精析。`
            : '实时追踪 2026 考季换题季最新真题（深海生物发光、传统波斯风塔热力学、脑波振荡与语言习得）与听力 Section 1~4 全真原声精析。',
          tests: IELTS_2026_AUTUMN_RECALL_VOLUME.tests
        }
      ]);
    }

    // Ensure at least 350ms loading so user perceives refresh feedback
    const elapsed = Date.now() - startTime;
    if (elapsed < 350) {
      await new Promise(r => setTimeout(r, 350 - elapsed));
    }
    const nowStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastFeedRefreshedTime(nowStr);
    setIsLoadingFeeds(false);
    if (isManual) {
      showToast(query ? `已检索「${query}」考场机经回忆` : `已刷新考场回忆真题库（${nowStr} 最新同步）`);
    }
  };

  // Filtered Exam Timeline Sessions
  const filteredTimelineSessions = useMemo(() => {
    return filterExamTimeline(timelineSessions, timelineRegionFilter, feedSearchQuery);
  }, [timelineSessions, timelineRegionFilter, feedSearchQuery]);

  const toggleSessionExpanded = (sessionId: string) => {
    setExpandedSessionIds(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const handleLaunchTimelineSession = (session: ExamTimelineSession) => {
    const vol = buildVolumeFromTimelineSession(session);
    if (vol.tests[0]?.readingPassages?.[0]) {
      handleLaunchReading(vol.tests[0].readingPassages[0], true);
      showToast(`已加载 ${session.dateLabel} ${session.regionBadge} 全真模考`);
    }
  };

  const handleLaunchTimelinePassage = (session: ExamTimelineSession, passageNum: number) => {
    const vol = buildVolumeFromTimelineSession(session);
    const p = vol.tests[0]?.readingPassages?.[passageNum - 1];
    if (p) {
      handleLaunchReading(p, true);
    }
  };

  const handleLaunchTimelineListening = (session: ExamTimelineSession, sectionNum: number) => {
    const vol = buildVolumeFromTimelineSession(session);
    const s = vol.tests[0]?.listeningSections?.[sectionNum - 1];
    if (s) {
      handleLaunchListening(s);
    }
  };

  const handleImportTimelineSession = async (session: ExamTimelineSession) => {
    setImportingVolumeId(session.id);
    try {
      const vol = buildVolumeFromTimelineSession(session);
      await handleImportEntireVolume(vol);
      showToast(`已收录 ${session.dateLabel} 全套试题`);
    } catch {
      showToast('收录失败，请重试');
    } finally {
      setImportingVolumeId(null);
    }
  };

  useEffect(() => {
    if (effectiveIsOpen) {
      const targetSkill = initialSkill || storeInitialSkill;
      if (targetSkill) {
        setSkillFilter(targetSkill);
      }
      const targetQuery = (initialQuery || storeInitialQuery || '').trim();
      if (targetQuery) {
        setActiveTab('web-search');
        setFeedSearchQuery(targetQuery);
        setIsVolumeSearchOpen(true);
        setWebQuery(targetQuery);
        handleSearchAndCompile(targetQuery);
      } else {
        setActiveTab('live-feed');
        setIsVolumeSearchOpen(false);
      }
      syncOfficialVolumes(false);
      if (seasonalFeeds.length === 0) {
        fetchSeasonalFeed();
      }
    }
  }, [effectiveIsOpen, initialSkill, storeInitialSkill, initialQuery, storeInitialQuery]);

  // Add / Remove single items
  const handleAddPassage = async (p: CambridgePassage) => {
    try {
      await saveCustomPassage(p);
      showToast(`已添加《${p.title}》到题库`);
    } catch {
      showToast('添加失败，请重试');
    }
  };

  const handleRemovePassage = async (id: string, title?: string) => {
    try {
      await deleteCustomPassage(id);
      showToast(`已移出《${title || '阅读篇章'}》`);
    } catch {
      showToast('移出失败');
    }
  };

  const handleAddListening = async (s: IELTSListeningSection) => {
    try {
      await saveCustomListeningSection(s);
      showToast(`已添加听力《${s.title}》到题库`);
    } catch {
      showToast('添加失败，请重试');
    }
  };

  const handleRemoveListening = async (id: string, title?: string) => {
    try {
      await deleteCustomListeningSection(id);
      showToast(`已移出《${title || '听力篇章'}》`);
    } catch {
      showToast('移出失败');
    }
  };

  // One-click import current test
  const handleImportCurrentTest = async () => {
    if (!activeVolume) return;
    const currentTest = activeVolume.tests.find(t => t.testNum === selectedTestNum);
    if (!currentTest) return;

    const testKey = `${activeVolume.id}-test-${selectedTestNum}`;
    setImportingTestKey(testKey);

    try {
      await saveCustomPassagesBulk(currentTest.readingPassages);
      await saveCustomListeningBulk(currentTest.listeningSections);
      showToast(`已导入《${getShortBookLabel(activeVolume)}》Test ${selectedTestNum} (共 7 篇)`);
    } catch {
      showToast('导入失败，请稍后重试');
    } finally {
      setImportingTestKey(null);
    }
  };

  // Import entire volume
  const handleImportEntireVolume = async (volume: IELTSVolume) => {
    setImportingVolumeId(volume.id);
    const passages = getVolumeAllPassages(volume);
    const listening = getVolumeAllListening(volume);

    try {
      await saveCustomPassagesBulk(passages);
      await saveCustomListeningBulk(listening);
      showToast(`已导入《${getShortBookLabel(volume)}》全册 (共 28 篇)`);
    } catch {
      showToast('导入失败，请稍后重试');
    } finally {
      setImportingVolumeId(null);
    }
  };

  // Import entire seasonal feed item
  const handleImportSeasonalFeed = async (feed: SeasonalFeedItem) => {
    setImportingVolumeId(feed.id);
    try {
      const allP = feed.tests.flatMap(t => t.readingPassages);
      const allL = feed.tests.flatMap(t => t.listeningSections);
      await saveCustomPassagesBulk(allP);
      await saveCustomListeningBulk(allL);
      showToast(`已收录《${feed.title}》全部真题`);
    } catch {
      showToast('收录失败，请重试');
    } finally {
      setImportingVolumeId(null);
    }
  };

  // Helper to construct high-fidelity dynamic IELTS volume with official 40-question standards
  const buildClientDynamicVolume = (query: string): IELTSVolume => {
    return buildStandard40QuestionVolume(query, userWordStrings);
  };

  // Search & compile real-time exam volume
  const handleSearchAndCompile = async (queryText?: string) => {
    const q = (queryText || webQuery).trim();
    if (!q) return;

    setWebQuery(q);
    setSearchError(null);

    // 0. Strict check if the requested query is invalid, non-existent, or irrelevant (e.g. gaming, chat, 2078, 剑25, etc.)
    const validation = checkIELTSQueryExists(q);
    if (!validation.isValid) {
      setCompiledVolume(null);
      setFoundRealArticles([]);
      setIsSearchingWeb(false);
      setSearchNotFound({
        query: q,
        message: validation.message || '未找到该试卷',
        hint: validation.hint || '官方剑桥雅思真题集权威出版至《剑19》，考场机经回忆已全面同步至 2026 当前考季。',
        suggestedQueries: validation.suggestedQueries
      });
      return;
    }

    // 1. Direct matching for official Cambridge volumes (e.g. 剑19, 剑雅18, Cambridge 17, 19, etc.)
    const cambridgeNumMatch = q.match(/(?:剑|cambridge|剑雅|c)\s*([0-9]{1,3})/i) || (q.match(/^([0-9]{1,2})$/) ? q.match(/^([0-9]{1,2})$/) : null);
    if (cambridgeNumMatch) {
      const volNum = parseInt(cambridgeNumMatch[1], 10);
      if (volNum > 19) {
        setCompiledVolume(null);
        setFoundRealArticles([]);
        setIsSearchingWeb(false);
        setSearchNotFound({
          query: q,
          message: `未找到《剑桥雅思 ${volNum}》`,
          hint: `剑桥大学出版社官方全真试题集目前最新权威出版至《剑桥雅思 19》，尚未出版《剑 ${volNum}》。`
        });
        return;
      }
      const existingVol = cloudOfficialVolumes.find(v => v.volumeNumber === volNum) || OFFICIAL_IELTS_VOLUMES.find(v => v.volumeNumber === volNum);
      if (existingVol) {
        setSearchNotFound(null);
        setCompiledVolume(existingVol);
        setSelectedVolumeId(existingVol.id);
        setActiveTab('web-search');
        setIsSearchingWeb(false);
        const cleanTitle = existingVol.bookTitle.replace(/^[《<]+|[》>]+$/g, '');
        showToast(`已找到官方真题《${cleanTitle}》`);
        return;
      }
    }

    setIsSearchingWeb(true);
    setSearchNotFound(null);
    setSearchingStep(1);

    const t1 = setTimeout(() => setSearchingStep(2), 600);
    const t2 = setTimeout(() => setSearchingStep(3), 1200);

    let result: any = null;
    try {
      if (!Capacitor.isNativePlatform() && navigator.onLine) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch('/api/ielts/compile-full-volume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            query: q,
            userVocabulary: userWordStrings.slice(0, 30)
          })
        });

        clearTimeout(timeoutId);
        if (res.ok) {
          result = await res.json();
        }
      }
    } catch (err: any) {
      console.warn('Network volume compile unreachable or failed, falling back to local client search engine:', err);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
    }

    // Seamless Client-Side Search Fallback (Zero network dependency, 100% offline APK support)
    if (!result || !result.success) {
      const clientRes = searchAndCompileIeltsVolumeClient(q, userWordStrings);
      result = clientRes;
    }

    if (result && result.success && result.volume) {
      const newVol = result.volume as IELTSVolume;
      if (result.articles || result.foundArticles) {
        setFoundRealArticles(result.articles || result.foundArticles);
      } else {
        setFoundRealArticles([]);
      }
      setSearchNotFound(null);
      setCompiledVolume(newVol);
      setSelectedVolumeId(newVol.id);
      setCloudOfficialVolumes(prev => {
        if (prev.some(v => v.id === newVol.id)) return prev;
        return [newVol, ...prev];
      });
      setActiveTab('web-search');
      const cleanTitle = newVol.bookTitle.replace(/^[《<]+|[》>]+$/g, '');
      showToast(`已装订并就绪《${cleanTitle}》`);
    } else {
      setCompiledVolume(null);
      setFoundRealArticles([]);
      setSearchNotFound({
        query: q,
        message: result?.message || `未在雅思官方全真题库中收录「${q}」`,
        hint: result?.hint || '官方剑桥真题出版至剑19，机经覆盖至 2026 当前考季。您可以直接从官方真题库中挑选做题。',
        suggestedQueries: result?.suggestedQueries
      });
    }
    setIsSearchingWeb(false);
  };

  const isCurrentVolumeImported = activeVolume ? volumeStatuses[activeVolume.id]?.isFullyImported : false;

  return (
    <AnimatePresence>
      {effectiveIsOpen && (
          <motion.div
          id="online-ielts-volume-modal-root"
          key="online-ielts-screen"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 18 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-50 flex flex-col bg-[#FAF7F2] dark:bg-[#0F0E0D] text-[#1C1917] dark:text-[#F5F2EB] overflow-hidden select-none pointer-events-auto"
        >
            {/* 1. Serene App Header (Aligned 1:1 with TopHeader in IELTSHubView) */}
            <header className="relative w-full z-30 pt-[var(--android-safe-top,max(3.25rem,calc(env(safe-area-inset-top,44px)+0.85rem)))] pb-2 px-5 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="w-9 h-9 -ml-1.5 rounded-full flex items-center justify-center text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-500/10 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer group"
                title="返回雅思主界面"
                aria-label="返回雅思主界面"
              >
                <ArrowLeft className="w-4.5 h-4.5 group-hover:-translate-x-0.5 transition-transform" />
              </button>

              <span className="text-[#78716C] dark:text-stone-400 text-xs font-serif-luxury font-bold tracking-[0.2em] select-none truncate">
                淘题与新题入库
              </span>

              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'web-search') {
                    const el = document.getElementById('online-volume-query-input');
                    el?.focus();
                    return;
                  }
                  if (isVolumeSearchOpen) {
                    setFeedSearchQuery('');
                  }
                  setIsVolumeSearchOpen(!isVolumeSearchOpen);
                }}
                className={`w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isVolumeSearchOpen || feedSearchQuery
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-900/[0.05] dark:hover:bg-white/[0.06] hover:text-stone-900 dark:hover:text-white'
                }`}
                title="检索机经或真题"
              >
                <Search className="w-4 h-4" />
              </button>
            </header>

            {/* 2. Pure Editorial Masthead Row (Only 2 Incremental Source Tabs on Left + Reading/Listening Toggle on Right) */}
            <div className="px-5 shrink-0 z-20 space-y-2.5">
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-stone-900/[0.08] dark:border-white/[0.08]">
                <div className="flex items-center gap-6">
                  {[
                    { id: 'live-feed', label: '考季机经' },
                    { id: 'web-search', label: '全网搜卷' },
                    {
                      id: 'my-library',
                      label: `馆藏${customPassages.length + customListening.length > 0 ? ` (${customPassages.length + customListening.length})` : ''}`
                    },
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id as 'live-feed' | 'web-search' | 'my-library');
                          setIsModalScrolled(false);
                        }}
                        className={`relative py-1 text-sm transition-colors cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'text-stone-900 dark:text-white font-bold'
                            : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium'
                        }`}
                      >
                        <span>{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="online-modal-masthead-underline"
                            className="absolute left-0 right-0 -bottom-[9px] h-[2px] bg-stone-900 dark:bg-white rounded-full"
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right: Quiet Unboxed Skill Switch (阅读 · 听力 — applies to both tabs) */}
                <div className="flex items-center gap-2 text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSkillFilter('reading');
                      setLiveFeedSkill('reading');
                    }}
                    className={`cursor-pointer transition-colors ${
                      skillFilter === 'reading'
                        ? 'text-stone-900 dark:text-white font-bold'
                        : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                    }`}
                  >
                    阅读
                  </button>
                  <span className="text-stone-300 dark:text-stone-700">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSkillFilter('listening');
                      setLiveFeedSkill('listening');
                    }}
                    className={`cursor-pointer transition-colors ${
                      skillFilter === 'listening'
                        ? 'text-stone-900 dark:text-white font-bold'
                        : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                    }`}
                  >
                    听力
                  </button>
                </div>
              </div>

              {/* Unified Collapsible Search Drawer for Live Feed & My Library */}
              <AnimatePresence initial={false}>
                {(activeTab === 'live-feed' || activeTab === 'my-library') && (isVolumeSearchOpen || Boolean(feedSearchQuery.trim())) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.16 }}
                    className="overflow-hidden pb-1"
                  >
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 absolute left-3.5 text-stone-400 pointer-events-none" />
                      <input
                        type="text"
                        value={feedSearchQuery}
                        onChange={(e) => setFeedSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && activeTab === 'live-feed') {
                            fetchSeasonalFeed(true, feedSearchQuery, timelineRegionFilter);
                          }
                        }}
                        placeholder={
                          activeTab === 'my-library'
                            ? '在个人馆藏中筛选话题、标题或考次...'
                            : '检索当季机经话题、题型或考场日期（如：座头鲸、深海热泉、8月）...'
                        }
                        className="w-full pl-9 pr-16 py-2 text-xs rounded-2xl bg-[#FDFBF7] dark:bg-white/[0.06] border border-stone-900/[0.08] dark:border-white/[0.08] focus:outline-none focus:border-stone-900/25 dark:focus:border-white/25 text-stone-800 dark:text-stone-200 placeholder:text-stone-400"
                      />
                      {feedSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setFeedSearchQuery('');
                            if (activeTab === 'live-feed') {
                              fetchSeasonalFeed(true, '', timelineRegionFilter);
                            }
                          }}
                          className="absolute right-2.5 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            {/* TAB 1: Live Seasonal Exam Recall (考季机经 — 专属「考场日历批次卡片」：左栏台历存根 + 右栏象牙纸勾选清单) */}
            {activeTab === 'live-feed' && (() => {
              const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

              return (
                <div
                  onScroll={(e) => {
                    const next = e.currentTarget.scrollTop > 8;
                    if (next !== isModalScrolled) setIsModalScrolled(next);
                  }}
                  style={{
                    maskImage: isModalScrolled
                      ? 'linear-gradient(to bottom, transparent 0%, black 18px, black calc(100% - 24px), transparent 100%)'
                      : 'linear-gradient(to bottom, black 0%, black calc(100% - 24px), transparent 100%)',
                    WebkitMaskImage: isModalScrolled
                      ? 'linear-gradient(to bottom, transparent 0%, black 18px, black calc(100% - 24px), transparent 100%)'
                      : 'linear-gradient(to bottom, black 0%, black calc(100% - 24px), transparent 100%)'
                  }}
                  className="flex-1 overflow-y-auto overscroll-contain px-5 pt-3.5 pb-24 no-scrollbar"
                >
                  <div className="max-w-2xl mx-auto space-y-4">
                    {/* Layer 1: Recessed Region Filter Tray + Unsaved Filter Toggle & Sync */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {/* Left: Recessed Region Tray */}
                      <div className="p-0.5 rounded-xl bg-stone-900/[0.05] dark:bg-white/[0.06] flex items-center gap-0.5 shrink-0">
                        {[
                          { id: 'all', label: '全部' },
                          { id: 'asia_pacific', label: '亚太' },
                          { id: 'mainland_china', label: '大陆' },
                          { id: 'global', label: '全球' }
                        ].map((reg) => {
                          const isActive = timelineRegionFilter === reg.id;
                          return (
                            <button
                              key={reg.id}
                              type="button"
                              onClick={() => {
                                const newReg = reg.id as any;
                                setTimelineRegionFilter(newReg);
                                fetchSeasonalFeed(false, feedSearchQuery, newReg);
                              }}
                              className={`h-7 px-2.5 rounded-[10px] text-xs cursor-pointer transition-all whitespace-nowrap ${
                                isActive
                                  ? 'bg-[#FDFBF7] dark:bg-stone-800 text-stone-900 dark:text-white font-bold shadow-2xs'
                                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-medium'
                              }`}
                            >
                              {reg.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Right: New Topic Toggle + Only Unsaved Toggle + Sync Button */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setOnlyNewTopics(!onlyNewTopics)}
                          className={`h-7 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap border ${
                            onlyNewTopics
                              ? 'bg-amber-700 text-[#FAF7F2] dark:bg-amber-500 dark:text-stone-950 border-amber-700 dark:border-amber-500 shadow-2xs'
                              : 'bg-[#FDFBF7] dark:bg-white/[0.04] text-stone-600 dark:text-stone-300 border-stone-900/[0.08] dark:border-white/[0.08] hover:text-stone-900 dark:hover:text-white'
                          }`}
                        >
                          <span>新题首发</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setOnlyUnsaved(!onlyUnsaved)}
                          className={`h-7 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap border ${
                            onlyUnsaved
                              ? 'bg-stone-900 text-[#FAF7F2] dark:bg-white dark:text-stone-900 border-stone-900 dark:border-white shadow-2xs'
                              : 'bg-[#FDFBF7] dark:bg-white/[0.04] text-stone-600 dark:text-stone-300 border-stone-900/[0.08] dark:border-white/[0.08] hover:text-stone-900 dark:hover:text-white'
                          }`}
                        >
                          <span>仅看未收</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fetchSeasonalFeed(true, feedSearchQuery, timelineRegionFilter)}
                          disabled={isLoadingFeeds}
                          className="w-7 h-7 rounded-xl bg-[#FDFBF7] dark:bg-white/[0.04] border border-stone-900/[0.08] dark:border-white/[0.08] flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer transition-all"
                          title="同步最新实考回忆"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFeeds ? 'animate-spin text-stone-900 dark:text-white' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Active Search Indicator */}
                    {feedSearchQuery.trim() && (
                      <div className="px-4 py-2 rounded-2xl bg-[#FDFBF7] dark:bg-white/[0.04] border border-stone-900/[0.08] dark:border-white/[0.08] flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
                        <span>
                          当前筛选：<strong className="text-stone-900 dark:text-white">{feedSearchQuery}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFeedSearchQuery('');
                            fetchSeasonalFeed(true, '', timelineRegionFilter);
                          }}
                          className="text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                        >
                          清除 ×
                        </button>
                      </div>
                    )}

                    {/* Main Exam Calendar Batch Cards Stream */}
                    {isLoadingFeeds ? (
                      <div className="py-20 flex flex-col items-center justify-center space-y-2 text-stone-400">
                        <Loader2 className="w-5 h-5 animate-spin text-stone-600 dark:text-stone-300" />
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          正在同步近期实考场次与题目清单...
                        </p>
                      </div>
                    ) : filteredTimelineSessions.length === 0 ? (
                      <div className="p-12 rounded-[24px] bg-[#FDFBF7] dark:bg-[#141822] border border-stone-900/[0.08] dark:border-white/[0.08] text-center space-y-2.5">
                        <p className="text-sm font-serif-luxury text-stone-700 dark:text-stone-200">
                          未检索到匹配的实考场次
                        </p>
                        <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                          {feedSearchQuery.trim() && (
                            <button
                              type="button"
                              onClick={() => {
                                const q = feedSearchQuery.trim();
                                setActiveTab('web-search');
                                setWebQuery(q);
                                handleSearchAndCompile(q);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#516050] text-white text-xs font-semibold cursor-pointer hover:bg-[#3F4C3E] transition-colors"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span>去全网题库检索「{feedSearchQuery.trim()}」</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setFeedSearchQuery('');
                              setTimelineRegionFilter('all');
                              setOnlyUnsaved(false);
                              fetchSeasonalFeed(true, '', 'all');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-[#FAF7F2] dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold cursor-pointer"
                          >
                            重置筛选条件
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredTimelineSessions.map((session, sIndex) => {
                          const sessionVol = buildVolumeFromTimelineSession(session);
                          const sessionReadings = sessionVol.tests[0]?.readingPassages || [];
                          const sessionListenings = sessionVol.tests[0]?.listeningSections || [];

                          // Parse calendar date (e.g. "2026-08-29")
                          const dateParts = (session.examDate || '2026-08-29').split('-');
                          const yearStr = dateParts[0] || '2026';
                          const monthIdx = Math.max(0, Math.min(11, parseInt(dateParts[1] || '8', 10) - 1));
                          const monthStr = MONTH_ABBR[monthIdx];
                          const dayStr = (dateParts[2] || '29').padStart(2, '0');
                          const weekdayMatch = session.dateLabel.match(/[(（](周[一二三四五六日天])[)）]/);
                          const weekdayStr = weekdayMatch ? weekdayMatch[1] : '周六';

                          const regionTitle =
                            session.region === 'asia_pacific'
                              ? '亚太考区'
                              : session.region === 'mainland_china'
                              ? '大陆考区'
                              : '全球考区';
                          const regionCities = session.regionBadge.includes('·')
                            ? session.regionBadge.split('·')[1].trim()
                            : session.regionBadge;

                          // Calculate saved status for the current skill
                          const totalItemsCount =
                            skillFilter === 'reading' ? sessionReadings.length : sessionListenings.length;
                          const savedItemsCount =
                            skillFilter === 'reading'
                              ? sessionReadings.filter((p) => savedPassageIds.has(p.id)).length
                              : sessionListenings.filter((s) => savedListeningIds.has(s.id)).length;
                          const unsavedCount = Math.max(0, totalItemsCount - savedItemsCount);
                          const isAllSaved = totalItemsCount > 0 && unsavedCount === 0;
                          const isImportingThisSession = importingVolumeId === session.id;

                          // Filter items if onlyUnsaved or onlyNewTopics is toggled
                          const visibleReadingIndices = session.readingPassages
                            .map((rp, idx) => ({ rp, idx }))
                            .filter(({ rp, idx }) => {
                              const pNum = rp.passageNum || idx + 1;
                              const isNewTopic = (sIndex === 0 && pNum === 1) || (sIndex === 1 && pNum === 3) || Boolean(session.isLatest && pNum === 1);
                              if (onlyNewTopics && !isNewTopic) return false;
                              if (!onlyUnsaved) return true;
                              const fullP = sessionReadings[idx];
                              return fullP ? !savedPassageIds.has(fullP.id) : true;
                            })
                            .map(({ idx }) => idx);

                          const visibleListeningIndices = session.listeningSections
                            .map((ls, idx) => ({ ls, idx }))
                            .filter(({ ls, idx }) => {
                              const sNum = ls.sectionNum || idx + 1;
                              const isNewTopic = (sIndex === 0 && sNum === 4) || Boolean(session.isLatest && sNum === 1);
                              if (onlyNewTopics && !isNewTopic) return false;
                              if (!onlyUnsaved) return true;
                              const fullS = sessionListenings[idx];
                              return fullS ? !savedListeningIds.has(fullS.id) : true;
                            })
                            .map(({ idx }) => idx);

                          if (
                            (onlyUnsaved || onlyNewTopics) &&
                            ((skillFilter === 'reading' && visibleReadingIndices.length === 0) ||
                              (skillFilter === 'listening' && visibleListeningIndices.length === 0))
                          ) {
                            return null;
                          }

                          const monthNumStr = (dateParts[1] || '08').padStart(2, '0');

                          return (
                            <section
                              key={session.id}
                              className="rounded-[24px] bg-[#FDFBF7] dark:bg-stone-900/60 border border-stone-900/[0.07] dark:border-white/[0.08] p-5 shadow-[0_8px_24px_-12px_rgba(28,25,23,0.05)] space-y-3"
                            >
                              {/* Editorial Session Masthead: 2 Clean Full-Width Rows (Zero Column Collision) */}
                              <div className="space-y-1.5 pb-3 border-b border-stone-900/[0.08] dark:border-white/[0.08]">
                                {/* Row 1: Editorial Serif Date + Region Title on Left, Soft Sage Batch Action on Right */}
                                <div className="flex items-center justify-between gap-2 min-w-0">
                                  <div className="flex items-baseline gap-2 min-w-0">
                                    <h3 className="font-serif-luxury text-xl font-bold tracking-tight text-stone-900 dark:text-white tabular-nums shrink-0">
                                      {monthNumStr}月{dayStr}日
                                    </h3>
                                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-200 shrink-0">
                                      {regionTitle}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={isImportingThisSession}
                                    onClick={async () => {
                                      setImportingVolumeId(session.id);
                                      try {
                                        if (skillFilter === 'reading') {
                                          if (isAllSaved) {
                                            for (const p of sessionReadings) {
                                              await deleteCustomPassage(p.id);
                                            }
                                            showToast(`已将 ${session.dateLabel} 阅读篇目移出馆藏`);
                                          } else {
                                            await saveCustomPassagesBulk(sessionReadings);
                                            showToast(`已将 ${session.dateLabel} 全场 ${sessionReadings.length} 篇阅读收入馆藏`);
                                          }
                                        } else {
                                          if (isAllSaved) {
                                            for (const s of sessionListenings) {
                                              await deleteCustomListeningSection(s.id);
                                            }
                                            showToast(`已将 ${session.dateLabel} 听力篇目移出馆藏`);
                                          } else {
                                            await saveCustomListeningBulk(sessionListenings);
                                            showToast(`已将 ${session.dateLabel} 全场 ${sessionListenings.length} 节听力收入馆藏`);
                                          }
                                        }
                                      } finally {
                                        setImportingVolumeId(null);
                                      }
                                    }}
                                    className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                                      isAllSaved
                                        ? 'bg-[#516050]/15 text-[#516050] dark:text-[#8FB996]'
                                        : 'bg-[#516050]/[0.09] hover:bg-[#516050]/[0.16] text-[#516050] dark:bg-[#8FB996]/[0.12] dark:hover:bg-[#8FB996]/[0.2] dark:text-[#8FB996]'
                                    }`}
                                  >
                                    {isImportingThisSession ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : isAllSaved ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        <span>本场已全收</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3 h-3" />
                                        <span>整场入库 ({unsavedCount})</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Row 2: Full-Width Un-truncated Cities, Mode & Composition */}
                                <div className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 flex-wrap">
                                  {session.isLatest && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/12 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-600/25 shrink-0">
                                      最新首发
                                    </span>
                                  )}
                                  <span className="font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                    {monthStr} {yearStr} {weekdayStr}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-stone-500 dark:text-stone-400">{regionCities}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{session.mode}</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-stone-600 dark:text-stone-300 font-medium">
                                    {sIndex === 0 ? '1篇新题首发 · 2篇高频旧题' : '2篇高频母题 · 1篇经典复现'}
                                  </span>
                                </div>
                              </div>

                              {/* Editorial Passage Checklist Rows (Click Row for Recall Brief & Preview; Click Button for Ingestion) */}
                              <div className="w-full">
                                {skillFilter === 'reading' ? (
                                  <div className="divide-y divide-stone-900/[0.06] dark:divide-white/[0.06]">
                                    {visibleReadingIndices.map((idx) => {
                                      const rp = session.readingPassages[idx];
                                      const fullPassage = sessionReadings[idx];
                                      const pNum = rp.passageNum || idx + 1;
                                      const previewKey = `session-${session.id}-p-${pNum}`;
                                      const isExpanded = expandedPreviewId === previewKey;
                                      const isSaved = fullPassage ? savedPassageIds.has(fullPassage.id) : false;
                                      const meta = getPassageBilingualMeta({
                                        title: rp.title,
                                        category: rp.topicCategory,
                                        passageNumber: pNum,
                                        summary: rp.summary,
                                      });
                                      const disc = resolveDiscipline(meta.categoryZh || rp.topicCategory, rp.title);
                                      const cleanQTypes = (rp.questionTypes || [])
                                        .map((qt) => qt.replace(/\s*[(（].*?[)）]/g, '').trim())
                                        .join(' + ');
                                      const isNewTopic = (sIndex === 0 && pNum === 1) || (sIndex === 1 && pNum === 3);
                                      const keyVocabList = rp.coreKeywords || rp.keyVocab || [];
                                      const vocabHits = keyVocabList.filter((v) =>
                                        userWordStrings.includes(v.toLowerCase())
                                      );

                                      return (
                                        <div key={previewKey} className="py-3 first:pt-1 last:pb-0">
                                          <article
                                            onClick={() =>
                                              setExpandedPreviewId(isExpanded ? null : previewKey)
                                            }
                                            className="group transition-colors cursor-pointer flex items-start gap-3"
                                          >
                                            {/* Left Number + Discipline Dot */}
                                            <div className="w-9 shrink-0 pt-0.5 flex flex-col items-start">
                                              <div className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${disc.badgeDotClass}`} />
                                                <span className="font-serif-luxury text-lg font-bold leading-none text-stone-800 dark:text-stone-200 group-hover:text-[#516050] dark:group-hover:text-[#8FB996] transition-colors tabular-nums">
                                                  0{pNum}
                                                </span>
                                              </div>
                                              <span className="mt-1 text-[10px] font-mono tabular-nums text-stone-400 dark:text-stone-500">
                                                P{pNum}
                                              </span>
                                            </div>

                                            {/* Center Bilingual Title & Question Type Breakdown */}
                                            <div className="min-w-0 flex-1 space-y-1">
                                              <div className="flex items-center gap-1.5">
                                                <h4 className="text-[14.5px] font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#516050] dark:group-hover:text-[#8FB996] transition-colors leading-snug">
                                                  {meta.titleZh}
                                                </h4>
                                                <ChevronDown
                                                  className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform duration-200 ${
                                                    isExpanded ? 'rotate-180 text-[#516050] dark:text-[#8FB996]' : ''
                                                  }`}
                                                />
                                              </div>

                                              <p className="font-serif-luxury italic text-xs text-stone-500 dark:text-stone-400 truncate">
                                                {meta.titleEn}
                                              </p>

                                              {/* Unboxed Metadata: Discipline · Question Types · New/Old Status */}
                                              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 flex-wrap pt-0.5">
                                                <span className={`font-medium ${disc.accentTextClass}`}>
                                                  {disc.shortZh}
                                                </span>
                                                {cleanQTypes && (
                                                  <>
                                                    <span aria-hidden="true">·</span>
                                                    <span className="text-stone-600 dark:text-stone-300">
                                                      {cleanQTypes}
                                                    </span>
                                                  </>
                                                )}
                                                <span aria-hidden="true">·</span>
                                                <span
                                                  className={
                                                    isNewTopic
                                                      ? 'text-amber-700 dark:text-amber-400 font-medium'
                                                      : 'text-stone-400 dark:text-stone-500'
                                                  }
                                                >
                                                  {isNewTopic ? '2026新题首发' : '高频旧题'}
                                                </span>
                                                {vocabHits.length > 0 && (
                                                  <>
                                                    <span aria-hidden="true">·</span>
                                                    <span className="text-amber-700 dark:text-amber-400 font-medium font-mono">
                                                      共鸣 +{vocabHits.length} 词
                                                    </span>
                                                  </>
                                                )}
                                              </div>
                                            </div>

                                            {/* Right Ingestion Toggle Button (Decoupled from Row Expand) */}
                                            <div
                                              className="shrink-0 self-center pl-1"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (!fullPassage) return;
                                                if (isSaved) {
                                                  handleRemovePassage(fullPassage.id, meta.titleZh);
                                                } else {
                                                  handleAddPassage(fullPassage);
                                                }
                                              }}
                                            >
                                              <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                                                  isSaved
                                                    ? 'bg-[#516050]/14 text-[#516050] dark:text-[#8FB996]'
                                                    : 'text-stone-600 dark:text-stone-300 bg-stone-900/[0.04] dark:bg-white/[0.06] hover:bg-[#516050]/[0.12] hover:text-[#516050] dark:hover:text-[#8FB996]'
                                                }`}
                                              >
                                                {isSaved ? (
                                                  <>
                                                    <Check className="w-3 h-3" />
                                                    <span>已收录</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Plus className="w-3 h-3" />
                                                    <span>入库</span>
                                                  </>
                                                )}
                                              </span>
                                            </div>
                                          </article>

                                          {/* Expandable Exam Recall Brief & Instant Practice Drawer */}
                                          <AnimatePresence initial={false}>
                                            {isExpanded && (
                                              <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.16 }}
                                                className="overflow-hidden"
                                              >
                                                <div className="mt-2.5 ml-12 p-3 rounded-2xl bg-[#FAF7F2] dark:bg-white/[0.03] border border-stone-900/[0.06] dark:border-white/[0.06] space-y-2">
                                                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                                                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                                                      考场回忆提要：
                                                    </span>
                                                    {rp.summary || meta.gistZh}
                                                  </p>
                                                  {((rp.coreKeywords || rp.keyVocab || []).length > 0) && (
                                                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                                      <span className="text-stone-400 dark:text-stone-500">
                                                        核心考点词：
                                                      </span>
                                                      {(rp.coreKeywords || rp.keyVocab || []).map((word) => {
                                                        const isHit = userWordStrings.includes(word.toLowerCase());
                                                        return (
                                                          <span
                                                            key={word}
                                                            className={`font-mono px-1.5 py-0.5 rounded-md ${
                                                              isHit
                                                                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold'
                                                                : 'bg-stone-900/[0.04] dark:bg-white/[0.06] text-stone-600 dark:text-stone-300'
                                                            }`}
                                                          >
                                                            {word}
                                                          </span>
                                                        );
                                                      })}
                                                    </div>
                                                  )}
                                                  <div className="pt-1 flex items-center justify-end gap-2">
                                                    {fullPassage && (
                                                      <button
                                                        type="button"
                                                        onClick={() => handleLaunchReading(fullPassage, false)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#516050] text-white hover:bg-[#3F4C3E] transition-colors cursor-pointer"
                                                      >
                                                        <span>立即试做本篇</span>
                                                        <ArrowRight className="w-3 h-3" />
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="divide-y divide-stone-900/[0.06] dark:divide-white/[0.06]">
                                    {visibleListeningIndices.map((idx) => {
                                      const ls = session.listeningSections[idx];
                                      const fullSection = sessionListenings[idx];
                                      const sNum = ls.sectionNum || idx + 1;
                                      const previewKey = `session-${session.id}-s-${sNum}`;
                                      const isExpanded = expandedPreviewId === previewKey;
                                      const isSaved = fullSection ? savedListeningIds.has(fullSection.id) : false;
                                      const meta = getListeningBilingualMeta({
                                        title: ls.title,
                                        category: ls.scenario,
                                        sectionNumber: sNum,
                                      });
                                      const disc = resolveDiscipline(meta.categoryZh || ls.scenario, ls.title);
                                      const cleanQTypes = (ls.questionTypes || [])
                                        .map((qt) => qt.replace(/\s*[(（].*?[)）]/g, '').trim())
                                        .join(' + ');

                                      return (
                                        <div key={previewKey} className="py-3 first:pt-1 last:pb-0">
                                          <article
                                            onClick={() =>
                                              setExpandedPreviewId(isExpanded ? null : previewKey)
                                            }
                                            className="group transition-colors cursor-pointer flex items-start gap-3"
                                          >
                                            <div className="w-9 shrink-0 pt-0.5 flex flex-col items-start">
                                              <div className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${disc.badgeDotClass}`} />
                                                <span className="font-serif-luxury text-lg font-bold leading-none text-stone-800 dark:text-stone-200 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors tabular-nums">
                                                  0{sNum}
                                                </span>
                                              </div>
                                              <span className="mt-1 text-[10px] font-mono tabular-nums text-stone-400 dark:text-stone-500">
                                                S{sNum}
                                              </span>
                                            </div>

                                            <div className="min-w-0 flex-1 space-y-1">
                                              <div className="flex items-center gap-1.5">
                                                <h4 className="text-[14.5px] font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-snug">
                                                  {meta.titleZh}
                                                </h4>
                                                <ChevronDown
                                                  className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform duration-200 ${
                                                    isExpanded ? 'rotate-180 text-amber-700 dark:text-amber-400' : ''
                                                  }`}
                                                />
                                              </div>
                                              <p className="font-serif-luxury italic text-xs text-stone-500 dark:text-stone-400 truncate">
                                                {meta.titleEn}
                                              </p>
                                              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 flex-wrap pt-0.5">
                                                <span className={`font-medium ${disc.accentTextClass}`}>
                                                  {meta.categoryZh || ls.scenario}
                                                </span>
                                                {cleanQTypes && (
                                                  <>
                                                    <span aria-hidden="true">·</span>
                                                    <span className="text-stone-600 dark:text-stone-300">
                                                      {cleanQTypes}
                                                    </span>
                                                  </>
                                                )}
                                                <span aria-hidden="true">·</span>
                                                <span className="font-mono tabular-nums">{ls.difficulty}</span>
                                              </div>
                                            </div>

                                            <div
                                              className="shrink-0 self-center pl-1"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (!fullSection) return;
                                                if (isSaved) {
                                                  handleRemoveListening(fullSection.id, meta.titleZh);
                                                } else {
                                                  handleAddListening(fullSection);
                                                }
                                              }}
                                            >
                                              <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                                                  isSaved
                                                    ? 'bg-[#516050]/14 text-[#516050] dark:text-[#8FB996]'
                                                    : 'text-stone-600 dark:text-stone-300 bg-stone-900/[0.04] dark:bg-white/[0.06] hover:bg-[#516050]/[0.12] hover:text-[#516050] dark:hover:text-[#8FB996]'
                                                }`}
                                              >
                                                {isSaved ? (
                                                  <>
                                                    <Check className="w-3 h-3" />
                                                    <span>已收录</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Plus className="w-3 h-3" />
                                                    <span>入库</span>
                                                  </>
                                                )}
                                              </span>
                                            </div>
                                          </article>

                                          {/* Expandable Listening Recall Brief */}
                                          <AnimatePresence initial={false}>
                                            {isExpanded && (
                                              <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.16 }}
                                                className="overflow-hidden"
                                              >
                                                <div className="mt-2.5 ml-12 p-3 rounded-2xl bg-[#FAF7F2] dark:bg-white/[0.03] border border-stone-900/[0.06] dark:border-white/[0.06] space-y-2">
                                                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                                                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                                                      场景与考点回忆：
                                                    </span>
                                                    {ls.summary || meta.gistZh}
                                                  </p>
                                                  {((ls.coreKeywords || ls.keyVocab || []).length > 0) && (
                                                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                                      <span className="text-stone-400 dark:text-stone-500">
                                                        听力高频词：
                                                      </span>
                                                      {(ls.coreKeywords || ls.keyVocab || []).map((word) => (
                                                        <span
                                                          key={word}
                                                          className="font-mono px-1.5 py-0.5 rounded-md bg-stone-900/[0.04] dark:bg-white/[0.06] text-stone-600 dark:text-stone-300"
                                                        >
                                                          {word}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  )}
                                                  <div className="pt-1 flex items-center justify-end gap-2">
                                                    {fullSection && (
                                                      <button
                                                        type="button"
                                                        onClick={() => handleLaunchListening(fullSection)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#516050] text-white hover:bg-[#3F4C3E] transition-colors cursor-pointer"
                                                      >
                                                        <span>立即精听本节</span>
                                                        <ArrowRight className="w-3 h-3" />
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </section>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* TAB 2: 全网搜卷与智能装订 (Pure Question Acquisition & Volume Ingestion) */}
            {activeTab === 'web-search' && (
              <div
                onScroll={(e) => {
                  const next = e.currentTarget.scrollTop > 8;
                  if (next !== isModalScrolled) setIsModalScrolled(next);
                }}
                style={{
                  maskImage: isModalScrolled
                    ? 'linear-gradient(to bottom, transparent 0%, black 18px, black calc(100% - 24px), transparent 100%)'
                    : 'linear-gradient(to bottom, black 0%, black calc(100% - 24px), transparent 100%)',
                  WebkitMaskImage: isModalScrolled
                    ? 'linear-gradient(to bottom, transparent 0%, black 18px, black calc(100% - 24px), transparent 100%)'
                    : 'linear-gradient(to bottom, black 0%, black calc(100% - 24px), transparent 100%)'
                }}
                className="flex-1 overflow-y-auto overscroll-contain px-5 pt-3.5 pb-16 no-scrollbar"
              >
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Archival Search & Compiler Console */}
                  <section className="rounded-[24px] bg-[#FDFBF7] dark:bg-stone-900/60 border border-stone-900/[0.07] dark:border-white/[0.08] p-5 shadow-[0_8px_24px_-12px_rgba(28,25,23,0.05)] space-y-3.5">
                    <div className="space-y-1">
                      <h3 className="font-serif-luxury text-base font-bold tracking-tight text-stone-900 dark:text-white">
                        输入考季关键词或专题名称，检索并勾选题源入库
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        自动整理阅读 P1–P3 与听力 S1–S4 双语清单，支持单篇勾选或整卷收入「自选馆藏」
                      </p>
                    </div>

                    {/* Search Input Bar */}
                    <div className="flex items-center gap-2 rounded-2xl bg-[#FAF7F2] dark:bg-stone-900 border border-stone-900/10 dark:border-white/12 px-3.5 py-2 focus-within:border-[#516050]/40 transition-colors">
                      <Search className="w-4 h-4 text-stone-400 shrink-0" />
                      <input
                        id="online-volume-query-input"
                        type="text"
                        value={webQuery}
                        onChange={(e) => setWebQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchAndCompile()}
                        placeholder="如：2026考场回忆、2026换题季真题、深海生物与医学创新..."
                        className="flex-1 bg-transparent text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none"
                      />
                      {webQuery && (
                        <button
                          type="button"
                          onClick={() => setWebQuery('')}
                          className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        id="submit-volume-compile-btn"
                        disabled={isSearchingWeb || !webQuery.trim()}
                        onClick={() => handleSearchAndCompile()}
                        className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#516050] text-white text-[11px] font-medium hover:bg-[#3F4C3E] disabled:opacity-40 cursor-pointer transition-colors"
                      >
                        {isSearchingWeb ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <span>检索题源</span>
                            <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Quick Search Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="text-stone-400 dark:text-stone-500 mr-0.5">热门检索：</span>
                      {['2026考场回忆', '2026换题季真题', '深海生物与医学创新', '认知神经与语言习得', '古代航运与考古新编'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleSearchAndCompile(t)}
                          className="px-2.5 py-1 rounded-lg bg-stone-900/[0.04] dark:bg-white/[0.06] text-stone-600 dark:text-stone-300 hover:bg-[#516050]/[0.1] hover:text-[#516050] dark:hover:text-[#8FB996] transition-colors cursor-pointer"
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {searchError && (
                      <p className="text-xs text-rose-600 dark:text-rose-400">{searchError}</p>
                    )}
                  </section>

                  {/* Loading State */}
                  {isSearchingWeb && (
                    <div className="rounded-[24px] bg-[#FDFBF7] dark:bg-stone-900/50 border border-stone-900/[0.07] dark:border-white/[0.08] py-14 px-6 flex flex-col items-center justify-center space-y-2.5 text-center shadow-[0_8px_24px_-12px_rgba(28,25,23,0.05)]">
                      <Loader2 className="w-5 h-5 animate-spin text-[#516050] dark:text-[#8FB996]" />
                      <p className="text-sm font-serif-luxury font-bold text-stone-800 dark:text-stone-200">
                        正在检索并整理《{webQuery}》可入库清单...
                      </p>
                      <p className="text-[11px] text-stone-400 font-mono">
                        {searchingStep === 1 && '连接全网雅思题源索引...'}
                        {searchingStep === 2 && '校验真题版本与题型结构...'}
                        {searchingStep === 3 && '生成阅读与听力可勾选清单...'}
                      </p>
                    </div>
                  )}

                  {/* Not Found State */}
                  {!isSearchingWeb && searchNotFound && !compiledVolume && (
                    <div className="rounded-[24px] bg-[#FDFBF7] dark:bg-stone-900/50 border border-stone-900/[0.07] dark:border-white/[0.08] p-5 space-y-4 shadow-[0_8px_24px_-12px_rgba(28,25,23,0.05)]">
                      <div className="space-y-1">
                        <h4 className="font-serif-luxury text-base font-bold text-stone-900 dark:text-white">
                          {searchNotFound.message}
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                          {searchNotFound.hint}
                        </p>
                      </div>

                      {effectiveFoundArticles.length > 0 && (
                        <div className="pt-3 border-t border-stone-900/[0.07] dark:border-white/[0.07] space-y-2">
                          <div className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                            相关学术文献参考 ({effectiveFoundArticles.length})
                          </div>
                          <div className="divide-y divide-stone-900/[0.06] dark:divide-white/[0.06]">
                            {effectiveFoundArticles.map((art, idx) => (
                              <div key={idx} className="py-2.5 flex items-baseline justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">{art.title}</span>
                                  {art.snippet && (
                                    <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">{art.snippet}</p>
                                  )}
                                </div>
                                {art.url && (
                                  <a
                                    href={art.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 inline-flex items-center gap-0.5 text-[11px] text-stone-500 hover:text-stone-900 dark:hover:text-white"
                                  >
                                    <span>原文</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Default State: Curated Specialized Dossiers */}
                  {!isSearchingWeb && !searchNotFound && !compiledVolume && (
                    <div className="rounded-[24px] bg-[#FDFBF7] dark:bg-stone-900/50 border border-stone-900/[0.07] dark:border-white/[0.08] p-5 shadow-[0_8px_24px_-12px_rgba(28,25,23,0.05)] space-y-2">
                      <div className="flex items-baseline justify-between gap-2 pb-2.5 border-b border-stone-900/[0.08] dark:border-white/[0.08]">
                        <div className="flex items-baseline gap-2">
                          <span className="font-serif-luxury text-base font-bold text-stone-900 dark:text-white">
                            专题合订卷快速淘题
                          </span>
                          <span className="text-[11px] text-stone-400">
                            点击展开篇目并勾选入库
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-stone-400">04 Anthologies</span>
                      </div>

                      <div className="divide-y divide-stone-900/[0.06] dark:divide-white/[0.06]">
                        {[
                          {
                            num: '01',
                            query: '2026考场回忆',
                            titleZh: '2026 亚太与大陆首发实考回忆合集',
                            titleEn: '2026 Live Exam Recall · Reading P1-P3 & Listening S1-S4',
                            tag: '高频机经合订本 · 含新题首发',
                            disc: DISCIPLINE_THEMES.archaeology,
                          },
                          {
                            num: '02',
                            query: '深海生物与医学创新',
                            titleZh: '自然科学与生物医学高频母题专刊',
                            titleEn: 'Deep-Sea Hydrothermal Vents & Biomedical Innovation Anthology',
                            tag: 'P2/P3 学术高难母题',
                            disc: DISCIPLINE_THEMES.ecology,
                          },
                          {
                            num: '03',
                            query: '认知神经与语言习得',
                            titleZh: '双语认知、记忆机制与心理学高频题集',
                            titleEn: 'Cognitive Neuroscience & Bilingual Acquisition Dossier',
                            tag: 'P3 词义选填与单选专项',
                            disc: DISCIPLINE_THEMES.neuroscience,
                          },
                          {
                            num: '04',
                            query: '2026换题季真题',
                            titleZh: '2026 换题季高频必刷题源精选卷',
                            titleEn: '2026 New Season High-Frequency Exam Compilation',
                            tag: '考前冲刺必收入库',
                            disc: DISCIPLINE_THEMES.engineering,
                          },
                        ].map((item) => (
                          <article
                            key={item.num}
                            onClick={() => handleSearchAndCompile(item.query)}
                            className="group py-3.5 first:pt-2 last:pb-0 transition-colors cursor-pointer flex items-start gap-3"
                          >
                            <div className="w-9 shrink-0 pt-0.5 flex flex-col items-start">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${item.disc.badgeDotClass}`} />
                                <span className="font-serif-luxury text-lg font-bold leading-none text-stone-800 dark:text-stone-200 group-hover:text-[#516050] dark:group-hover:text-[#8FB996] transition-colors tabular-nums">
                                  {item.num}
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <h4 className="text-[14.5px] font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#516050] dark:group-hover:text-[#8FB996] transition-colors">
                                {item.titleZh}
                              </h4>
                              <p className="font-serif-luxury italic text-xs text-stone-500 dark:text-stone-400 truncate">
                                {item.titleEn}
                              </p>
                              <div className="pt-0.5 text-[11px] text-stone-400">
                                <span className={`font-medium ${item.disc.accentTextClass}`}>{item.tag}</span>
                              </div>
                            </div>
                            <div className="shrink-0 self-center flex items-center gap-1 text-[11px] font-medium text-[#516050] dark:text-[#8FB996]">
                              <span>展开</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compiled Result: Pure Question Ingestion Checklist */}
                  {!isSearchingWeb && compiledVolume && (() => {
                    const readingList = compiledVolume.tests?.[0]?.readingPassages || [];
                    const listeningList = compiledVolume.tests?.[0]?.listeningSections || [];
                    const savedReadingCount = readingList.filter((p) => savedPassageIds.has(p.id)).length;
                    const savedListeningCount = listeningList.filter((s) => savedListeningIds.has(s.id)).length;
                    const allReadingSaved = readingList.length > 0 && savedReadingCount === readingList.length;
                    const allListeningSaved = listeningList.length > 0 && savedListeningCount === listeningList.length;
                    const isEntireCompiledSaved =
                      skillFilter === 'reading' ? allReadingSaved : allListeningSaved;

                    return (
                      <div className="rounded-[24px] bg-[#FDFBF7] dark:bg-stone-900/50 border border-stone-900/[0.07] dark:border-white/[0.08] p-5 shadow-[0_8px_24px_-12px_rgba(28,25,23,0.05)] space-y-3">
                        {/* Sheet Header with Back to Anthologies Navigation */}
                        <div className="space-y-2 pb-3 border-b border-stone-900/[0.08] dark:border-white/[0.08]">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCompiledVolume(null);
                                setFoundRealArticles([]);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>返回专题列表</span>
                            </button>

                            <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500">
                              {skillFilter === 'reading'
                                ? `已收录 ${savedReadingCount}/${readingList.length} 篇`
                                : `已收录 ${savedListeningCount}/${listeningList.length} 节`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-serif-luxury text-lg font-bold text-stone-900 dark:text-white tracking-tight truncate">
                              {compiledVolume.bookTitle}
                            </h3>

                            <button
                              type="button"
                              onClick={async () => {
                                setImportingVolumeId(compiledVolume.id);
                                try {
                                  if (skillFilter === 'reading') {
                                    if (allReadingSaved) {
                                      for (const p of readingList) {
                                        await deleteCustomPassage(p.id);
                                      }
                                      showToast(`已将《${compiledVolume.bookTitle}》阅读篇目移出馆藏`);
                                    } else {
                                      await saveCustomPassagesBulk(readingList);
                                      showToast(`已将《${compiledVolume.bookTitle}》全套 ${readingList.length} 篇阅读收入馆藏`);
                                    }
                                  } else {
                                    if (allListeningSaved) {
                                      for (const s of listeningList) {
                                        await deleteCustomListeningSection(s.id);
                                      }
                                      showToast(`已将《${compiledVolume.bookTitle}》听力篇目移出馆藏`);
                                    } else {
                                      await saveCustomListeningBulk(listeningList);
                                      showToast(`已将《${compiledVolume.bookTitle}》全套 ${listeningList.length} 节听力收入馆藏`);
                                    }
                                  }
                                } finally {
                                  setImportingVolumeId(null);
                                }
                              }}
                              disabled={importingVolumeId === compiledVolume.id}
                              className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                                isEntireCompiledSaved
                                  ? 'bg-[#516050]/15 text-[#516050] dark:text-[#8FB996]'
                                  : 'bg-[#516050]/[0.09] hover:bg-[#516050]/[0.16] text-[#516050] dark:bg-[#8FB996]/[0.12] dark:text-[#8FB996]'
                              }`}
                            >
                              {isEntireCompiledSaved ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>本套已全收</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" />
                                  <span>
                                    {importingVolumeId === compiledVolume.id
                                      ? '正在入库...'
                                      : `整套入库 (${skillFilter === 'reading' ? readingList.length - savedReadingCount : listeningList.length - savedListeningCount})`}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>

                          {compiledVolume.description && (
                            <p className="text-[11px] text-stone-500 dark:text-stone-400">
                              {compiledVolume.description}
                            </p>
                          )}
                        </div>

                        {/* Checklist Rows (Click Row for Abstract & Practice; Click Right Button for Ingestion) */}
                        {skillFilter === 'reading' ? (
                          <div className="divide-y divide-stone-900/[0.06] dark:divide-white/[0.06]">
                            {readingList.map((passage, pIdx) => {
                              const isSaved = savedPassageIds.has(passage.id);
                              const pNum = passage.passageNum || pIdx + 1;
                              const previewKey = `compiled-${compiledVolume.id}-p-${pNum}`;
                              const isExpanded = expandedPreviewId === previewKey;
                              const meta = getPassageBilingualMeta(passage);
                              const disc = resolveDiscipline(meta.categoryZh, passage.title);

                              return (
                                <div key={passage.id || pIdx} className="py-3 first:pt-1 last:pb-0">
                                  <article
                                    onClick={() =>
                                      setExpandedPreviewId(isExpanded ? null : previewKey)
                                    }
                                    className="group transition-colors cursor-pointer flex items-start gap-3"
                                  >
                                    <div className="w-9 shrink-0 pt-0.5 flex flex-col items-start">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${disc.badgeDotClass}`} />
                                        <span className="font-serif-luxury text-lg font-bold leading-none text-stone-800 dark:text-stone-200 group-hover:text-[#516050] dark:group-hover:text-[#8FB996] transition-colors tabular-nums">
                                          0{pNum}
                                        </span>
                                      </div>
                                      <span className="mt-1 text-[10px] font-mono tabular-nums text-stone-400 dark:text-stone-500">
                                        P{pNum}
                                      </span>
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <h4 className="text-[14.5px] font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#516050] dark:group-hover:text-[#8FB996] transition-colors leading-snug">
                                          {meta.titleZh}
                                        </h4>
                                        <ChevronDown
                                          className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform duration-200 ${
                                            isExpanded ? 'rotate-180 text-[#516050] dark:text-[#8FB996]' : ''
                                          }`}
                                        />
                                      </div>
                                      <p className="font-serif-luxury italic text-xs text-stone-500 dark:text-stone-400 truncate">
                                        {meta.titleEn}
                                      </p>
                                      <div className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 flex-wrap pt-0.5">
                                        <span className={`font-medium ${disc.accentTextClass}`}>
                                          {disc.shortZh}
                                        </span>
                                        <span aria-hidden="true">·</span>
                                        <span className="font-mono tabular-nums">{passage.bandDifficulty || 'Band 7.0+'}</span>
                                      </div>
                                    </div>

                                    <div
                                      className="shrink-0 self-center pl-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isSaved) {
                                          handleRemovePassage(passage.id, meta.titleZh);
                                        } else {
                                          handleAddPassage(passage);
                                        }
                                      }}
                                    >
                                      <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                                          isSaved
                                            ? 'bg-[#516050]/14 text-[#516050] dark:text-[#8FB996]'
                                            : 'text-stone-600 dark:text-stone-300 bg-stone-900/[0.04] dark:bg-white/[0.06] hover:bg-[#516050]/[0.12] hover:text-[#516050] dark:hover:text-[#8FB996]'
                                        }`}
                                      >
                                        {isSaved ? (
                                          <>
                                            <Check className="w-3 h-3" />
                                            <span>已收录</span>
                                          </>
                                        ) : (
                                          <>
                                            <Plus className="w-3 h-3" />
                                            <span>入库</span>
                                          </>
                                        )}
                                      </span>
                                    </div>
                                  </article>

                                  <AnimatePresence initial={false}>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.16 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-2.5 ml-12 p-3 rounded-2xl bg-[#FAF7F2] dark:bg-white/[0.03] border border-stone-900/[0.06] dark:border-white/[0.06] space-y-2">
                                          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                                            <span className="font-semibold text-stone-800 dark:text-stone-200">
                                              篇目提要：
                                            </span>
                                            {meta.gistZh}
                                          </p>
                                          {passage.keyVocab && passage.keyVocab.length > 0 && (
                                            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                              <span className="text-stone-400 dark:text-stone-500">
                                                核心词汇：
                                              </span>
                                              {passage.keyVocab.slice(0, 6).map((word) => (
                                                <span
                                                  key={word}
                                                  className="font-mono px-1.5 py-0.5 rounded-md bg-stone-900/[0.04] dark:bg-white/[0.06] text-stone-600 dark:text-stone-300"
                                                >
                                                  {word}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                          <div className="pt-1 flex items-center justify-end gap-2">
                                            <button
                                              type="button"
                                              onClick={() => handleLaunchReading(passage, false)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#516050] text-white hover:bg-[#3F4C3E] transition-colors cursor-pointer"
                                            >
                                              <span>立即试做本篇</span>
                                              <ArrowRight className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="divide-y divide-stone-900/[0.06] dark:divide-white/[0.06]">
                            {listeningList.map((section, sIdx) => {
                              const isSaved = savedListeningIds.has(section.id);
                              const sNum = section.sectionNum || sIdx + 1;
                              const previewKey = `compiled-${compiledVolume.id}-s-${sNum}`;
                              const isExpanded = expandedPreviewId === previewKey;
                              const meta = getListeningBilingualMeta(section);
                              const disc = resolveDiscipline(meta.categoryZh, section.title);

                              return (
                                <div key={section.id || sIdx} className="py-3 first:pt-1 last:pb-0">
                                  <article
                                    onClick={() =>
                                      setExpandedPreviewId(isExpanded ? null : previewKey)
                                    }
                                    className="group transition-colors cursor-pointer flex items-start gap-3"
                                  >
                                    <div className="w-9 shrink-0 pt-0.5 flex flex-col items-start">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${disc.badgeDotClass}`} />
                                        <span className="font-serif-luxury text-lg font-bold leading-none text-stone-800 dark:text-stone-200 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors tabular-nums">
                                          0{sNum}
                                        </span>
                                      </div>
                                      <span className="mt-1 text-[10px] font-mono tabular-nums text-stone-400 dark:text-stone-500">
                                        S{sNum}
                                      </span>
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <h4 className="text-[14.5px] font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-snug">
                                          {meta.titleZh}
                                        </h4>
                                        <ChevronDown
                                          className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform duration-200 ${
                                            isExpanded ? 'rotate-180 text-amber-700 dark:text-amber-400' : ''
                                          }`}
                                        />
                                      </div>
                                      <p className="font-serif-luxury italic text-xs text-stone-500 dark:text-stone-400 truncate">
                                        {meta.titleEn}
                                      </p>
                                      <div className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 flex-wrap pt-0.5">
                                        <span className={`font-medium ${disc.accentTextClass}`}>
                                          {meta.categoryZh}
                                        </span>
                                        <span aria-hidden="true">·</span>
                                        <span className="font-mono tabular-nums">Part {sNum}</span>
                                      </div>
                                    </div>

                                    <div
                                      className="shrink-0 self-center pl-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isSaved) {
                                          handleRemoveListening(section.id, meta.titleZh);
                                        } else {
                                          handleAddListening(section);
                                        }
                                      }}
                                    >
                                      <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                                          isSaved
                                            ? 'bg-[#516050]/14 text-[#516050] dark:text-[#8FB996]'
                                            : 'text-stone-600 dark:text-stone-300 bg-stone-900/[0.04] dark:bg-white/[0.06] hover:bg-[#516050]/[0.12] hover:text-[#516050] dark:hover:text-[#8FB996]'
                                        }`}
                                      >
                                        {isSaved ? (
                                          <>
                                            <Check className="w-3 h-3" />
                                            <span>已收录</span>
                                          </>
                                        ) : (
                                          <>
                                            <Plus className="w-3 h-3" />
                                            <span>入库</span>
                                          </>
                                        )}
                                      </span>
                                    </div>
                                  </article>

                                  <AnimatePresence initial={false}>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.16 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-2.5 ml-12 p-3 rounded-2xl bg-[#FAF7F2] dark:bg-white/[0.03] border border-stone-900/[0.06] dark:border-white/[0.06] space-y-2">
                                          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                                            <span className="font-semibold text-stone-800 dark:text-stone-200">
                                              场景提要：
                                            </span>
                                            {meta.gistZh}
                                          </p>
                                          <div className="pt-1 flex items-center justify-end gap-2">
                                            <button
                                              type="button"
                                              onClick={() => handleLaunchListening(section)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#516050] text-white hover:bg-[#3F4C3E] transition-colors cursor-pointer"
                                            >
                                              <span>立即精听本节</span>
                                              <ArrowRight className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Footnotes for Literature & Grounding Sources */}
                        {effectiveFoundArticles.length > 0 && (
                          <div className="pt-3 border-t border-stone-900/[0.06] dark:border-white/[0.06] space-y-1.5">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500">
                              延伸学术文献参考 ({effectiveFoundArticles.length})
                            </div>
                            <div className="divide-y divide-stone-900/[0.05] dark:divide-white/[0.05]">
                              {effectiveFoundArticles.map((art, idx) => (
                                <div key={idx} className="py-1.5 flex items-baseline justify-between gap-3 text-xs">
                                  <span className="text-stone-700 dark:text-stone-300 truncate">{art.title}</span>
                                  {art.url && (
                                    <a
                                      href={art.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="shrink-0 inline-flex items-center gap-0.5 text-[11px] text-stone-400 hover:text-stone-900 dark:hover:text-white"
                                    >
                                      <span>查阅出处</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TAB 3: 个人馆藏目录 (My Curated Library — Grouped by Exam Batch / Volume, Discipline Filterable) */}
            {activeTab === 'my-library' && (() => {
              const q = feedSearchQuery.trim().toLowerCase();

              // Build enriched reading items
              const enrichedReadings = customPassages.map((p) => {
                const meta = getPassageBilingualMeta(p);
                const disc = resolveDiscipline(meta.categoryZh, p.title);
                const bookZh = formatBookNameZh(p.cambridgeBook);
                return { passage: p, meta, disc, bookZh };
              });

              // Available disciplines in reading library
              const readingDisciplines = Array.from(
                new Set(enrichedReadings.map((item) => item.disc.shortZh))
              );

              const filteredLibraryReadings = enrichedReadings.filter((item) => {
                if (
                  libraryDisciplineFilter !== 'ALL' &&
                  item.disc.shortZh !== libraryDisciplineFilter
                ) {
                  return false;
                }
                if (q) {
                  const hay = `${item.meta.titleZh} ${item.meta.titleEn} ${item.bookZh} ${item.disc.shortZh}`.toLowerCase();
                  return hay.includes(q);
                }
                return true;
              });

              // Group reading items by bookZh
              const groupedLibraryReadings = Array.from(
                filteredLibraryReadings.reduce((acc, item) => {
                  const key = item.bookZh || '其他收录';
                  if (!acc.has(key)) acc.set(key, []);
                  acc.get(key)!.push(item);
                  return acc;
                }, new Map<string, typeof filteredLibraryReadings>())
              );

              // Enriched listening items
              const enrichedListenings = customListening.map((s) => {
                const meta = getListeningBilingualMeta(s);
                const disc = resolveDiscipline(meta.categoryZh, s.title);
                const bookZh = formatBookNameZh(s.cambridgeBook);
                return { section: s, meta, disc, bookZh };
              });

              const filteredLibraryListenings = enrichedListenings.filter((item) => {
                if (q) {
                  const hay = `${item.meta.titleZh} ${item.meta.titleEn} ${item.bookZh} ${item.meta.categoryZh}`.toLowerCase();
                  return hay.includes(q);
                }
                return true;
              });

              const groupedLibraryListenings = Array.from(
                filteredLibraryListenings.reduce((acc, item) => {
                  const key = item.bookZh || '其他收录';
                  if (!acc.has(key)) acc.set(key, []);
                  acc.get(key)!.push(item);
                  return acc;
                }, new Map<string, typeof filteredLibraryListenings>())
              );

              return (
                <div
                  onScroll={(e) => {
                    const next = e.currentTarget.scrollTop > 8;
                    if (next !== isModalScrolled) setIsModalScrolled(next);
                  }}
                  style={{
                    maskImage: isModalScrolled
                      ? 'linear-gradient(to bottom, transparent 0%, black 18px, black calc(100% - 24px), transparent 100%)'
                      : 'linear-gradient(to bottom, black 0%, black calc(100% - 24px), transparent 100%)',
                    WebkitMaskImage: isModalScrolled
                      ? 'linear-gradient(to bottom, transparent 0%, black 18px, black calc(100% - 24px), transparent 100%)'
                      : 'linear-gradient(to bottom, black 0%, black calc(100% - 24px), transparent 100%)'
                  }}
                  className="flex-1 overflow-y-auto overscroll-contain px-5 pt-3.5 pb-16 no-scrollbar"
                >
                  <div className="max-w-2xl mx-auto space-y-4">
                    {/* Top Summary & Discipline Filter Bar */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {skillFilter === 'reading' && readingDisciplines.length > 1 ? (
                          <div className="p-0.5 rounded-xl bg-stone-900/[0.05] dark:bg-white/[0.06] flex items-center gap-0.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setLibraryDisciplineFilter('ALL')}
                              className={`h-7 px-2.5 rounded-[10px] text-xs cursor-pointer transition-all ${
                                libraryDisciplineFilter === 'ALL'
                                  ? 'bg-[#FDFBF7] dark:bg-stone-800 text-stone-900 dark:text-white font-bold shadow-2xs'
                                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-medium'
                              }`}
                            >
                              全部 ({customPassages.length})
                            </button>
                            {readingDisciplines.map((dName) => {
                              const count = enrichedReadings.filter((r) => r.disc.shortZh === dName).length;
                              const isActive = libraryDisciplineFilter === dName;
                              return (
                                <button
                                  key={dName}
                                  type="button"
                                  onClick={() => setLibraryDisciplineFilter(dName)}
                                  className={`h-7 px-2.5 rounded-[10px] text-xs cursor-pointer transition-all ${
                                    isActive
                                      ? 'bg-[#FDFBF7] dark:bg-stone-800 text-stone-900 dark:text-white font-bold shadow-2xs'
                                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-medium'
                                  }`}
                                >
                                  {dName} ({count})
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-stone-500 dark:text-stone-400">
                            {skillFilter === 'reading'
                              ? `阅读馆藏共收录 ${customPassages.length} 篇，按考次/卷册自动归档`
                              : `听力馆藏共收录 ${customListening.length} 节，按考次/卷册自动归档`}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('live-feed')}
                        className="shrink-0 h-7 px-2.5 rounded-xl text-xs font-medium bg-[#516050]/[0.09] hover:bg-[#516050]/[0.16] text-[#516050] dark:bg-[#8FB996]/[0.12] dark:text-[#8FB996] transition-colors cursor-pointer"
                      >
                        + 继续淘题
                      </button>
                    </div>

                    {/* Grouped Saved Items List */}
                    {skillFilter === 'reading' ? (
                      customPassages.length === 0 ? (
                        <div className="rounded-[24px] bg-[#FDFBF7] dark:bg-stone-900/60 border border-stone-900/[0.07] dark:border-white/[0.08] py-14 px-6 text-center space-y-3 shadow-[0_8px_24px_-12px_rgba(28,25,23,0.05)]">
                          <p className="font-serif-luxury text-base font-bold text-stone-800 dark:text-stone-200">
                            阅读馆藏暂未收录篇目
                          </p>
                          <p className="text-xs text-stone-400 dark:text-stone-500 max-w-sm mx-auto leading-relaxed">
                            可在「考季机经」或「全网搜卷」中点击「+ 入库」或「+ 整场入库」，将心仪的真题或新题收入个人馆藏
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveTab('live-feed')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#516050]/[0.1] hover:bg-[#516050]/[0.16] text-[#516050] dark:text-[#8FB996] text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <span>前往考季机经淘题</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : groupedLibraryReadings.length === 0 ? (
                        <div className="rounded-[24px] bg-[#FDFBF7] dark:bg-stone-900/60 border border-stone-900/[0.07] dark:border-white/[0.08] py-10 px-6 text-center space-y-2">
                          <p className="text-xs text-stone-500">当前筛选条件下暂无匹配篇目</p>
                          <button
                            type="button"
                            onClick={() => {
                              setLibraryDisciplineFilter('ALL');
                              setFeedSearchQuery('');
                            }}
                            className="text-xs font-medium text-[#516050] dark:text-[#8FB996] cursor-pointer"
                          >
                            重置筛选
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {groupedLibraryReadings.map(([groupTitle, groupItems]) => (
                            <section
                              key={groupTitle}
                              className="rounded-[24px] bg-[#FDFBF7] dark:bg-stone-900/60 border border-stone-900/[0.07] dark:border-white/[0.08] p-5 shadow-[0_8px_24px_-12px_rgba(28,25,23,0.05)] space-y-3"
                            >
                              {/* Batch Group Header */}
                              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-900/[0.08] dark:border-white/[0.08]">
                                <div className="flex items-baseline gap-2 min-w-0">
                                  <h3 className="font-serif-luxury text-lg font-bold tracking-tight text-stone-900 dark:text-white truncate">
                                    {groupTitle}
                                  </h3>
                                  <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500 shrink-0">
                                    {groupItems.length} 篇
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    for (const item of groupItems) {
                                      await deleteCustomPassage(item.passage.id);
                                    }
                                    showToast(`已将「${groupTitle}」${groupItems.length} 篇阅读移出馆藏`);
                                  }}
                                  className="shrink-0 text-[11px] text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                >
                                  整组移出
                                </button>
                              </div>

                              <div className="divide-y divide-stone-900/[0.06] dark:divide-white/[0.06]">
                                {groupItems.map(({ passage: p, meta, disc }, idx) => {
                                  const pNum = p.passageNum || (idx % 3) + 1;
                                  const numStr = String(pNum).padStart(2, '0');

                                  return (
                                    <article
                                      key={p.id || idx}
                                      onClick={() => handleLaunchReading(p)}
                                      className="group py-3 first:pt-1 last:pb-0 transition-colors cursor-pointer flex items-start gap-3"
                                    >
                                      <div className="w-9 shrink-0 pt-0.5 flex flex-col items-start">
                                        <div className="flex items-center gap-1.5">
                                          <span className={`w-1.5 h-1.5 rounded-full ${disc.badgeDotClass}`} />
                                          <span className="font-serif-luxury text-lg font-bold leading-none text-stone-800 dark:text-stone-200 group-hover:text-[#516050] dark:group-hover:text-[#8FB996] transition-colors tabular-nums">
                                            {numStr}
                                          </span>
                                        </div>
                                        <span className="mt-1 text-[10px] font-mono tabular-nums text-stone-400 dark:text-stone-500">
                                          P{pNum}
                                        </span>
                                      </div>

                                      <div className="min-w-0 flex-1 space-y-1">
                                        <h4 className="text-[14.5px] font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#516050] dark:group-hover:text-[#8FB996] transition-colors leading-snug">
                                          {meta.titleZh}
                                        </h4>
                                        <p className="font-serif-luxury italic text-xs text-stone-500 dark:text-stone-400 truncate">
                                          {meta.titleEn}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 flex-wrap pt-0.5">
                                          <span className={`font-medium ${disc.accentTextClass}`}>
                                            {disc.shortZh}
                                          </span>
                                          {p.bandDifficulty && (
                                            <>
                                              <span aria-hidden="true">·</span>
                                              <span className="font-mono tabular-nums">{p.bandDifficulty}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      <div className="shrink-0 self-center flex items-center gap-1.5 pl-1" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={() => handleRemovePassage(p.id, meta.titleZh)}
                                          className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:bg-rose-500/10 hover:text-rose-600 transition-colors cursor-pointer"
                                          title="移出馆藏"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleLaunchReading(p)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#516050]/[0.09] hover:bg-[#516050]/[0.16] text-[#516050] dark:bg-[#8FB996]/[0.12] dark:text-[#8FB996] transition-colors cursor-pointer"
                                        >
                                          <span>练习</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </article>
                                  );
                                })}
                              </div>
                            </section>
                          ))}
                        </div>
                      )
                    ) : customListening.length === 0 ? (
                      <div className="rounded-[24px] bg-[#FDFBF7] dark:bg-stone-900/60 border border-stone-900/[0.07] dark:border-white/[0.08] py-14 px-6 text-center space-y-3 shadow-[0_8px_24px_-12px_rgba(28,25,23,0.05)]">
                        <p className="font-serif-luxury text-base font-bold text-stone-800 dark:text-stone-200">
                          听力馆藏暂未收录篇目
                        </p>
                        <p className="text-xs text-stone-400 dark:text-stone-500 max-w-sm mx-auto leading-relaxed">
                          可在顶部切换至「听力」后前往「考季机经」或「全网搜卷」一键入库
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('live-feed')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#516050]/[0.1] hover:bg-[#516050]/[0.16] text-[#516050] dark:text-[#8FB996] text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span>前往考季机经淘题</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {groupedLibraryListenings.map(([groupTitle, groupItems]) => (
                          <section
                            key={groupTitle}
                            className="rounded-[24px] bg-[#FDFBF7] dark:bg-stone-900/60 border border-stone-900/[0.07] dark:border-white/[0.08] p-5 shadow-[0_8px_24px_-12px_rgba(28,25,23,0.05)] space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-900/[0.08] dark:border-white/[0.08]">
                              <div className="flex items-baseline gap-2 min-w-0">
                                <h3 className="font-serif-luxury text-lg font-bold tracking-tight text-stone-900 dark:text-white truncate">
                                  {groupTitle}
                                </h3>
                                <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500 shrink-0">
                                  {groupItems.length} 节
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={async () => {
                                  for (const item of groupItems) {
                                    await deleteCustomListeningSection(item.section.id);
                                  }
                                  showToast(`已将「${groupTitle}」${groupItems.length} 节听力移出馆藏`);
                                }}
                                className="shrink-0 text-[11px] text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                              >
                                整组移出
                              </button>
                            </div>

                            <div className="divide-y divide-stone-900/[0.06] dark:divide-white/[0.06]">
                              {groupItems.map(({ section: s, meta, disc }, idx) => {
                                const sNum = s.sectionNum || (idx % 4) + 1;
                                const numStr = String(sNum).padStart(2, '0');

                                return (
                                  <article
                                    key={s.id || idx}
                                    onClick={() => handleLaunchListening(s)}
                                    className="group py-3 first:pt-1 last:pb-0 transition-colors cursor-pointer flex items-start gap-3"
                                  >
                                    <div className="w-9 shrink-0 pt-0.5 flex flex-col items-start">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${disc.badgeDotClass}`} />
                                        <span className="font-serif-luxury text-lg font-bold leading-none text-stone-800 dark:text-stone-200 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors tabular-nums">
                                          {numStr}
                                        </span>
                                      </div>
                                      <span className="mt-1 text-[10px] font-mono tabular-nums text-stone-400 dark:text-stone-500">
                                        S{sNum}
                                      </span>
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-1">
                                      <h4 className="text-[14.5px] font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-snug">
                                        {meta.titleZh}
                                      </h4>
                                      <p className="font-serif-luxury italic text-xs text-stone-500 dark:text-stone-400 truncate">
                                        {meta.titleEn}
                                      </p>
                                      <div className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 flex-wrap pt-0.5">
                                        <span className={`font-medium ${disc.accentTextClass}`}>
                                          {meta.categoryZh}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="shrink-0 self-center flex items-center gap-1.5 pl-1" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveListening(s.id, meta.titleZh)}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:bg-rose-500/10 hover:text-rose-600 transition-colors cursor-pointer"
                                        title="移出馆藏"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleLaunchListening(s)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#516050]/[0.09] hover:bg-[#516050]/[0.16] text-[#516050] dark:bg-[#8FB996]/[0.12] dark:text-[#8FB996] transition-colors cursor-pointer"
                                      >
                                        <span>练习</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          </section>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Persistent Bottom Collection Sync Bar (底部馆藏同步汇总栏 — 点击左侧亦可直接查看馆藏) */}
            <div className="shrink-0 bg-[#FAF7F2]/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-900/[0.07] dark:border-white/[0.08] px-5 pt-3 pb-[max(0.75rem,calc(env(safe-area-inset-bottom,0px)+0.75rem))]">
              <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('my-library')}
                  className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white whitespace-nowrap min-w-0 cursor-pointer transition-colors"
                  title="点击查看已收录馆藏"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#516050] dark:bg-[#8FB996] shrink-0" />
                  <span className="truncate">
                    馆藏已收录：
                    <strong className="font-semibold text-stone-800 dark:text-white mx-0.5">
                      阅读 {customPassages.length} 篇
                    </strong>
                    ·
                    <strong className="font-semibold text-stone-800 dark:text-white mx-0.5">
                      听力 {customListening.length} 篇
                    </strong>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#516050]/[0.1] hover:bg-[#516050]/[0.16] text-[#516050] dark:bg-[#8FB996]/[0.15] dark:text-[#8FB996] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>完成并返回</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
