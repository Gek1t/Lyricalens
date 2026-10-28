import { SongItem, WordItem, VocabDifficultyTag, SongVocabStats } from '../types';

// 1. IELTS High-Tier C1/C2 Academic & Literary Vocabulary (7.5+ Band)
export const IELTS_BAND_8_WORDS = new Set([
  'ubiquitous', 'ephemeral', 'serendipity', 'meticulous', 'clandestine', 'ineffable', 'resilience',
  'equilibrium', 'eloquence', 'paradox', 'conundrum', 'synchronicity', 'tenacity', 'reverie',
  'tranquility', 'zenith', 'obsidian', 'luminous', 'resonance', 'divergent', 'euphoria', 'epiphany',
  'solace', 'radiance', 'transient', 'sanctuary', 'solitude', 'contemplate', 'nostalgia', 'labyrinth',
  'melancholy', 'surreal', 'vulnerable', 'aesthetic', 'ambiguous', 'catalyst', 'discrete', 'empirical',
  'hierarchy', 'intrinsic', 'qualitative', 'paradigm', 'fluctuate', 'arbitrary', 'coherent', 'compatible',
  'forthcoming', 'infrastructure', 'integrity', 'manipulate', 'preliminary', 'qualitative', 'subsidy',
  'subsequent', 'supplement', 'underlie', 'undertake', 'widespread', 'aesthetic', 'alchemy', 'apocalypse',
  'benevolent', 'cacophony', 'chrysanthemum', 'clandestine', 'complacency', 'ebullient', 'effervescent',
  'ephemeral', 'epiphany', 'equanimity', 'esoteric', 'evanescent', 'felicity', 'garrulous', 'halcyon',
  'idiosyncratic', 'incandescent', 'ineffable', 'juxtaposition', 'labyrinthine', 'mellifluous', 'nebulous',
  'oblivion', 'panacea', 'petrichor', 'quintessential', 'resilience', 'scintillating', 'surreptitious',
  'tintinnabulation', 'ubiquity', 'vicarious', 'weltschmerz', 'zephyr'
]);

