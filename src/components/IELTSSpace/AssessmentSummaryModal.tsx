import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../../store/useAppStore';
import { speakWord } from '../../utils/audioEngine';
import { db, toggleWordStar } from '../../db';
import { WordItem, IELTSTestRecord, IELTSQuestion } from '../../types';
import { TopHeader } from '../TopHeader';
import {
  getCompleteWorkbookPassages,
  resolveNextSequentialPassage,
  getSiblingPassages,
  normalizeVolumeKey
} from '../../utils/ieltsWorkbookEngine';
import { getPassageBilingualMeta } from '../../data/ieltsTopicSynonyms';
import {
  lookupInIeltsCorpus,
  estimateIpaPhonetics
} from '../../utils/ieltsCorpusDictionary';
import { formatPartOfSpeech } from '../../utils/lyricDictionary';
import {
  Star,
  Volume2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  MinusCircle
} from 'lucide-react';

// Specialized academic vocabulary fallback map for compound or domain-specific IELTS passage terms
const ACADEMIC_TERM_FALLBACKS: Record<
  string,
  { uk: string; pos: string; cn: string; en: string }
> = {
  microclimate: {
    uk: '/ˈmaɪ.krəʊˌklaɪ.mət/',
    pos: 'n. 名词',
    cn: 'n. 微气候，局部小气候（如建筑垂直森林形成的小型温湿度环境）',
    en: 'The climate of a very small or restricted area, especially when this differs from the climate of the surrounding area.'
  },
  rewilding: {
    uk: '/ˌriːˈwaɪl.dɪŋ/',
    pos: 'n. 名词',
    cn: 'n. 再野化，生态自然恢复（引回本土物种并减少人工干预的生态工程）',
    en: 'The restoration of an area of land to its natural uncultivated state, especially by reintroducing native species.'
  },
  mitigation: {
    uk: '/ˌmɪt.ɪˈɡeɪ.ʃən/',
    pos: 'n. 名词',
    cn: 'n. 缓解，减轻，减缓（气候变化或环境风险的减缓措施）',
    en: 'The action of reducing the severity, seriousness, or painfulness of something.'
  },
  biodiversity: {
    uk: '/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/',
    pos: 'n. 名词',
    cn: 'n. 生物多样性（特定栖息地或生态系统中的物种丰富程度）',
    en: 'The variety of plant and animal life in the world or in a particular habitat.'
  },
  canopy: {
    uk: '/ˈkæn.ə.pi/',
    pos: 'n. 名词',
    cn: 'n. 树冠层，林冠；天篷（森林顶部由树枝和树叶交织形成的覆盖层）',
    en: 'The uppermost branches of the trees in a forest, forming a more or less continuous layer of foliage.'
  },
  monoculture: {
    uk: '/ˈmɒn.əˌkʌl.tʃər/',
    pos: 'n. 名词',
    cn: 'n. 单一栽培，单一种植（大面积仅种植单一植物物种的农业或园林模式）',
    en: 'The cultivation of a single crop or plant species in a given area.'
  },
  evapotranspiration: {
    uk: '/ɪˌvæp.əʊ.træn.spɪˈreɪ.ʃən/',
    pos: 'n. 名词',
    cn: 'n. 蒸散作用，蒸发蒸腾（土壤水分蒸发与植物叶面蒸腾的总和）',
    en: 'The process by which water is transferred from the land to the atmosphere by evaporation and plant transpiration.'
  },
  particulate: {
    uk: '/pɑːˈtɪk.jə.lət/',
    pos: 'n. / adj.',
    cn: 'n. 微粒，颗粒物（如大气中的 PM2.5 / PM10 悬浮细颗粒物）',
    en: 'Matter in the form of minute separate particles, especially atmospheric pollutants.'
  },
  corridor: {
    uk: '/ˈkɒr.ɪ.dɔːr/',
    pos: 'n. 名词',
    cn: 'n. 生态廊道，迁徙走廊；走廊（连接孤立栖息地供野生动物迁徙的通道）',
    en: 'A strip of habitat connecting wildlife populations otherwise separated by human activities or structures.'
  },
  piezoelectric: {
    uk: '/piˌeɪ.zəʊ.ɪˈlek.trɪk/',
    pos: 'adj. 形容词',
    cn: 'adj. 压电的，压电效应的（机械压力与电荷相互转换的材料特性）',
    en: 'Relating to or denoting electric polarization in a substance resulting from the application of mechanical stress.'
  },
  composite: {
    uk: '/ˈkɒm.pə.zɪt/',
    pos: 'n. / adj.',
    cn: 'n. 复合材料；adj. 合成的，复合的',
    en: 'A thing made up of several parts or elements, especially a structural material made from combined fibers and resins.'
  },
  synthetic: {
    uk: '/sɪnˈθet.ɪk/',
    pos: 'adj. 形容词',
    cn: 'adj. 人造的，合成的；综合的（通过化学合成而非天然提取的材料）',
    en: 'Made by chemical synthesis, especially to imitate a natural product.'
  },
  vibration: {
    uk: '/vaɪˈbreɪ.ʃən/',
    pos: 'n. 名词',
    cn: 'n. 振动，震动；谐振（物体围绕平衡位置进行的往复机械运动）',
    en: 'An oscillation of the parts of a fluid or an elastic solid whose equilibrium has been disturbed.'
  }
};

