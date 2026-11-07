import { CambridgePassage, CAMBRIDGE_IELTS_PASSAGES } from '../data/ieltsPassages';
import { IELTSListeningSection, CAMBRIDGE_IELTS_LISTENING } from '../data/ieltsListening';
import { OFFICIAL_IELTS_VOLUMES } from '../data/ieltsVolumes';
import { IELTS_2026_AUTUMN_RECALL_VOLUME } from '../data/seasonalIeltsRecallArchive';
import { IeltsTestRecord } from '../db';

export type WorkbookItemStatus = 'unstarted' | 'in_progress' | 'completed';

export interface PassageProgressMeta {
  id: string;
  status: WorkbookItemStatus;
  answeredCount: number;
  totalQuestions: number;
  correctCount?: number;
  bandScore?: string | number;
  hitCount: number;
  hitWords: string[];
}

export interface WorkbookPassageItem {
  passage: CambridgePassage;
  volumeKey: string;
  volumeLabel: string;
  testNum: number;
  passageNum: number;
  progress: PassageProgressMeta;
}

export interface WorkbookListeningItem {
  section: IELTSListeningSection;
  volumeKey: string;
  volumeLabel: string;
  testNum: number;
  sectionNum: number;
  progress: PassageProgressMeta;
}

export interface WorkbookTestGroup<T> {
  volumeKey: string;
  volumeLabel: string;
  testNum: number;
  testTitle: string;
  items: T[];
  completedCount: number;
  inProgressCount: number;
  totalItems: number;
  earnedCorrect: number;
  earnedTotalQuestions: number;
  totalQuestionsInTest: number;
  totalHitCount: number;
  isTestCompleted: boolean;
}

export interface WorkbookVolumeGroup<T> {
  volumeKey: string;
  volumeLabel: string;
  volumeShortBadge: string;
  volumeSubtitle: string;
  tests: WorkbookTestGroup<T>[];
  completedItemsCount: number;
  totalItemsCount: number;
}

export interface ListeningCompletionRecord {
  sectionId: string;
  sectionTitle?: string;
  correctCount: number;
  totalQuestions: number;
  bandScore: string | number;
  answers?: Record<number, string>;
  timestamp: number;
}

export interface HitStatsEntry {
  count: number;
  matchedWords: string[];
}

const VOLUME_ORDER: string[] = [
  '2026 考场真题',
  'Cambridge 20',
  'Cambridge 19',
  'Cambridge 18',
  'Cambridge 17',
  'Cambridge 16',
  'Cambridge Special',
];

const VOLUME_DISPLAY_META: Record<string, { label: string; subtitle: string }> = {
  '2026 考场真题': {
    label: '2026 亚太/大陆考季真题册',
    subtitle: '2025–2026 纸笔与机考高频回忆实录 · Test 1–4 完整四套卷',
  },
  'Cambridge 20': {
    label: '剑桥雅思全真模考集 20 (Academic)',
    subtitle: 'Cambridge IELTS 20 · 前沿学术神经科学与海洋法理全真套卷',
  },
  'Cambridge 19': {
    label: '剑桥雅思官方真题集 19 (Academic)',
    subtitle: 'Cambridge IELTS 19 · 最新官方学术类 Test 1–4 全真四套卷',
  },
  'Cambridge 18': {
    label: '剑桥雅思官方真题集 18 (Academic)',
    subtitle: 'Cambridge IELTS 18 · 官方学术类经典标准套卷',
  },
  'Cambridge 17': {
    label: '剑桥雅思官方真题集 17 (Academic)',
    subtitle: 'Cambridge IELTS 17 · 官方学术类真题汇编套卷',
  },
  'Cambridge 16': {
    label: '剑桥雅思官方真题集 16 (Academic)',
    subtitle: 'Cambridge IELTS 16 · 官方学术类真题汇编套卷',
  },
  'Cambridge Special': {
    label: '网球与运动工程学术特辑 (Special)',
    subtitle: '运动生物力学、材料工程与历史演进全真专题套卷',
  },
};

/**
 * Normalizes disparate cambridgeBook strings into canonical volume keys
 * so passages from the same real workbook are never split across separate buckets.
 */
export function normalizeVolumeKey(cambridgeBook?: string): string {
  const raw = (cambridgeBook || '').trim();
  if (!raw) return '2026 考场真题';

  if (
    raw.includes('2026') ||
    raw.includes('2025') ||
    raw.toLowerCase().includes('recall') ||
    raw.includes('考场真题') ||
    raw.includes('考季')
  ) {
    return '2026 考场真题';
  }
  if (raw.includes('20')) return 'Cambridge 20';
  if (raw.includes('19')) return 'Cambridge 19';
  if (raw.includes('18')) return 'Cambridge 18';
  if (raw.includes('17')) return 'Cambridge 17';
  if (raw.includes('16')) return 'Cambridge 16';
  if (raw.toLowerCase().includes('special') || raw.includes('特辑') || raw.includes('专项')) {
    return 'Cambridge Special';
  }
  return raw;
}