// 2. IELTS Academic Word List (AWL) & Core Examination Words (6.5+ Band)
export const IELTS_CORE_ACADEMIC_WORDS = new Set([
  'abandon', 'abstract', 'abundant', 'accessible', 'accommodate', 'accompany', 'accumulate', 'accurate',
  'acknowledge', 'acquire', 'adapt', 'adequate', 'adjacent', 'adjust', 'administer', 'advent', 'advocate',
  'aggregate', 'albeit', 'allocate', 'alter', 'alternative', 'amend', 'analogy', 'analyze', 'annual',
  'anticipate', 'apparent', 'append', 'appreciate', 'approach', 'appropriate', 'approximate', 'aspect',
  'assemble', 'assess', 'assign', 'assist', 'assume', 'assure', 'attain', 'attribute', 'augment',
  'authentic', 'authoritative', 'automate', 'available', 'benefit', 'bias', 'bond', 'brief', 'bulk',
  'capable', 'capacity', 'category', 'cease', 'challenge', 'channel', 'chapter', 'chart', 'chemical',
  'circumstance', 'cite', 'civil', 'clarify', 'classic', 'clause', 'coexist', 'coincide', 'collapse',
  'colleague', 'commence', 'comment', 'commission', 'commit', 'commodity', 'compensate', 'compile',
  'complement', 'complex', 'component', 'compound', 'comprehensive', 'comprise', 'compute', 'conceive',
  'concentrate', 'concept', 'conclude', 'concurrent', 'conduct', 'confer', 'confine', 'confirm', 'conform',
  'consent', 'consequent', 'considerable', 'consist', 'constant', 'constitute', 'constrain', 'construct',
  'consult', 'consume', 'contact', 'contemporary', 'context', 'contract', 'contradict', 'contrary',
  'contrast', 'contribute', 'controversy', 'convene', 'converse', 'convert', 'convince', 'cooperate',
  'coordinate', 'core', 'corporate', 'correspond', 'couple', 'create', 'credit', 'criteria', 'crucial',
  'culture', 'currency', 'cycle', 'data', 'debate', 'decade', 'decline', 'deduce', 'define', 'definite',
  'demonstrate', 'denote', 'deny', 'depict', 'derive', 'design', 'despite', 'detect', 'deviate',
  'device', 'devote', 'differentiate', 'dimension', 'diminish', 'discriminate', 'displace', 'display',
  'dispose', 'distinct', 'distort', 'distribute', 'diverse', 'document', 'domain', 'domestic', 'dominate',
  'draft', 'drama', 'duration', 'dynamic', 'economy', 'edit', 'element', 'eliminate', 'emerge',
  'emphasis', 'enable', 'encounter', 'energy', 'enforce', 'enhance', 'enormous', 'ensure', 'entity',
  'environment', 'equate', 'equip', 'equivalent', 'erode', 'error', 'establish', 'estate', 'estimate',
  'ethic', 'ethnic', 'evaluate', 'eventual', 'evident', 'evolve', 'exceed', 'exclude', 'exhibit',
  'expand', 'expert', 'explicit', 'exploit', 'export', 'expose', 'external', 'extract', 'facilitate',
  'factor', 'feature', 'federal', 'fee', 'file', 'final', 'finance', 'finite', 'flexible', 'focus',
  'format', 'formula', 'foundation', 'framework', 'function', 'fund', 'fundamental', 'furthermore',
  'gender', 'generate', 'generation', 'globe', 'goal', 'grade', 'grant', 'guarantee', 'guideline',
  'hence', 'highlight', 'hypothesis', 'identical', 'identify', 'ideology', 'ignorance', 'illustrate',
  'image', 'immigrate', 'impact', 'implement', 'implicate', 'implicit', 'imply', 'impose', 'incentive',
  'incidence', 'incline', 'income', 'incorporate', 'index', 'indicate', 'individual', 'induce',
  'inevitable', 'infer', 'inherent', 'inhibit', 'initial', 'initiate', 'injure', 'innovate', 'input',
  'insert', 'insight', 'inspect', 'instance', 'institute', 'instruct', 'integral', 'integrate',
  'intelligence', 'intense', 'interact', 'intermediate', 'internal', 'interpret', 'interval',
  'intervene', 'invest', 'investigate', 'invoke', 'involve', 'isolate', 'issue', 'item', 'job',
  'journal', 'justify', 'label', 'labor', 'layer', 'lecture', 'legal', 'legislate', 'levy', 'liberal',
  'license', 'likewise', 'link', 'locate', 'logic', 'maintain', 'major', 'manual', 'margin', 'mature',
  'maximize', 'mechanism', 'media', 'mediate', 'medical', 'medium', 'mental', 'method', 'migrate',
  'military', 'minimal', 'minimize', 'minimum', 'ministry', 'minor', 'mode', 'modify', 'monitor',
  'motive', 'mutual', 'negate', 'network', 'neutral', 'nevertheless', 'nonetheless', 'norm', 'notion',
  'notwithstanding', 'nuclear', 'objective', 'obtain', 'obvious', 'occupy', 'occur', 'odd', 'offset',
  'ongoing', 'option', 'orient', 'outcome', 'output', 'overall', 'overlap', 'overseas', 'panel',
  'paragraph', 'parallel', 'parameter', 'participate', 'partner', 'passive', 'perceive', 'percent',
  'period', 'persist', 'perspective', 'phase', 'phenomenon', 'philosophy', 'physical', 'plus',
  'policy', 'portion', 'pose', 'positive', 'potential', 'practitioner', 'precede', 'precise',
  'predict', 'predominant', 'presume', 'previous', 'primary', 'prime', 'principal', 'principle',
  'prior', 'priority', 'proceed', 'process', 'professional', 'prohibit', 'project', 'promote',
  'proportion', 'prospect', 'protocol', 'psychology', 'publication', 'publish', 'purchase', 'pursue',
  'quote', 'radical', 'random', 'range', 'ratio', 'rational', 'react', 'recover', 'refine', 'regime',
  'region', 'register', 'regulate', 'reinforce', 'reject', 'relax', 'release', 'relevant', 'reluctance',
  'rely', 'remove', 'require', 'research', 'reside', 'resolve', 'resource', 'respond', 'restore',
  'restrain', 'restrict', 'retain', 'reveal', 'revenue', 'reverse', 'revise', 'revolution', 'rigid',
  'role', 'route', 'scenario', 'schedule', 'scheme', 'scope', 'section', 'sector', 'secure', 'seek',
  'select', 'sequence', 'series', 'shift', 'significant', 'similar', 'simulate', 'site', 'sole',
  'somewhat', 'source', 'specific', 'specify', 'sphere', 'stable', 'statistic', 'status',
  'straightforward', 'strategy', 'stress', 'structure', 'style', 'submit', 'subordinate', 'substitute',
  'successor', 'sufficient', 'sum', 'summary', 'survey', 'survive', 'suspend', 'sustain', 'symbol',
  'tape', 'target', 'task', 'team', 'technical', 'technique', 'technology', 'temporary', 'tense',
  'terminate', 'text', 'theme', 'theory', 'thereby', 'thesis', 'topic', 'trace', 'tradition',
  'transfer', 'transform', 'transit', 'transmit', 'transport', 'trend', 'trigger', 'ultimate',
  'undergo', 'uniform', 'unify', 'unique', 'utilize', 'valid', 'vary', 'vehicle', 'version', 'via',
  'violate', 'virtual', 'visible', 'vision', 'visual', 'volume', 'voluntary', 'welfare', 'whereas',
  'whereby'
]);