/**
 * Resolves the 0-based paragraph index (0 = Para A, 1 = Para B, ...) for a question
 */
function resolveQuestionParagraphIndex(
  q: IELTSQuestion,
  qIdx: number,
  passageText?: string
): number {
  const paragraphs = (passageText || '')
    .split('\n\n')
    .map(p => p.trim())
    .filter(Boolean);
  const maxPara = Math.max(0, paragraphs.length - 1);

  const qWithMeta = q as IELTSQuestion & { evidenceParagraphIndex?: number };
  if (typeof qWithMeta.evidenceParagraphIndex === 'number' && qWithMeta.evidenceParagraphIndex >= 0) {
    return Math.min(maxPara, qWithMeta.evidenceParagraphIndex);
  }

  // Match "Paragraph A", "Paragraph B", "Para C" in explanation or prompt
  const combinedText = `${q.explanation || ''} ${q.prompt || ''}`;
  const paraMatch = combinedText.match(/Paragraph\s+([A-H])/i) || combinedText.match(/Para\s+([A-H])\b/i);
  if (paraMatch && paraMatch[1]) {
    const letterIdx = paraMatch[1].toUpperCase().charCodeAt(0) - 65;
    if (letterIdx >= 0) return Math.min(maxPara, letterIdx);
  }

  // Match keyword overlap in paragraphs if passageText is available
  if (paragraphs.length > 0) {
    const targetVocab = (q.targetVocab || '').trim().toLowerCase();
    if (targetVocab) {
      const vocabParaIdx = paragraphs.findIndex(p => p.toLowerCase().includes(targetVocab));
      if (vocabParaIdx >= 0) return vocabParaIdx;
    }

    const promptWords = (q.prompt || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 5);

    let bestPara = 0;
    let bestScore = -1;
    paragraphs.forEach((p, idx) => {
      const lowerP = p.toLowerCase();
      let score = 0;
      promptWords.forEach(w => {
        if (lowerP.includes(w)) score += 1;
      });
      if (score > bestScore) {
        bestScore = score;
        bestPara = idx;
      }
    });
    if (bestScore > 0) return bestPara;
  }

  // Fallback proportional mapping across passage paragraphs
  if (paragraphs.length > 1) {
    return Math.min(maxPara, Math.floor((qIdx / 13) * paragraphs.length));
  }
  return 0;
}

function estimateFullTestBand(correct: number, total: number): number {
  if (total <= 0) return 5.0;
  const scaledOut40 = Math.round((correct / total) * 40);
  if (scaledOut40 >= 39) return 9.0;
  if (scaledOut40 >= 37) return 8.5;
  if (scaledOut40 >= 35) return 8.0;
  if (scaledOut40 >= 33) return 7.5;
  if (scaledOut40 >= 30) return 7.0;
  if (scaledOut40 >= 27) return 6.5;
  if (scaledOut40 >= 23) return 6.0;
  if (scaledOut40 >= 19) return 5.5;
  return 5.0;
}