export function getVolumeDisplayMeta(volumeKey: string): { label: string; subtitle: string } {
  if (VOLUME_DISPLAY_META[volumeKey]) {
    return VOLUME_DISPLAY_META[volumeKey];
  }
  return {
    label: volumeKey,
    subtitle: '官方学术类标准测试卷',
  };
}

export function getVolumeShortBadge(volumeKey: string): string {
  switch (volumeKey) {
    case '2026 考场真题':
      return '2026 考季真题';
    case 'Cambridge 20':
      return '剑桥雅思 20';
    case 'Cambridge 19':
      return '剑桥雅思 19';
    case 'Cambridge 18':
      return '剑桥雅思 18';
    case 'Cambridge 17':
      return '剑桥雅思 17';
    case 'Cambridge 16':
      return '剑桥雅思 16';
    case 'Cambridge Special':
      return '运动科技专卷';
    default:
      return volumeKey;
  }
}

/**
 * Collects the complete set of Reading passages across primary volumes (2026 Recall, C20, C19, C18, C17, C16, Special)
 * plus any custom/live-synced passages so every Test has all 3 Passages (P1, P2, P3).
 */
export function getCompleteWorkbookPassages(customPassages: CambridgePassage[] = []): CambridgePassage[] {
  const result: CambridgePassage[] = [];

  // 1. 2026 Recall Volume (Tests 1-4, each P1-P3)
  for (const test of IELTS_2026_AUTUMN_RECALL_VOLUME.tests) {
    test.readingPassages.forEach((p, idx) => {
      result.push({
        ...p,
        cambridgeBook: '2026 考场真题',
        testNum: test.testNum,
        passageNum: p.passageNum || idx + 1,
      });
    });
  }

  // 2. Official Volumes (C20, C19, C18, Tennis Special)
  for (const vol of OFFICIAL_IELTS_VOLUMES) {
    if (vol.volumeNumber === 20 || vol.volumeNumber === 19 || vol.volumeNumber === 18) {
      const targetBook = `Cambridge ${vol.volumeNumber}`;
      for (const test of vol.tests) {
        if (test.readingPassages.length === 3) {
          test.readingPassages.forEach((p, idx) => {
            result.push({
              ...p,
              cambridgeBook: targetBook,
              testNum: test.testNum,
              passageNum: idx + 1,
            });
          });
        }
      }
    } else if (vol.id === 'cambridge-volume-tennis-special') {
      for (const test of vol.tests) {
        test.readingPassages.forEach((p, idx) => {
          const passageNum = idx + 1;
          result.push({
            ...p,
            id: passageNum === 1 ? 'c-special-t1-p1' : p.id,
            cambridgeBook: 'Cambridge Special',
            testNum: 1,
            passageNum,
          });
        });
      }
    }
  }

  // 3. Complete Cambridge 18 Test 1 with rich passages from CAMBRIDGE_IELTS_PASSAGES
  const c18Rich = CAMBRIDGE_IELTS_PASSAGES.filter(p => p.cambridgeBook === 'Cambridge 18' && p.testNum === 1);
  c18Rich.forEach(p => result.push({ ...p, cambridgeBook: 'Cambridge 18' }));

  // 4. Complete Cambridge 19 Test 1 with rich 40-question passages from CAMBRIDGE_IELTS_PASSAGES
  const c19Rich = CAMBRIDGE_IELTS_PASSAGES.filter(p => p.cambridgeBook === 'Cambridge 19' && p.testNum === 1);
  c19Rich.forEach(p => result.push({ ...p, cambridgeBook: 'Cambridge 19' }));

  // 5. Assemble complete 3-passage Test 1 for Cambridge 17
  const c17P1 = CAMBRIDGE_IELTS_PASSAGES.find(p => p.id === 'c17-t1-p1');
  const c17P2 = CAMBRIDGE_IELTS_PASSAGES.find(p => p.id === 'c17-t2-p1');
  const c17P3 = CAMBRIDGE_IELTS_PASSAGES.find(p => p.id === 'c15-t1-p3');
  if (c17P1 && c17P2 && c17P3) {
    result.push(
      { ...c17P1, cambridgeBook: 'Cambridge 17', testNum: 1, passageNum: 1 },
      {
        ...c17P2,
        id: 'c17-t1-p2',
        cambridgeBook: 'Cambridge 17',
        testNum: 1,
        passageNum: 2,
        subtitle: 'CAMBRIDGE 17 · TEST 1 · PASSAGE 2 · ACADEMIC READING',
      },
      {
        ...c17P3,
        id: 'c17-t1-p3',
        cambridgeBook: 'Cambridge 17',
        testNum: 1,
        passageNum: 3,
        subtitle: 'CAMBRIDGE 17 · TEST 1 · PASSAGE 3 · ACADEMIC READING',
      }
    );
  }

  // 6. Assemble complete 3-passage Test 1 for Cambridge 16
  const c16Vol = OFFICIAL_IELTS_VOLUMES.find(v => v.volumeNumber === 16);
  const c16Uffington = c16Vol?.tests[0]?.readingPassages[0];
  const c16Roman = CAMBRIDGE_IELTS_PASSAGES.find(p => p.id === 'c16-t1-p1');
  const c16Norse = CAMBRIDGE_IELTS_PASSAGES.find(p => p.id === 'c16-t3-p2');
  if (c16Uffington && c16Roman && c16Norse) {
    result.push(
      { ...c16Roman, id: 'c16-t1-p1', cambridgeBook: 'Cambridge 16', testNum: 1, passageNum: 1 },
      {
        ...c16Norse,
        id: 'c16-t1-p2',
        cambridgeBook: 'Cambridge 16',
        testNum: 1,
        passageNum: 2,
        subtitle: 'CAMBRIDGE 16 · TEST 1 · PASSAGE 2 · ACADEMIC READING',
      },
      {
        ...c16Uffington,
        id: 'c16-t1-p3',
        cambridgeBook: 'Cambridge 16',
        testNum: 1,
        passageNum: 3,
        subtitle: 'CAMBRIDGE 16 · TEST 1 · PASSAGE 3 · ACADEMIC READING',
      }
    );
  }

  // 7. Custom / Online synced passages
  for (const cp of customPassages) {
    result.push(cp);
  }

  return result;
}