// 3. TOEFL Core Academic Words
export const TOEFL_CORE_WORDS = new Set([
  'abrupt', 'adverse', 'autonomous', 'chronic', 'disruptive', 'facile', 'imperative', 'indigenous',
  'intermittent', 'obsolete', 'plausible', 'prolific', 'resilient', 'rudimentary', 'strenuous',
  'susceptible', 'turbulent', 'ubiquitous', 'viable', 'vulnerable', 'yield', 'zenith', 'concur',
  'deplete', 'dismantle', 'elucidate', 'expedite', 'fluctuate', 'hinder', 'impede', 'jeopardize',
  'mitigate', 'nullify', 'oscillate', 'propel', 'reconcile', 'scrutinize', 'stagnate', 'substantiate',
  'truncate', 'venerate', 'waive', 'amalgamate', 'anachronism', 'anomaly', 'antithesis', 'apathy',
  'catalyst', 'dichotomy', 'epitome', 'equilibrium', 'paradigm', 'pragmatic', 'surplus', 'synergy'
]);

// 4. CET-6 Core English Vocabulary
export const CET6_CORE_WORDS = new Set([
  'abnormal', 'absurd', 'abundant', 'accessory', 'accord', 'acknowledge', 'acquaint', 'activate',
  'acute', 'adhere', 'adjacent', 'adjoin', 'adolescent', 'advent', 'adverse', 'advocate', 'aesthetic',
  'affiliate', 'affirm', 'afflict', 'agenda', 'aggravate', 'agony', 'alienate', 'allege', 'alleviate',
  'allocate', 'allowance', 'alter', 'alternate', 'ambassador', 'ambiguous', 'ambitious', 'amend',
  'amplify', 'analogy', 'analytic', 'ancestor', 'annihilate', 'annoy', 'anonymous', 'anthem',
  'anticipate', 'apparatus', 'appeal', 'appease', 'applaud', 'appraisal', 'apt', 'arbitrary', 'archive',
  'ardent', 'array', 'articulate', 'ascend', 'ascertain', 'ascribe', 'assault', 'assemble', 'assert',
  'assimilate', 'astound', 'attachment', 'attain', 'authentic', 'avail', 'avert', 'baffle', 'barren',
  'bewilder', 'bleak', 'blunder', 'blunt', 'boost', 'brace', 'brisk', 'brutal', 'bureaucracy'
]);

// Stop words to ignore
export const COMMON_STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
  'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
  'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
  'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
  'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
  'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were',
  'am', 'been', 'being', 'had', 'has', 'did', 'does', 'doing', 'feat', 'ft', 'remix', 'version', 'edit',
  'yeah', 'baby', 'ooh', 'whoa', 'la', 'na', 'oh'
]);