export const AssessmentSummaryModal: React.FC = () => {
  const assessmentResult = useAppStore(s => s.assessmentResult);
  const isAssessmentModalOpen = useAppStore(s => s.isAssessmentModalOpen);
  const setAssessmentModalOpen = useAppStore(s => s.setAssessmentModalOpen);
  const setActiveSpace = useAppStore(s => s.setActiveSpace);
  const openWordDetail = useAppStore(s => s.openWordDetail);
  const openNotebook = useAppStore(s => s.openNotebook);
  const showToast = useAppStore(s => s.showToast);
  const currentPassageId = useAppStore(s => s.currentPassageId);
  const loadCambridgePassage = useAppStore(s => s.loadCambridgePassage);
  const setCurrentQuizQuestionIndex = useAppStore(s => s.setCurrentQuizQuestionIndex);
  const setPendingEvidenceJumpPara = useAppStore(s => s.setPendingEvidenceJumpPara);

  const [activeTab, setActiveTab] = useState<'words' | 'questions'>('words');

  // Trigger celebration confetti if band >= 7.0
  useEffect(() => {
    if (isAssessmentModalOpen && assessmentResult && assessmentResult.bandScore >= 7.0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#516050', '#CBD5C8', '#E6DFD5', '#F59E0B']
      });
    }
  }, [isAssessmentModalOpen, assessmentResult]);

  // Query words & test records from Dexie
  const allDbWords = useLiveQuery(() => db.words.toArray(), []) || [];
  const allTestRecords = useLiveQuery(() => db.ieltsTests.toArray(), []) || [];

  const dbWordMap = useMemo(() => {
    const map = new Map<string, WordItem>();
    allDbWords.forEach(w => {
      if (w.word) map.set(w.word.toLowerCase(), w);
    });
    return map;
  }, [allDbWords]);

  const customPassages = useLiveQuery(() => db.customPassages.toArray(), []) || [];
  const allWorkbookPassages = useMemo(
    () => getCompleteWorkbookPassages(customPassages),
    [customPassages]
  );

  const currentPassageObj = useMemo(() => {
    return (
      allWorkbookPassages.find(p => p.id === currentPassageId) ||
      allWorkbookPassages.find(p => p.title === assessmentResult?.passageTitle) ||
      null
    );
  }, [allWorkbookPassages, currentPassageId, assessmentResult?.passageTitle]);

  const bilingualTitleMeta = useMemo(() => {
    return getPassageBilingualMeta({
      title: assessmentResult?.passageTitle || currentPassageObj?.title || 'Cambridge Academic Reading',
      category: currentPassageObj?.category
    });
  }, [assessmentResult?.passageTitle, currentPassageObj]);

  const nextSequential = useMemo(() => {
    return resolveNextSequentialPassage(allWorkbookPassages, currentPassageObj);
  }, [allWorkbookPassages, currentPassageObj]);

  // Build Test 1–3 sibling summary for full-test completion ritual (Item 4)
  const testSuiteSummary = useMemo(() => {
    if (!currentPassageObj) return null;
    const siblings = getSiblingPassages(allWorkbookPassages, currentPassageObj);
    if (siblings.length <= 1) return null;

    const latestByTitle = new Map<string, IELTSTestRecord>();
    allTestRecords.forEach(r => {
      if (r.passageTitle) {
        const prev = latestByTitle.get(r.passageTitle);
        if (!prev || r.timestamp >= prev.timestamp) {
          latestByTitle.set(r.passageTitle, r);
        }
      }
    });
    // Ensure current assessmentResult is reflected immediately
    if (assessmentResult?.passageTitle) {
      latestByTitle.set(assessmentResult.passageTitle, assessmentResult);
    }

    const items = siblings.map(sib => {
      const isCurrent = sib.id === currentPassageObj.id || sib.title === assessmentResult?.passageTitle;
      const rec = isCurrent && assessmentResult ? assessmentResult : latestByTitle.get(sib.title);
      return {
        passageNum: sib.passageNum,
        title: sib.title,
        isCurrent,
        isCompleted: Boolean(rec),
        correct: rec ? rec.correctCount : 0,
        total: rec ? rec.totalQuestions : sib.questions.length || 13
      };
    });

    const completedCount = items.filter(i => i.isCompleted).length;
    const isAllCompleted = completedCount === items.length;
    const totalCorrect = items.reduce((acc, i) => acc + (i.isCompleted ? i.correct : 0), 0);
    const totalQuestions = items.reduce((acc, i) => acc + i.total, 0);
    const suiteBand = estimateFullTestBand(totalCorrect, totalQuestions);

    return {
      testNum: currentPassageObj.testNum,
      items,
      completedCount,
      totalCount: items.length,
      isAllCompleted,
      isFinalPassageOfTest: currentPassageObj.passageNum === siblings[siblings.length - 1]?.passageNum,
      totalCorrect,
      totalQuestions,
      suiteBand
    };
  }, [currentPassageObj, allWorkbookPassages, allTestRecords, assessmentResult]);

  const handleReturnToSong = () => {
    setAssessmentModalOpen(false);
    setActiveSpace(1);
  };

  const handleStartNextPassage = () => {
    if (!nextSequential.next) return;
    setAssessmentModalOpen(false);
    loadCambridgePassage(nextSequential.next);
    showToast(
      nextSequential.isSameTest
        ? `已顺刷进入 Test ${nextSequential.next.testNum} · Passage ${nextSequential.next.passageNum}`
        : `已开启下一套 Test ${nextSequential.next.testNum} · Passage 1`
    );
  };

  const handleLocateInPassage = (q: IELTSQuestion, qIdx: number) => {
    const paraIdx = resolveQuestionParagraphIndex(
      q,
      qIdx,
      assessmentResult?.passageText || currentPassageObj?.text
    );
    setCurrentQuizQuestionIndex(qIdx);
    setPendingEvidenceJumpPara(paraIdx);
    setAssessmentModalOpen(false);
  };

  const handleToggleStar = async (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    await toggleWordStar(word);
    showToast('已更新生词本收藏状态');
  };

  const isAnswerCorrect = (userAns?: string, correctAns?: string): boolean => {
    if (!userAns || !correctAns) return false;
    const u = userAns.trim().toLowerCase();
    const c = correctAns.trim().toLowerCase();
    if (u === c) return true;
    if (c.startsWith(u + '.') || c.startsWith(u + ' ') || c.startsWith(u + ')')) return true;
    if (u.startsWith(c + '.') || u.startsWith(c + ' ') || u.startsWith(c + ')')) return true;
    return false;
  };

  // Build passage academic vocabulary list (combining conquered words + passage question targetVocab)
  const dynamicWords = useMemo(() => {
    if (!assessmentResult) return [];
    const conqueredSet = new Set(
      (assessmentResult.conqueredWords || []).map(w => w.trim().toLowerCase()).filter(Boolean)
    );
    const questionVocabList = (assessmentResult.questions || [])
      .map(q => (q.targetVocab || '').trim())
      .filter(Boolean);

    const combinedRaw = [
      ...(assessmentResult.conqueredWords || []),
      ...questionVocabList
    ];
    const uniqueWords = Array.from(
      new Set(combinedRaw.map(w => w.trim().toLowerCase()).filter(Boolean))
    );

    const effectiveList =
      uniqueWords.length > 0
        ? uniqueWords
        : ['microclimate', 'rewilding', 'mitigation', 'biodiversity', 'canopy'];

    return effectiveList.map(wordStr => {
      const isConquered = conqueredSet.has(wordStr);
      const dbMatch = dbWordMap.get(wordStr);
      const corpusMatch = lookupInIeltsCorpus(wordStr);
      const fallbackMatch = ACADEMIC_TERM_FALLBACKS[wordStr];
      const estIpa = estimateIpaPhonetics(wordStr);

      const hasRealDbCn =
        dbMatch?.definitionCn &&
        !dbMatch.definitionCn.includes('已在此次模考中掌握') &&
        !dbMatch.definitionCn.includes('学术语境核心掌握词汇');
      const hasRealDbPhonetic =
        dbMatch?.phoneticUk &&
        dbMatch.phoneticUk.toLowerCase() !== `/${wordStr.toLowerCase()}/`;

      const phonetic =
        (hasRealDbPhonetic ? dbMatch?.phoneticUk : undefined) ||
        fallbackMatch?.uk ||
        corpusMatch?.uk ||
        estIpa.uk;

      const rawPos =
        fallbackMatch?.pos ||
        corpusMatch?.pos ||
        (dbMatch?.partOfSpeech && dbMatch.partOfSpeech !== 'VOCAB' ? dbMatch.partOfSpeech : undefined);
      const partOfSpeech = formatPartOfSpeech(rawPos, wordStr);

      const definitionCn =
        (hasRealDbCn ? dbMatch?.definitionCn : undefined) ||
        fallbackMatch?.cn ||
        corpusMatch?.cn ||
        '雅思学术高频核心词汇';

      const definition =
        fallbackMatch?.en ||
        corpusMatch?.en ||
        dbMatch?.definition ||
        `Key academic term in ${assessmentResult.passageTitle || 'IELTS Reading'}.`;

      return {
        word: dbMatch?.word || wordStr,
        phonetic,
        partOfSpeech,
        definition,
        definitionCn,
        sources: [assessmentResult.passageTitle || 'IELTS Academic Reading'],
        isStarred: Boolean(dbMatch?.isStarred || (dbMatch?.masteryLevel ?? 0) > 0 || isConquered),
        isConquered
      };
    });
  }, [assessmentResult, dbWordMap]);

  const questions = assessmentResult?.questions || [];
  const answers = assessmentResult?.answers || {};
  const bandRatio = assessmentResult ? Math.min(1, Math.max(0, assessmentResult.bandScore / 9.0)) : 0;
  const ringRadius = 36;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - bandRatio);

  // Ensure #mobile-app-frame has zero scroll offset when opening full-screen modal
  useEffect(() => {
    if (isAssessmentModalOpen) {
      const frame = document.getElementById('mobile-app-frame');
      if (frame) {
        frame.scrollLeft = 0;
        frame.scrollTop = 0;
      }
    }
  }, [isAssessmentModalOpen]);

  const volumeDisplayLabel = useMemo(() => {
    if (!currentPassageObj) return 'ASSESSMENT REPORT';
    const norm = normalizeVolumeKey(currentPassageObj.cambridgeBook);
    return norm === '2026 考场真题' ? '2026 考季真题' : currentPassageObj.cambridgeBook;
  }, [currentPassageObj]);

  return (
    <AnimatePresence>
      {isAssessmentModalOpen && assessmentResult && (
        <motion.div
          key="assessment-summary-backdrop"
          data-no-swipe="true"
          data-no-gesture="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-[100] w-full h-full flex flex-col bg-[#FAF7F2] dark:bg-[#0B0F17] pointer-events-auto overflow-hidden select-none"
        >
          {/* Full-Screen Assessment Report View — Uses standard TopHeader for punch-hole safe area consistency */}
          <motion.div
            id="assessment-summary-sheet"
            initial={{ opacity: 0, y: 24, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.99 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full h-full flex flex-col bg-[#FAF7F2] dark:bg-[#0B0F17] overflow-hidden"
          >
            {/* Unified TopHeader — 100% consistent with IELTS / Music / AR punch-hole safe area */}
            <TopHeader
              centerLabel="ASSESSMENT REPORT"
              leftKey="assessment-back-arrow"
              leftIcon={
                <ArrowLeft className="w-4.5 h-4.5 group-hover:-translate-x-0.5 transition-transform" />
              }
              leftTitle="返回阅读原文 (Back to Passage)"
              onLeftClick={() => setAssessmentModalOpen(false)}
              onOpenNotebook={() => openNotebook('ALL')}
            />

            {/* Main Content Container */}
            <div className="flex-1 min-h-0 flex flex-col px-5 pt-1.5 pb-5 overflow-hidden">
              {/* 1. Clean Score Ring & Header Card (with Zero-Truncation Bilingual Title & Test Suite Summary Strip) */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="p-4 rounded-[24px] bg-white/95 dark:bg-[#121722]/95 border border-stone-200/75 dark:border-white/[0.08] mb-3.5 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-[#516050] dark:text-[#8FB996] font-semibold">
                      <span>{volumeDisplayLabel}</span>
                      {currentPassageObj && (
                        <>
                          <span className="text-stone-300 dark:text-stone-600">·</span>
                          <span>
                            T{currentPassageObj.testNum}·P{currentPassageObj.passageNum}
                          </span>
                        </>
                      )}
                      <span className="text-stone-300 dark:text-stone-600">·</span>
                      <span className="text-stone-400 dark:text-stone-500">
                        {assessmentResult.extensionCount && assessmentResult.extensionCount > 0
                          ? `EXTENDED (+${assessmentResult.extensionCount})`
                          : '20:00'}
                      </span>
                    </div>

                    {/* Bilingual Full Title — Zero Truncation */}
                    <h2 className="font-serif-luxury text-[15px] font-bold text-stone-900 dark:text-stone-50 tracking-tight leading-snug">
                      {bilingualTitleMeta.titleZh}
                    </h2>
                    <p className="font-serif-luxury text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                      {bilingualTitleMeta.titleEn}
                    </p>

                    {/* Unboxed Tabular Data Strip */}
                    <div className="flex items-center gap-2.5 pt-1 text-xs font-mono tabular-nums text-stone-500 dark:text-stone-400 whitespace-nowrap">
                      <span>
                        正确率{' '}
                        <strong className="text-stone-900 dark:text-stone-100 font-bold">
                          {assessmentResult.correctCount}/{assessmentResult.totalQuestions}
                        </strong>
                      </span>
                      <span className="text-stone-300 dark:text-stone-700">·</span>
                      <span>
                        用时{' '}
                        <strong className="text-stone-900 dark:text-stone-100 font-bold">
                          {Math.floor(assessmentResult.timeSpentSec / 60)}:
                          {(assessmentResult.timeSpentSec % 60).toString().padStart(2, '0')}
                        </strong>
                      </span>
                      <span className="text-stone-300 dark:text-stone-700">·</span>
                      <span>
                        词汇{' '}
                        <strong className="text-[#516050] dark:text-[#8FB996] font-bold">
                          +{dynamicWords.length}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Precision Animated SVG Band Ring */}
                  <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
                      <circle
                        cx="44"
                        cy="44"
                        r={ringRadius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="5"
                        className="text-stone-200/70 dark:text-white/[0.06]"
                      />
                      <motion.circle
                        cx="44"
                        cy="44"
                        r={ringRadius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={ringCircumference}
                        initial={{ strokeDashoffset: ringCircumference }}
                        animate={{ strokeDashoffset: ringDashOffset }}
                        transition={{ duration: 0.9, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="text-[#516050] dark:text-[#8FB996]"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400">
                        BAND
                      </span>
                      <span className="font-serif-luxury text-xl font-bold tabular-nums text-stone-900 dark:text-stone-50 leading-none mt-0.5">
                        {assessmentResult.bandScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Full-Test Suite Progress & Finale Strip (Item 4) */}
                {testSuiteSummary && (
                  <div className="mt-3 pt-2.5 border-t border-stone-200/60 dark:border-white/[0.06] flex items-center justify-between gap-2 text-[10.5px] font-mono tabular-nums">
                    <div className="flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar whitespace-nowrap">
                      <span className="text-stone-400 dark:text-stone-500 font-semibold">
                        Test {testSuiteSummary.testNum}
                      </span>
                      {testSuiteSummary.items.map((item, idx) => (
                        <React.Fragment key={`suite-sib-${item.passageNum}`}>
                          {idx > 0 && <span className="text-stone-300 dark:text-stone-700">·</span>}
                          <span
                            className={
                              item.isCurrent
                                ? 'text-[#516050] dark:text-[#8FB996] font-bold'
                                : item.isCompleted
                                ? 'text-stone-700 dark:text-stone-300 font-medium'
                                : 'text-stone-400 dark:text-stone-500'
                            }
                          >
                            P{item.passageNum}{' '}
                            {item.isCompleted ? `${item.correct}/${item.total}` : '待刷'}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>

                    {testSuiteSummary.isAllCompleted || testSuiteSummary.isFinalPassageOfTest ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#516050]/10 dark:bg-[#8FB996]/15 text-[#516050] dark:text-[#8FB996] font-semibold whitespace-nowrap shrink-0">
                        整卷 {testSuiteSummary.totalCorrect}/{testSuiteSummary.totalQuestions} · Band{' '}
                        {testSuiteSummary.suiteBand.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-stone-400 dark:text-stone-500 whitespace-nowrap shrink-0">
                        本套 {testSuiteSummary.completedCount}/{testSuiteSummary.totalCount} 篇
                      </span>
                    )}
                  </div>
                )}
              </motion.div>

              {/* 2. Apple-Style Segmented Switcher */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="p-1 rounded-2xl bg-stone-200/60 dark:bg-white/[0.05] border border-stone-200/50 dark:border-white/[0.04] flex items-center gap-1 mb-3.5 shrink-0"
              >
                <button
                  id="assessment-tab-words-btn"
                  type="button"
                  onClick={() => setActiveTab('words')}
                  className={`flex-1 py-2 rounded-[12px] text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'words'
                      ? 'bg-white dark:bg-[#182030] text-stone-900 dark:text-stone-100 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                  }`}
                >
                  掌握核心词{' '}
                  <span className="font-mono tabular-nums text-stone-400 ml-1">
                    {dynamicWords.length}
                  </span>
                </button>
                <button
                  id="assessment-tab-questions-btn"
                  type="button"
                  onClick={() => setActiveTab('questions')}
                  className={`flex-1 py-2 rounded-[12px] text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'questions'
                      ? 'bg-white dark:bg-[#182030] text-stone-900 dark:text-stone-100 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                  }`}
                >
                  全卷题目精析{' '}
                  <span className="font-mono tabular-nums text-stone-400 ml-1">
                    {questions.length}
                  </span>
                </button>
              </motion.div>

              {/* 3. Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto pr-0.5 space-y-2 no-scrollbar">
                <AnimatePresence mode="wait" initial={false}>
                  {activeTab === 'words' ? (
                    <motion.div
                      key="tab-words"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="rounded-[24px] bg-white/95 dark:bg-[#121722]/95 border border-stone-200/75 dark:border-white/[0.08] divide-y divide-stone-200/60 dark:divide-white/[0.06] overflow-hidden"
                    >
                      {dynamicWords.map((item, idx) => (
                        <div
                          key={`word-item-${item.word}-${idx}`}
                          onClick={() => {
                            openWordDetail({
                              word: item.word,
                              phoneticUk: item.phonetic,
                              phoneticUs: item.phonetic,
                              partOfSpeech: item.partOfSpeech,
                              definition: item.definition,
                              definitionCn: item.definitionCn,
                              examples: [
                                {
                                  en: item.definition,
                                  cn: item.definitionCn,
                                  source: item.sources[0]
                                }
                              ],
                              sourceContext: item.sources[0],
                              isStarred: item.isStarred,
                              addedTimestamp: Date.now()
                            });
                          }}
                          className="p-4 hover:bg-stone-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
                                <h4 className="font-serif-luxury text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#516050] dark:group-hover:text-[#8FB996] transition-colors capitalize shrink-0">
                                  {item.word}
                                </h4>
                                {/* Full Phonetic Display — Zero Truncation (Item 1) */}
                                <span className="font-mono text-[11px] tracking-tight text-stone-400 whitespace-nowrap">
                                  {item.phonetic}
                                </span>
                              </div>
                              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                                {item.definitionCn}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakWord(item.word, 'en-GB');
                                }}
                                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-400 hover:text-stone-700 cursor-pointer"
                                title="朗读发音"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleToggleStar(e, item.word)}
                                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
                                title="收藏至生词本"
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${
                                    item.isStarred
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-stone-300 dark:text-stone-600'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="tab-questions"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="rounded-[24px] bg-white/95 dark:bg-[#121722]/95 border border-stone-200/75 dark:border-white/[0.08] divide-y divide-stone-200/60 dark:divide-white/[0.06] overflow-hidden"
                    >
                      {questions.map((q, qIdx) => {
                        const userAns = answers[q.id];
                        const isAnswered = Boolean(userAns && userAns.trim().length > 0);
                        const isCorrect = isAnswerCorrect(userAns, q.correctAnswer);
                        const paraIdx = resolveQuestionParagraphIndex(
                          q,
                          qIdx,
                          assessmentResult.passageText || currentPassageObj?.text
                        );
                        const paraLetter = String.fromCharCode(65 + paraIdx);

                        return (
                          <div
                            key={`summary-q-${q.id ?? ''}-${qIdx}`}
                            onClick={() => handleLocateInPassage(q, qIdx)}
                            className="p-4 space-y-2 hover:bg-stone-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                              <span className="text-stone-400">
                                <strong className="text-stone-900 dark:text-stone-100 font-bold">
                                  Q{qIdx + 1}
                                </strong>{' '}
                                · {q.type || 'READING'}
                              </span>

                              <div className="flex items-center gap-2">
                                {isCorrect ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> 回答正确
                                  </span>
                                ) : isAnswered ? (
                                  <span className="text-rose-500 dark:text-rose-400 flex items-center gap-1 font-semibold">
                                    <XCircle className="w-3.5 h-3.5" /> 回答错误
                                  </span>
                                ) : (
                                  <span className="text-stone-400 dark:text-stone-500 flex items-center gap-1 font-medium">
                                    <MinusCircle className="w-3.5 h-3.5" /> 未作答
                                  </span>
                                )}

                                {/* Direct Jump to Evidence Paragraph Button (Item 2) */}
                                <button
                                  type="button"
                                  id={`locate-para-btn-q${qIdx + 1}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLocateInPassage(q, qIdx);
                                  }}
                                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-stone-100 hover:bg-[#516050] dark:bg-white/[0.06] dark:hover:bg-[#8FB996] text-stone-600 hover:text-white dark:text-stone-300 dark:hover:text-stone-950 text-[10px] font-sans-ui font-medium transition-colors cursor-pointer"
                                  title={`跳转到原文 Paragraph ${paraLetter} 出题段`}
                                >
                                  <span>定位原文 · Para {paraLetter}</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-stone-900 dark:text-stone-100 font-medium leading-relaxed">
                              {q.prompt}
                            </p>

                            {/* Unboxed Inline Answer Comparison */}
                            <div className="flex items-center gap-3 text-xs font-mono tabular-nums pt-0.5 flex-wrap">
                              <span
                                className={
                                  isCorrect
                                    ? 'text-emerald-700 dark:text-emerald-300'
                                    : 'text-rose-600 dark:text-rose-400 line-through'
                                }
                              >
                                你的作答: {userAns || '未填'}
                              </span>
                              <span className="text-stone-300 dark:text-stone-700">·</span>
                              <span className="text-[#516050] dark:text-[#8FB996] font-semibold">
                                官方正解: {q.correctAnswer}
                              </span>
                            </div>

                            {q.explanation && (
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed pt-1">
                                {q.explanation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 4. Action Buttons */}
              <div className="mt-3.5 pt-3 border-t border-stone-200/60 dark:border-white/[0.06] flex items-center gap-2.5 shrink-0">
                <button
                  id="review-passage-btn"
                  type="button"
                  onClick={() => setAssessmentModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-full bg-white dark:bg-white/[0.06] border border-stone-200/80 dark:border-white/[0.08] text-stone-700 dark:text-stone-300 font-sans-ui text-xs font-semibold hover:bg-stone-100 dark:hover:bg-white/[0.1] active:scale-98 transition-all text-center cursor-pointer"
                >
                  复盘本篇
                </button>
                {nextSequential.next ? (
                  <button
                    id="assessment-next-passage-btn"
                    type="button"
                    onClick={handleStartNextPassage}
                    className="flex-[1.5] py-3 px-4 rounded-full bg-[#516050] hover:bg-[#3F4C3E] dark:bg-[#6B8F71] dark:hover:bg-[#4A6B50] text-white font-sans-ui text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <span>
                      {nextSequential.isSameTest
                        ? `顺刷下一篇 · Passage ${nextSequential.next.passageNum}`
                        : `下一套 · Test ${nextSequential.next.testNum} P1`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                ) : (
                  <button
                    id="return-to-daily-song-btn"
                    type="button"
                    onClick={handleReturnToSong}
                    className="flex-[1.4] py-3 px-5 rounded-full bg-[#516050] hover:bg-[#3F4C3E] dark:bg-[#6B8F71] dark:hover:bg-[#4A6B50] text-white font-sans-ui text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
                  >
                    <span>返回音乐研习</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