/**
 * Collects the complete set of Listening sections across primary volumes (2026 Recall, C20, C19, C18, C17, C16, Special)
 * plus any custom/live-synced listening sections so every Test has complete sections.
 */
export function getCompleteWorkbookListening(customSections: IELTSListeningSection[] = []): IELTSListeningSection[] {
  const result: IELTSListeningSection[] = [];

  // 1. 2026 Recall Volume (Tests 1-4, each S1-S4)
  for (const test of IELTS_2026_AUTUMN_RECALL_VOLUME.tests) {
    test.listeningSections.forEach((s, idx) => {
      result.push({
        ...s,
        cambridgeBook: '2026 考场真题',
        testNum: test.testNum,
        sectionNum: s.sectionNum || idx + 1,
      });
    });
  }

  // 2. Official Volumes (C20, C19, C18, Tennis Special)
  for (const vol of OFFICIAL_IELTS_VOLUMES) {
    if (vol.volumeNumber === 20 || vol.volumeNumber === 19 || vol.volumeNumber === 18) {
      const targetBook = `Cambridge ${vol.volumeNumber}`;
      for (const test of vol.tests) {
        if (test.listeningSections.length >= 2) {
          test.listeningSections.forEach((s, idx) => {
            result.push({
              ...s,
              cambridgeBook: targetBook,
              testNum: test.testNum,
              sectionNum: s.sectionNum || idx + 1,
            });
          });
        }
      }
    } else if (vol.id === 'cambridge-volume-tennis-special') {
      for (const test of vol.tests) {
        test.listeningSections.forEach((s, idx) => {
          result.push({
            ...s,
            cambridgeBook: 'Cambridge Special',
            testNum: 1,
            sectionNum: idx + 1,
          });
        });
      }
    }
  }

  // 3. Rich listening sections from CAMBRIDGE_IELTS_LISTENING for C19 & C18
  for (const s of CAMBRIDGE_IELTS_LISTENING) {
    const norm = normalizeVolumeKey(s.cambridgeBook);
    if (norm === 'Cambridge 19' || norm === 'Cambridge 18' || norm === 'Cambridge Special') {
      result.push({ ...s, cambridgeBook: norm });
    }
  }

  // 4. Complete Cambridge 17 Test 1 Listening (S1-S4)
  const c17S1 = CAMBRIDGE_IELTS_LISTENING.find(s => s.id === 'c17-t1-s1');
  const c17S4 = CAMBRIDGE_IELTS_LISTENING.find(s => s.id === 'c17-t2-s4');
  const c15S1 = CAMBRIDGE_IELTS_LISTENING.find(s => s.id === 'c15-t1-s1');
  const c14S1 = CAMBRIDGE_IELTS_LISTENING.find(s => s.id === 'c14-t1-s1');
  if (c17S1 && c17S4 && c15S1 && c14S1) {
    result.push(
      { ...c17S1, cambridgeBook: 'Cambridge 17', testNum: 1, sectionNum: 1 },
      { ...c15S1, id: 'c17-t1-s2', cambridgeBook: 'Cambridge 17', testNum: 1, sectionNum: 2 },
      { ...c14S1, id: 'c17-t1-s3', cambridgeBook: 'Cambridge 17', testNum: 1, sectionNum: 3 },
      { ...c17S4, id: 'c17-t1-s4', cambridgeBook: 'Cambridge 17', testNum: 1, sectionNum: 4 }
    );
  }

  // 5. Custom / Online synced listening sections
  for (const cs of customSections) {
    result.push(cs);
  }

  return result;
}