/**
 * Sanitizes lyrics removing timestamps and boilerplate mock markers
 */
export function sanitizeLyricText(text?: string): string {
  if (!text) return '';
  if (
    text.includes('Listening to the melodic rhythm') ||
    text.includes('whisper of wonder') ||
    text.includes('Finding our inner') ||
    (text.includes('A subtle') && text.includes('essence flows')) ||
    (text.includes('Embracing the') && text.includes('moments that define')) ||
    text.includes('Soft acoustic vibrations') ||
    text.includes('Tranquil melodies lingering')
  ) {
    return '';
  }
  return text;
}

/**
 * Extracts clean English word tokens of 3+ letters
 */
export function extractEnglishWordTokens(text: string): string[] {
  if (!text) return [];
  const cleanLyrics = sanitizeLyricText(text);
  const clean = cleanLyrics.replace(/\[\d{2}:\d{2}\.?\d*\]/g, ' ');
  const matches = clean.toLowerCase().match(/[a-z]{3,}/g) || [];
  return Array.from(new Set(matches.filter(m => !COMMON_STOP_WORDS.has(m))));
}

// -----------------------------------------------------------------------------
// Ebbinghaus Spaced Repetition Memory Engine (艾宾浩斯记忆曲线算法)
// -----------------------------------------------------------------------------

export interface EbbinghausRetentionInfo {
  retentionScore: number; // 0 - 100 (%)
  isDue: boolean;
  daysElapsed: number;
  stage: number; // 0 - 5 Spaced Repetition stage
  intervalDays: number;
  status: 'critical' | 'learning' | 'solid'; // critical (遗忘预警), learning (巩固中), solid (稳固记忆)
}

/**
 * Standard Ebbinghaus Spaced Repetition intervals in days:
 * Stage 0: 0.5 day (12 hrs / initial learn)
 * Stage 1: 1 day
 * Stage 2: 2 days
 * Stage 3: 4 days
 * Stage 4: 7 days
 * Stage 5: 15 days
 * Stage 6+: 30 days
 */
export const EBBINGHAUS_INTERVAL_DAYS = [0.5, 1, 2, 4, 7, 15, 30];

/**
 * Calculates real-time Ebbinghaus memory retention and review urgency for a word
 */
export function calculateEbbinghausRetention(word: WordItem, now: number = Date.now()): EbbinghausRetentionInfo {
  const added = word.addedTimestamp || (now - 86400000);
  const lastReviewed = word.lastReviewedTimestamp || added;
  const reviewCount = word.reviewCount || (word.masteryLevel === 3 ? 4 : word.masteryLevel === 2 ? 2 : 1);
  const mastery = word.masteryLevel ?? (word.isStarred ? 1 : 0);

  // Time elapsed since last review in days
  const timeElapsedMs = Math.max(0, now - lastReviewed);
  const daysElapsed = timeElapsedMs / (1000 * 60 * 60 * 24);

  // Spaced repetition stage
  const stage = Math.min(EBBINGHAUS_INTERVAL_DAYS.length - 1, Math.max(0, reviewCount + mastery - 1));
  const intervalDays = EBBINGHAUS_INTERVAL_DAYS[stage] || 1;

  // Stability factor S increases with reviews and mastery
  const stability = intervalDays * 1.25;

  // Ebbinghaus Retention R = e^(-t / S) * 100
  const retentionScore = Math.max(5, Math.min(100, Math.round(Math.exp(-daysElapsed / Math.max(0.5, stability)) * 100)));

  // Due if retention drops below 60% or days elapsed exceeds recommended interval
  const isDue = (mastery < 3 && retentionScore < 65) || (daysElapsed >= intervalDays && mastery < 3);

  let status: 'critical' | 'learning' | 'solid' = 'learning';
  if (mastery === 3 && retentionScore >= 70) {
    status = 'solid';
  } else if (retentionScore < 50 || (isDue && daysElapsed > intervalDays * 1.5)) {
    status = 'critical';
  } else if (retentionScore >= 75) {
    status = 'solid';
  }

  return {
    retentionScore,
    isDue,
    daysElapsed: Number(daysElapsed.toFixed(1)),
    stage,
    intervalDays,
    status
  };
}

/**
 * Returns all words that are currently due for spaced review
 */
export function getDueReviewWords(words: WordItem[]): WordItem[] {
  if (!words || words.length === 0) return [];
  const now = Date.now();
  return words.filter(w => {
    // If explicitly unmastered or new, calculate due state
    const info = calculateEbbinghausRetention(w, now);
    return info.isDue;
  });
}

/**
 * Comprehensive Ebbinghaus metrics across the user's vocabulary vault
 */
export function getEbbinghausMetrics(words: WordItem[]) {
  if (!words || words.length === 0) {
    return {
      dueCount: 0,
      avgRetention: 85,
      criticalCount: 0,
      learningCount: 0,
      solidCount: 0,
      dueWords: []
    };
  }

  const now = Date.now();
  let totalRetention = 0;
  let criticalCount = 0;
  let learningCount = 0;
  let solidCount = 0;
  const dueWords: WordItem[] = [];

  for (const w of words) {
    const info = calculateEbbinghausRetention(w, now);
    totalRetention += info.retentionScore;
    if (info.isDue) dueWords.push(w);
    if (info.status === 'critical') criticalCount++;
    else if (info.status === 'solid') solidCount++;
    else learningCount++;
  }

  return {
    dueCount: dueWords.length,
    avgRetention: Math.round(totalRetention / words.length),
    criticalCount,
    learningCount,
    solidCount,
    dueWords
  };
}

// -----------------------------------------------------------------------------
// Song Vocabulary Difficulty Evaluation & Tiering (歌单难度智能分级)
// -----------------------------------------------------------------------------

export interface EvaluatedSongDifficulty {
  level?: VocabDifficultyTag;
  isChinese?: boolean;
  stats: SongVocabStats;
}

/**
 * Detects if a song is predominantly Chinese or an English song
 * Accurately handles aliases like "Taylor Swift (泰勒·斯威夫特)" or "Hello (你好)"
 */
export function isChineseSong(song?: { title?: string; artist?: string; lrcText?: string } | null): boolean {
  if (!song) return false;
  const title = (song.title || '').trim();
  const artist = (song.artist || '').trim();
  const lrc = sanitizeLyricText(song.lrcText || '').replace(/\[\d{2}:\d{2}\.?\d*\]/g, ' ');

  const chineseCharMatches = (str: string) => (str.match(/[\u4e00-\u9fa5]/g) || []).length;
  const latinWordMatches = (str: string) => (str.match(/[a-zA-Z]{2,}/g) || []).length;

  const titleChineseCount = chineseCharMatches(title);
  const titleLatinCount = latinWordMatches(title);

  const artistChineseCount = chineseCharMatches(artist);
  const artistLatinCount = latinWordMatches(artist);

  // 1. If lyrics exist and contain substantial content
  const lyricChineseCount = chineseCharMatches(lrc);
  const lyricLatinWords = latinWordMatches(lrc);

  if (lyricLatinWords >= 15 && lyricLatinWords > lyricChineseCount * 2) {
    // Overwhelmingly English lyrics -> English song (e.g. English song with translated title or artist in parentheses)
    return false;
  }

  if (lyricChineseCount >= 15 && lyricChineseCount > lyricLatinWords) {
    // Overwhelmingly Chinese lyrics -> Chinese song
    return true;
  }

  // 2. Title inspection:
  // If title has Chinese characters without Latin words, or Chinese characters significantly dominate
  if (titleChineseCount > 0 && titleLatinCount === 0) {
    return true;
  }

  // If title is pure English / Latin (e.g. "Cruel Summer", "Shape of You", "Bad Guy")
  if (titleLatinCount >= 1 && titleChineseCount === 0) {
    // Pure English title -> Even if artist has Chinese translation/alias, treat as English song
    return false;
  }

  // 3. Mixed title with parentheses like "Love Story (中文版)" or "Hello (你好)"
  if (titleChineseCount > 0 && titleLatinCount > 0) {
    // If title has "中文版" / "翻唱" or Chinese chars >= Latin words * 2
    if (title.includes('中文') || title.includes('翻唱') || titleChineseCount > titleLatinCount * 2) {
      return true;
    }
    // If Latin words in title >= 2 and Chinese is just a short bracket
    return false;
  }

  // 4. Artist inspection when title has no strong clue
  if (artistChineseCount > 0 && artistLatinCount === 0 && lyricLatinWords < 5) {
    return true;
  }

  return false;
}