export function computeWordHitMapForPassages(
  passages: CambridgePassage[],
  userWords: string[]
): Record<string, HitStatsEntry> {
  const normalizedUserWords = (userWords || []).map(w => w.trim().toLowerCase()).filter(w => w.length >= 2);
  const map: Record<string, HitStatsEntry> = {};

  if (normalizedUserWords.length === 0) return map;

  for (const passage of passages) {
    const passageTextLower = `${passage.text || ''} ${passage.title || ''} ${(passage.keyVocab || []).join(' ')}`.toLowerCase();
    const matched: string[] = [];
    for (const w of normalizedUserWords) {
      const regex = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      if (regex.test(passageTextLower)) {
        matched.push(w);
      }
    }
    map[passage.id] = { count: matched.length, matchedWords: matched };
  }
  return map;
}

export function computeWordHitMapForListening(
  sections: IELTSListeningSection[],
  userWords: string[]
): Record<string, HitStatsEntry> {
  const normalizedUserWords = (userWords || []).map(w => w.trim().toLowerCase()).filter(w => w.length >= 2);
  const map: Record<string, HitStatsEntry> = {};

  if (normalizedUserWords.length === 0) return map;

  for (const section of sections) {
    const fullText = `${section.title || ''} ${section.scenario || ''} ${(section.keyVocab || []).join(' ')} ${(section.scriptParagraphs || []).map(p => p.text).join(' ')}`.toLowerCase();
    const matched: string[] = [];
    for (const w of normalizedUserWords) {
      const regex = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      if (regex.test(fullText)) {
        matched.push(w);
      }
    }
    map[section.id] = { count: matched.length, matchedWords: matched };
  }
  return map;
}

export function countNonEmptyAnswers(draft?: Record<number, string>): number {
  if (!draft) return 0;
  return Object.values(draft).filter(v => typeof v === 'string' && v.trim().length > 0).length;
}