/**
 * Evaluates the vocabulary difficulty level and stats of a song based on lyrics/title/artist
 */
export function evaluateSongVocabDifficulty(
  song: Partial<SongItem>,
  notebookWords: Array<string | { word: string }> = [],
  dueWords: Array<string | { word: string }> = []
): EvaluatedSongDifficulty {
  const isChinese = isChineseSong(song);

  const realLyric = sanitizeLyricText(song.lrcText);
  const combinedText = `${song.title || ''} ${song.artist || ''} ${realLyric}`;
  const tokens = extractEnglishWordTokens(combinedText);

  const notebookSet = new Set<string>();
  for (const item of notebookWords) {
    const w = typeof item === 'string' ? item : item.word;
    if (w) notebookSet.add(w.trim().toLowerCase());
  }

  const dueSet = new Set<string>();
  for (const item of dueWords) {
    const w = typeof item === 'string' ? item : item.word;
    if (w) dueSet.add(w.trim().toLowerCase());
  }

  let band8Count = 0;
  let ieltsCount = 0;
  let toeflCount = 0;
  let cet6Count = 0;
  let matchedNotebookCount = 0;
  let matchedDueCount = 0;
  const matchedDueWords: string[] = [];

  for (const token of tokens) {
    if (COMMON_STOP_WORDS.has(token)) continue;

    if (notebookSet.has(token)) matchedNotebookCount++;
    if (dueSet.has(token)) {
      matchedDueCount++;
      if (!matchedDueWords.includes(token)) matchedDueWords.push(token);
    }

    if (IELTS_BAND_8_WORDS.has(token)) {
      band8Count++;
      ieltsCount++;
    } else if (IELTS_CORE_ACADEMIC_WORDS.has(token)) {
      ieltsCount++;
    } else if (TOEFL_CORE_WORDS.has(token)) {
      toeflCount++;
    } else if (CET6_CORE_WORDS.has(token)) {
      cet6Count++;
    }
  }

  const totalWords = tokens.length;
  const academicCount = ieltsCount + toeflCount + cet6Count;

  // Determine Level Hierarchy (Only meaningful English academic tiers)
  let level: VocabDifficultyTag | undefined = undefined;
  if (!isChinese) {
    if (band8Count >= 2 || (band8Count >= 1 && ieltsCount >= 3)) {
      level = 'IELTS 7.5+';
    } else if (ieltsCount >= 2 || (ieltsCount >= 1 && totalWords >= 15)) {
      level = 'IELTS 6.5+';
    } else if (toeflCount >= 2 || (toeflCount >= 1 && ieltsCount >= 1)) {
      level = 'TOEFL';
    } else if (cet6Count >= 2 || academicCount >= 1) {
      level = 'CET-6';
    }
  }

  return {
    level,
    isChinese,
    stats: {
      totalWords,
      academicCount,
      ieltsCount,
      toeflCount,
      cet6Count,
      matchedNotebookCount,
      matchedDueCount,
      dueWords: matchedDueWords
    }
  };
}

export interface MatchedVocabResult {
  matchedNotebookWords: string[];
  matchedIELTSWords: string[];
  allKeyVocab: string[];
  notebookMatchCount: number;
  matchedDueWords: string[];
}

/**
 * Accurately matches English words in a song's lyrics/title against user's notebook and due words
 */
export function analyzeSongVocab(
  song?: { lrcText?: string; title?: string; artist?: string; keyVocab?: string[] } | null,
  notebookWords: Array<string | { word: string }> = [],
  dueWords: Array<string | { word: string }> = []
): MatchedVocabResult {
  if (!song) {
    return {
      matchedNotebookWords: [],
      matchedIELTSWords: [],
      allKeyVocab: [],
      notebookMatchCount: 0,
      matchedDueWords: []
    };
  }

  const realLyric = sanitizeLyricText(song.lrcText);
  const combinedText = `${song.title || ''} ${song.artist || ''} ${realLyric}`;
  const tokens = extractEnglishWordTokens(combinedText);

  const notebookSet = new Set<string>();
  for (const item of notebookWords) {
    const w = typeof item === 'string' ? item : item.word;
    if (w && w.trim()) notebookSet.add(w.trim().toLowerCase());
  }

  const dueSet = new Set<string>();
  for (const item of dueWords) {
    const w = typeof item === 'string' ? item : item.word;
    if (w && w.trim()) dueSet.add(w.trim().toLowerCase());
  }

  const matchedNotebook: string[] = [];
  const matchedIELTS: string[] = [];
  const matchedDue: string[] = [];

  for (const token of tokens) {
    if (COMMON_STOP_WORDS.has(token)) continue;

    if (dueSet.has(token) && !matchedDue.includes(token)) {
      matchedDue.push(token);
    }

    if (notebookSet.has(token)) {
      if (!matchedNotebook.includes(token)) matchedNotebook.push(token);
    } else if (IELTS_BAND_8_WORDS.has(token) || IELTS_CORE_ACADEMIC_WORDS.has(token)) {
      if (!matchedIELTS.includes(token)) matchedIELTS.push(token);
    }
  }

  // Combined key vocabulary: Due words & Notebook words come first, then IELTS words (max 4)
  const allKeyVocab = [...matchedNotebook, ...matchedIELTS].slice(0, 4);

  return {
    matchedNotebookWords: matchedNotebook,
    matchedIELTSWords: matchedIELTS,
    allKeyVocab,
    notebookMatchCount: matchedNotebook.length,
    matchedDueWords: matchedDue
  };
}

/**
 * Re-ranks a list of songs prioritizing:
 * - Tier 1: Songs containing "Due for Review" Ebbinghaus words (Passive Memory Reinforcement)
 * - Tier 2: Songs containing user's active notebook words
 * - Tier 3: Songs with high IELTS/Academic difficulty tags
 */
export function prioritizeSongsByNotebookAndSpacedRepetition(
  songs: SongItem[],
  words: WordItem[] = []
): SongItem[] {
  if (!songs || songs.length === 0) return [];

  const dueWords = getDueReviewWords(words);
  const dueWordStrs = dueWords.map(w => w.word.toLowerCase());

  const analyzed = songs.map(s => {
    const evaluation = evaluateSongVocabDifficulty(s, words, dueWordStrs);
    const analysis = analyzeSongVocab(s, words, dueWordStrs);
    const sanitizedLrc = sanitizeLyricText(s.lrcText);

    return {
      song: {
        ...s,
        lrcText: sanitizedLrc || s.lrcText,
        keyVocab: analysis.allKeyVocab,
        vocabLevel: evaluation.level,
        vocabStats: evaluation.stats
      },
      dueCount: evaluation.stats.matchedDueCount || 0,
      notebookCount: evaluation.stats.matchedNotebookCount || 0,
      academicCount: evaluation.stats.academicCount || 0
    };
  });

  analyzed.sort((a, b) => {
    // 1. Spaced Repetition Due Words First!
    if (a.dueCount !== b.dueCount) {
      return b.dueCount - a.dueCount;
    }
    // 2. Notebook Words
    if (a.notebookCount !== b.notebookCount) {
      return b.notebookCount - a.notebookCount;
    }
    // 3. Academic Vocabulary Count
    if (a.academicCount !== b.academicCount) {
      return b.academicCount - a.academicCount;
    }
    return 0;
  });

  return analyzed.map(item => item.song);
}

// Backward compatibility alias
export const prioritizeSongsByNotebook = (songs: SongItem[], notebookWords: Array<string | { word: string }> = []): SongItem[] => {
  const mockWordItems = notebookWords.map(w => typeof w === 'string' ? { word: w, addedTimestamp: Date.now() } as WordItem : w as WordItem);
  return prioritizeSongsByNotebookAndSpacedRepetition(songs, mockWordItems);
};