export function computeReadingPassageProgress(
  passage: CambridgePassage,
  testRecords: IeltsTestRecord[],
  draftsMap: Record<string, Record<number, string>>,
  hitStats?: HitStatsEntry
): PassageProgressMeta {
  const totalQuestions = passage.questions?.length || 13;
  const matchingRecords = testRecords
    .filter(r => r.passageTitle === passage.title || (r as { passageId?: string }).passageId === passage.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  const latestRecord = matchingRecords[0];
  const draft = draftsMap[passage.id];
  const draftAnsweredCount = countNonEmptyAnswers(draft);

  if (latestRecord) {
    return {
      id: passage.id,
      status: 'completed',
      answeredCount: latestRecord.totalQuestions || totalQuestions,
      totalQuestions: latestRecord.totalQuestions || totalQuestions,
      correctCount: latestRecord.correctCount,
      bandScore: latestRecord.bandScore,
      hitCount: hitStats?.count || 0,
      hitWords: hitStats?.matchedWords || [],
    };
  }

  if (draftAnsweredCount > 0) {
    return {
      id: passage.id,
      status: 'in_progress',
      answeredCount: Math.min(draftAnsweredCount, totalQuestions),
      totalQuestions,
      hitCount: hitStats?.count || 0,
      hitWords: hitStats?.matchedWords || [],
    };
  }

  return {
    id: passage.id,
    status: 'unstarted',
    answeredCount: 0,
    totalQuestions,
    hitCount: hitStats?.count || 0,
    hitWords: hitStats?.matchedWords || [],
  };
}

export function computeListeningSectionProgress(
  section: IELTSListeningSection,
  listeningRecords: Record<string, ListeningCompletionRecord>,
  draftsMap: Record<string, Record<number, string>>,
  hitStats?: HitStatsEntry
): PassageProgressMeta {
  const totalQuestions = section.questions?.length || 10;
  const record = listeningRecords[section.id];
  const draft = draftsMap[section.id];
  const draftAnsweredCount = countNonEmptyAnswers(draft);

  if (record) {
    return {
      id: section.id,
      status: 'completed',
      answeredCount: record.totalQuestions || totalQuestions,
      totalQuestions: record.totalQuestions || totalQuestions,
      correctCount: record.correctCount,
      bandScore: record.bandScore,
      hitCount: hitStats?.count || 0,
      hitWords: hitStats?.matchedWords || [],
    };
  }

  if (draftAnsweredCount > 0) {
    return {
      id: section.id,
      status: 'in_progress',
      answeredCount: Math.min(draftAnsweredCount, totalQuestions),
      totalQuestions,
      hitCount: hitStats?.count || 0,
      hitWords: hitStats?.matchedWords || [],
    };
  }

  return {
    id: section.id,
    status: 'unstarted',
    answeredCount: 0,
    totalQuestions,
    hitCount: hitStats?.count || 0,
    hitWords: hitStats?.matchedWords || [],
  };
}

function sortVolumeKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const idxA = VOLUME_ORDER.indexOf(a);
    const idxB = VOLUME_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Builds the structured Reading Workbook Catalog:
 * Volume -> Test 1..4 -> Passage 1..3
 */
export function buildReadingWorkbookCatalog(
  passages: CambridgePassage[],
  hitStatsMap: Record<string, HitStatsEntry>,
  testRecords: IeltsTestRecord[],
  draftsMap: Record<string, Record<number, string>>
): WorkbookVolumeGroup<WorkbookPassageItem>[] {
  const byVolume = new Map<string, Map<number, WorkbookPassageItem[]>>();

  // Deduplicate by (volumeKey, testNum, passageNum), preferring entries with more questions / richer text
  const slotMap = new Map<string, CambridgePassage>();
  for (const p of passages) {
    const volumeKey = normalizeVolumeKey(p.cambridgeBook);
    const slotKey = `${volumeKey}__T${p.testNum}__P${p.passageNum}`;
    const existing = slotMap.get(slotKey);
    if (!existing) {
      slotMap.set(slotKey, p);
    } else {
      const existingQ = existing.questions?.length || 0;
      const newQ = p.questions?.length || 0;
      const existingLen = existing.text?.length || 0;
      const newLen = p.text?.length || 0;
      if (newQ > existingQ || (newQ === existingQ && newLen > existingLen)) {
        slotMap.set(slotKey, p);
      }
    }
  }

  for (const p of slotMap.values()) {
    const volumeKey = normalizeVolumeKey(p.cambridgeBook);
    const meta = getVolumeDisplayMeta(volumeKey);
    const progress = computeReadingPassageProgress(p, testRecords, draftsMap, hitStatsMap[p.id]);

    const item: WorkbookPassageItem = {
      passage: { ...p, cambridgeBook: volumeKey },
      volumeKey,
      volumeLabel: meta.label,
      testNum: p.testNum,
      passageNum: p.passageNum,
      progress,
    };

    if (!byVolume.has(volumeKey)) {
      byVolume.set(volumeKey, new Map());
    }
    const testMap = byVolume.get(volumeKey)!;
    if (!testMap.has(p.testNum)) {
      testMap.set(p.testNum, []);
    }
    testMap.get(p.testNum)!.push(item);
  }

  const orderedVolumeKeys = sortVolumeKeys(Array.from(byVolume.keys()));

  return orderedVolumeKeys.map(volumeKey => {
    const meta = getVolumeDisplayMeta(volumeKey);
    const testMap = byVolume.get(volumeKey)!;
    const sortedTestNums = Array.from(testMap.keys()).sort((a, b) => a - b);

    let volumeCompleted = 0;
    let volumeTotal = 0;

    const tests: WorkbookTestGroup<WorkbookPassageItem>[] = sortedTestNums.map(testNum => {
      const items = testMap.get(testNum)!.sort((a, b) => a.passageNum - b.passageNum);
      const completedCount = items.filter(i => i.progress.status === 'completed').length;
      const inProgressCount = items.filter(i => i.progress.status === 'in_progress').length;
      const earnedCorrect = items.reduce((sum, i) => sum + (i.progress.correctCount || 0), 0);
      const earnedTotalQuestions = items
        .filter(i => i.progress.status === 'completed')
        .reduce((sum, i) => sum + i.progress.totalQuestions, 0);
      const totalQuestionsInTest = items.reduce((sum, i) => sum + i.progress.totalQuestions, 0);
      const totalHitCount = items.reduce((sum, i) => sum + i.progress.hitCount, 0);

      volumeCompleted += completedCount;
      volumeTotal += items.length;

      return {
        volumeKey,
        volumeLabel: meta.label,
        testNum,
        testTitle: `Test ${testNum}`,
        items,
        completedCount,
        inProgressCount,
        totalItems: items.length,
        earnedCorrect,
        earnedTotalQuestions,
        totalQuestionsInTest,
        totalHitCount,
        isTestCompleted: items.length > 0 && completedCount === items.length,
      };
    });

    return {
      volumeKey,
      volumeLabel: meta.label,
      volumeShortBadge: getVolumeShortBadge(volumeKey),
      volumeSubtitle: meta.subtitle,
      tests,
      completedItemsCount: volumeCompleted,
      totalItemsCount: volumeTotal,
    };
  });
}

/**
 * Builds the structured Listening Workbook Catalog:
 * Volume -> Test 1..4 -> Section 1..4
 */
export function buildListeningWorkbookCatalog(
  sections: IELTSListeningSection[],
  hitStatsMap: Record<string, HitStatsEntry>,
  listeningRecords: Record<string, ListeningCompletionRecord>,
  draftsMap: Record<string, Record<number, string>>
): WorkbookVolumeGroup<WorkbookListeningItem>[] {
  const byVolume = new Map<string, Map<number, WorkbookListeningItem[]>>();

  const slotMap = new Map<string, IELTSListeningSection>();
  for (const s of sections) {
    const volumeKey = normalizeVolumeKey(s.cambridgeBook);
    const slotKey = `${volumeKey}__T${s.testNum}__S${s.sectionNum}`;
    const existing = slotMap.get(slotKey);
    if (!existing) {
      slotMap.set(slotKey, s);
    } else {
      const existingQ = existing.questions?.length || 0;
      const newQ = s.questions?.length || 0;
      if (newQ > existingQ) {
        slotMap.set(slotKey, s);
      }
    }
  }

  for (const s of slotMap.values()) {
    const volumeKey = normalizeVolumeKey(s.cambridgeBook);
    const meta = getVolumeDisplayMeta(volumeKey);
    const progress = computeListeningSectionProgress(s, listeningRecords, draftsMap, hitStatsMap[s.id]);

    const item: WorkbookListeningItem = {
      section: { ...s, cambridgeBook: volumeKey },
      volumeKey,
      volumeLabel: meta.label,
      testNum: s.testNum,
      sectionNum: s.sectionNum,
      progress,
    };

    if (!byVolume.has(volumeKey)) {
      byVolume.set(volumeKey, new Map());
    }
    const testMap = byVolume.get(volumeKey)!;
    if (!testMap.has(s.testNum)) {
      testMap.set(s.testNum, []);
    }
    testMap.get(s.testNum)!.push(item);
  }

  const orderedVolumeKeys = sortVolumeKeys(Array.from(byVolume.keys()));

  return orderedVolumeKeys.map(volumeKey => {
    const meta = getVolumeDisplayMeta(volumeKey);
    const testMap = byVolume.get(volumeKey)!;
    const sortedTestNums = Array.from(testMap.keys()).sort((a, b) => a - b);

    let volumeCompleted = 0;
    let volumeTotal = 0;

    const tests: WorkbookTestGroup<WorkbookListeningItem>[] = sortedTestNums.map(testNum => {
      const items = testMap.get(testNum)!.sort((a, b) => a.sectionNum - b.sectionNum);
      const completedCount = items.filter(i => i.progress.status === 'completed').length;
      const inProgressCount = items.filter(i => i.progress.status === 'in_progress').length;
      const earnedCorrect = items.reduce((sum, i) => sum + (i.progress.correctCount || 0), 0);
      const earnedTotalQuestions = items
        .filter(i => i.progress.status === 'completed')
        .reduce((sum, i) => sum + i.progress.totalQuestions, 0);
      const totalQuestionsInTest = items.reduce((sum, i) => sum + i.progress.totalQuestions, 0);
      const totalHitCount = items.reduce((sum, i) => sum + i.progress.hitCount, 0);

      volumeCompleted += completedCount;
      volumeTotal += items.length;

      return {
        volumeKey,
        volumeLabel: meta.label,
        testNum,
        testTitle: `Test ${testNum}`,
        items,
        completedCount,
        inProgressCount,
        totalItems: items.length,
        earnedCorrect,
        earnedTotalQuestions,
        totalQuestionsInTest,
        totalHitCount,
        isTestCompleted: items.length > 0 && completedCount === items.length,
      };
    });

    return {
      volumeKey,
      volumeLabel: meta.label,
      volumeShortBadge: getVolumeShortBadge(volumeKey),
      volumeSubtitle: meta.subtitle,
      tests,
      completedItemsCount: volumeCompleted,
      totalItemsCount: volumeTotal,
    };
  });
}

/**
 * Returns ordered sibling passages [P1, P2, P3] belonging to the same Volume & Test number.
 */
export function getSiblingPassages(
  allPassages: CambridgePassage[],
  currentPassage: CambridgePassage
): CambridgePassage[] {
  const targetVolume = normalizeVolumeKey(currentPassage.cambridgeBook);
  const targetTest = currentPassage.testNum;

  const byPassageNum = new Map<number, CambridgePassage>();
  for (const p of allPassages) {
    if (normalizeVolumeKey(p.cambridgeBook) === targetVolume && p.testNum === targetTest) {
      const existing = byPassageNum.get(p.passageNum);
      if (
        !existing ||
        p.id === currentPassage.id ||
        (p.questions?.length || 0) > (existing.questions?.length || 0)
      ) {
        byPassageNum.set(p.passageNum, { ...p, cambridgeBook: targetVolume });
      }
    }
  }
  return Array.from(byPassageNum.values()).sort((a, b) => a.passageNum - b.passageNum);
}

/**
 * Returns ordered sibling listening sections [S1, S2, S3, S4] belonging to the same Volume & Test number.
 */
export function getSiblingListeningSections(
  allSections: IELTSListeningSection[],
  currentSection: IELTSListeningSection
): IELTSListeningSection[] {
  const targetVolume = normalizeVolumeKey(currentSection.cambridgeBook);
  const targetTest = currentSection.testNum;

  const bySectionNum = new Map<number, IELTSListeningSection>();
  for (const s of allSections) {
    if (normalizeVolumeKey(s.cambridgeBook) === targetVolume && s.testNum === targetTest) {
      const existing = bySectionNum.get(s.sectionNum);
      if (
        !existing ||
        s.id === currentSection.id ||
        (s.questions?.length || 0) > (existing.questions?.length || 0)
      ) {
        bySectionNum.set(s.sectionNum, { ...s, cambridgeBook: targetVolume });
      }
    }
  }
  return Array.from(bySectionNum.values()).sort((a, b) => a.sectionNum - b.sectionNum);
}

export interface NextSequentialPassageResult {
  next: CambridgePassage | null;
  nextPassage: CambridgePassage | null;
  isSameTest: boolean;
  isSameVolume: boolean;
  buttonLabel: string;
}

/**
 * Finds the next sequential passage in workbook order (P1 -> P2 -> P3 -> Next Test P1).
 */
export function resolveNextSequentialPassage(
  allPassages: CambridgePassage[],
  currentPassage?: CambridgePassage | null
): NextSequentialPassageResult {
  const catalog = buildReadingWorkbookCatalog(allPassages, {}, [], {});
  const flatItems: WorkbookPassageItem[] = [];
  for (const vol of catalog) {
    for (const test of vol.tests) {
      for (const item of test.items) {
        flatItems.push(item);
      }
    }
  }
  if (flatItems.length === 0 || !currentPassage) {
    return {
      next: null,
      nextPassage: null,
      isSameTest: false,
      isSameVolume: false,
      buttonLabel: '',
    };
  }

  const currentVol = normalizeVolumeKey(currentPassage.cambridgeBook);
  const currentIdx = flatItems.findIndex(
    item =>
      item.passage.id === currentPassage.id ||
      (item.volumeKey === currentVol &&
        item.testNum === currentPassage.testNum &&
        item.passageNum === currentPassage.passageNum)
  );

  const nextItem =
    currentIdx >= 0 && currentIdx + 1 < flatItems.length
      ? flatItems[currentIdx + 1]
      : flatItems[0];

  const isSameVolume = nextItem.volumeKey === currentVol;
  const isSameTest = isSameVolume && nextItem.testNum === currentPassage.testNum;

  const buttonLabel = isSameTest
    ? `顺刷下一篇 · Passage ${nextItem.passageNum}`
    : isSameVolume
      ? `开启下一套 · Test ${nextItem.testNum} · Passage ${nextItem.passageNum}`
      : `进入下一册 · ${getVolumeShortBadge(nextItem.volumeKey)} Test ${nextItem.testNum}`;

  return {
    next: nextItem.passage,
    nextPassage: nextItem.passage,
    isSameTest,
    isSameVolume,
    buttonLabel,
  };
}

export interface NextSequentialListeningResult {
  next: IELTSListeningSection | null;
  nextSection: IELTSListeningSection | null;
  isSameTest: boolean;
  isSameVolume: boolean;
  buttonLabel: string;
}

/**
 * Finds the next sequential listening section in workbook order (S1 -> S2 -> S3 -> S4 -> Next Test S1).
 */
export function resolveNextSequentialListening(
  allSections: IELTSListeningSection[],
  currentSection?: IELTSListeningSection | null
): NextSequentialListeningResult {
  const catalog = buildListeningWorkbookCatalog(allSections, {}, {}, {});
  const flatItems: WorkbookListeningItem[] = [];
  for (const vol of catalog) {
    for (const test of vol.tests) {
      for (const item of test.items) {
        flatItems.push(item);
      }
    }
  }
  if (flatItems.length === 0 || !currentSection) {
    return {
      next: null,
      nextSection: null,
      isSameTest: false,
      isSameVolume: false,
      buttonLabel: '',
    };
  }

  const currentVol = normalizeVolumeKey(currentSection.cambridgeBook);
  const currentIdx = flatItems.findIndex(
    item =>
      item.section.id === currentSection.id ||
      (item.volumeKey === currentVol &&
        item.testNum === currentSection.testNum &&
        item.sectionNum === currentSection.sectionNum)
  );

  const nextItem =
    currentIdx >= 0 && currentIdx + 1 < flatItems.length
      ? flatItems[currentIdx + 1]
      : flatItems[0];

  const isSameVolume = nextItem.volumeKey === currentVol;
  const isSameTest = isSameVolume && nextItem.testNum === currentSection.testNum;

  const buttonLabel = isSameTest
    ? `顺刷下一节 · Section ${nextItem.sectionNum}`
    : isSameVolume
      ? `开启下一套 · Test ${nextItem.testNum} · Section ${nextItem.sectionNum}`
      : `进入下一册 · ${getVolumeShortBadge(nextItem.volumeKey)} Test ${nextItem.testNum}`;

  return {
    next: nextItem.section,
    nextSection: nextItem.section,
    isSameTest,
    isSameVolume,
    buttonLabel,
  };
}

export interface ReadingBookmarkResolution {
  targetItem: WorkbookPassageItem;
  testGroup: WorkbookTestGroup<WorkbookPassageItem>;
  volumeGroup: WorkbookVolumeGroup<WorkbookPassageItem>;
  isResume: boolean;
}

export function resolveReadingBookmarkTarget(
  catalog: WorkbookVolumeGroup<WorkbookPassageItem>[],
  bookmarkPassageId?: string | null
): ReadingBookmarkResolution | null {
  if (catalog.length === 0) return null;

  const flatRefs: {
    item: WorkbookPassageItem;
    test: WorkbookTestGroup<WorkbookPassageItem>;
    vol: WorkbookVolumeGroup<WorkbookPassageItem>;
  }[] = [];

  for (const vol of catalog) {
    for (const test of vol.tests) {
      for (const item of test.items) {
        flatRefs.push({ item, test, vol });
      }
    }
  }

  if (flatRefs.length === 0) return null;

  if (bookmarkPassageId) {
    const idx = flatRefs.findIndex(r => r.item.passage.id === bookmarkPassageId);
    if (idx !== -1) {
      const ref = flatRefs[idx];
      if (ref.item.progress.status !== 'completed') {
        return {
          targetItem: ref.item,
          testGroup: ref.test,
          volumeGroup: ref.vol,
          isResume: true,
        };
      }
      for (let i = idx + 1; i < flatRefs.length; i++) {
        if (flatRefs[i].item.progress.status !== 'completed') {
          return {
            targetItem: flatRefs[i].item,
            testGroup: flatRefs[i].test,
            volumeGroup: flatRefs[i].vol,
            isResume: true,
          };
        }
      }
    }
  }

  const inProgressRef = flatRefs.find(r => r.item.progress.status === 'in_progress');
  if (inProgressRef) {
    return {
      targetItem: inProgressRef.item,
      testGroup: inProgressRef.test,
      volumeGroup: inProgressRef.vol,
      isResume: true,
    };
  }

  for (const vol of catalog) {
    for (const test of vol.tests) {
      if (test.completedCount > 0 && test.completedCount < test.totalItems) {
        const nextInTest = test.items.find(i => i.progress.status !== 'completed');
        if (nextInTest) {
          return {
            targetItem: nextInTest,
            testGroup: test,
            volumeGroup: vol,
            isResume: true,
          };
        }
      }
    }
  }

  const firstUncompleted = flatRefs.find(r => r.item.progress.status !== 'completed') || flatRefs[0];
  const anyCompleted = flatRefs.some(r => r.item.progress.status === 'completed');

  return {
    targetItem: firstUncompleted.item,
    testGroup: firstUncompleted.test,
    volumeGroup: firstUncompleted.vol,
    isResume: anyCompleted,
  };
}

export interface ListeningBookmarkResolution {
  targetItem: WorkbookListeningItem;
  testGroup: WorkbookTestGroup<WorkbookListeningItem>;
  volumeGroup: WorkbookVolumeGroup<WorkbookListeningItem>;
  isResume: boolean;
}

export function resolveListeningBookmarkTarget(
  catalog: WorkbookVolumeGroup<WorkbookListeningItem>[],
  bookmarkSectionId?: string | null
): ListeningBookmarkResolution | null {
  if (catalog.length === 0) return null;

  const flatRefs: {
    item: WorkbookListeningItem;
    test: WorkbookTestGroup<WorkbookListeningItem>;
    vol: WorkbookVolumeGroup<WorkbookListeningItem>;
  }[] = [];

  for (const vol of catalog) {
    for (const test of vol.tests) {
      for (const item of test.items) {
        flatRefs.push({ item, test, vol });
      }
    }
  }

  if (flatRefs.length === 0) return null;

  if (bookmarkSectionId) {
    const idx = flatRefs.findIndex(r => r.item.section.id === bookmarkSectionId);
    if (idx !== -1) {
      const ref = flatRefs[idx];
      if (ref.item.progress.status !== 'completed') {
        return {
          targetItem: ref.item,
          testGroup: ref.test,
          volumeGroup: ref.vol,
          isResume: true,
        };
      }
      for (let i = idx + 1; i < flatRefs.length; i++) {
        if (flatRefs[i].item.progress.status !== 'completed') {
          return {
            targetItem: flatRefs[i].item,
            testGroup: flatRefs[i].test,
            volumeGroup: flatRefs[i].vol,
            isResume: true,
          };
        }
      }
    }
  }

  const inProgressRef = flatRefs.find(r => r.item.progress.status === 'in_progress');
  if (inProgressRef) {
    return {
      targetItem: inProgressRef.item,
      testGroup: inProgressRef.test,
      volumeGroup: inProgressRef.vol,
      isResume: true,
    };
  }

  for (const vol of catalog) {
    for (const test of vol.tests) {
      if (test.completedCount > 0 && test.completedCount < test.totalItems) {
        const nextInTest = test.items.find(i => i.progress.status !== 'completed');
        if (nextInTest) {
          return {
            targetItem: nextInTest,
            testGroup: test,
            volumeGroup: vol,
            isResume: true,
          };
        }
      }
    }
  }

  const firstUncompleted = flatRefs.find(r => r.item.progress.status !== 'completed') || flatRefs[0];
  const anyCompleted = flatRefs.some(r => r.item.progress.status === 'completed');

  return {
    targetItem: firstUncompleted.item,
    testGroup: firstUncompleted.test,
    volumeGroup: firstUncompleted.vol,
    isResume: anyCompleted,
  };
}
