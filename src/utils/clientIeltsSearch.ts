import { IELTSVolume, OFFICIAL_IELTS_VOLUMES } from '../data/ieltsVolumes';
import { IELTS_2026_AUTUMN_RECALL_VOLUME } from '../data/seasonalIeltsRecallArchive';
import { CAMBRIDGE_IELTS_PASSAGES, CambridgePassage } from '../data/ieltsPassages';
import { CAMBRIDGE_IELTS_LISTENING, IELTSListeningSection } from '../data/ieltsListening';
import { EXAM_TIMELINE_SESSIONS, buildVolumeFromTimelineSession } from '../data/ieltsExamTimeline';
import { checkIELTSQueryExists } from '../data/ieltsDynamicGenerator';
import {
  expandSearchTokens,
  calculateRelevanceScore,
  matchesSearchTokens,
  getPassageBilingualMeta,
  getListeningBilingualMeta
} from '../data/ieltsTopicSynonyms';

export interface ClientIeltsSearchResult {
  success: boolean;
  volume?: IELTSVolume;
  hasRealArticles?: boolean;
  articles?: Array<{ title: string; url: string; domain: string; snippet: string }>;
  sources?: Array<{ title: string; url?: string; uri?: string; domain?: string; snippet?: string }>;
  message?: string;
  hint?: string;
  suggestedQueries?: string[];
  notFound?: boolean;
}

/**
 * Offline & Local-First Full-Text IELTS Search and Volume Compiler Engine
 * Runs completely in-memory on client device without requiring Node.js backend.
 */
export function searchAndCompileIeltsVolumeClient(
  query: string,
  userVocabulary: string[] = []
): ClientIeltsSearchResult {
  const cleanQuery = (query || '').trim();

  // 1. Validation for hard impossible volumes / future years
  const validation = checkIELTSQueryExists(cleanQuery);
  if (!validation.isValid && (validation.reason === 'out_of_range_cambridge' || validation.reason === 'futuristic_year' || validation.reason === 'non_ielts_entertainment')) {
    return {
      success: false,
      notFound: true,
      message: validation.message || '未找到该试卷',
      hint: validation.hint || '官方剑桥雅思真题集权威出版至《剑19》，考场机经回忆已全面同步至 2026 当前考季。',
      suggestedQueries: validation.suggestedQueries
    };
  }

  // 2. Direct matching for official Cambridge volumes (e.g. 剑19, 剑雅18, Cambridge 17, 19, etc.)
  const cambridgeNumMatch = cleanQuery.match(/(?:剑|cambridge|剑雅|c)\s*([0-9]{1,3})/i) || 
    (cleanQuery.match(/^([0-9]{1,2})$/) ? cleanQuery.match(/^([0-9]{1,2})$/) : null);
  if (cambridgeNumMatch) {
    const volNum = parseInt(cambridgeNumMatch[1], 10);
    if (volNum > 19) {
      return {
        success: false,
        notFound: true,
        message: `未找到《剑桥雅思 ${volNum}》`,
        hint: `剑桥大学出版社官方全真试题集目前最新权威出版至《剑桥雅思 19》，尚未出版《剑 ${volNum}》。请选择现行官方真题（剑10~剑19）。`,
        suggestedQueries: ['剑雅19官方全套', '剑雅18官方全套', '剑雅17官方全套', '2026考场回忆']
      };
    }
    const existingVol = OFFICIAL_IELTS_VOLUMES.find(v => v.volumeNumber === volNum);
    if (existingVol) {
      return {
        success: true,
        volume: existingVol,
        hasRealArticles: true,
        articles: existingVol.tests.flatMap(t => t.readingPassages.map(p => ({
          title: p.title,
          url: 'https://www.cambridgeenglish.org/exams-and-tests/ielts/',
          domain: 'cambridgeenglish.org',
          snippet: p.text.slice(0, 160) + '...'
        }))),
        sources: [
          {
            title: `Cambridge English IELTS ${volNum} Authentic Examination Papers`,
            url: 'https://www.cambridgeenglish.org/exams-and-tests/ielts/',
            domain: 'cambridgeenglish.org'
          }
        ]
      };
    }
  }

  // 3. Direct matching for Seasonal Recall volume (e.g. 2026考场机经, 亚太考场, 大陆统考, 换题季真题等)
  const isSeasonalOrRecall = /(?:机经|回忆|考场|换题|亚太|大陆|2026|2025)/i.test(cleanQuery);
  if (isSeasonalOrRecall) {
    return {
      success: true,
      volume: IELTS_2026_AUTUMN_RECALL_VOLUME,
      hasRealArticles: true,
      articles: IELTS_2026_AUTUMN_RECALL_VOLUME.tests.flatMap(t => t.readingPassages.map(p => ({
        title: p.title,
        url: 'https://takeielts.britishcouncil.org/',
        domain: 'takeielts.britishcouncil.org',
        snippet: p.text.slice(0, 160) + '...'
      }))),
      sources: [
        {
          title: '2026 IELTS Academic Official Examination Recall Papers',
          url: 'https://takeielts.britishcouncil.org/',
          domain: 'britishcouncil.org'
        }
      ]
    };
  }

  // 4. Match against authentic passages across all Official & Recall volumes by topic / title / keywords
  const searchTokens = expandSearchTokens(cleanQuery);
  const allAuthenticVolumes: IELTSVolume[] = [...OFFICIAL_IELTS_VOLUMES, IELTS_2026_AUTUMN_RECALL_VOLUME];

  // Helper to score passage considering both English and Chinese metadata
  const scorePassage = (p: CambridgePassage): number => {
    const meta = getPassageBilingualMeta(p);
    const combinedTitle = `${p.title} ${meta.titleZh || ''}`;
    const combinedCat = `${p.category || ''} ${meta.categoryZh || ''}`;
    const combinedText = `${p.text} ${meta.gistZh || ''}`;
    return calculateRelevanceScore({
      title: combinedTitle,
      category: combinedCat,
      keyVocab: p.keyVocab,
      text: combinedText
    }, searchTokens);
  };

  // Helper to score listening section
  const scoreListening = (s: IELTSListeningSection): number => {
    const meta = getListeningBilingualMeta(s);
    const combinedTitle = `${s.title} ${meta.titleZh || ''}`;
    const combinedCat = `${s.scenario || ''} ${meta.categoryZh || ''}`;
    const combinedText = `${s.scriptParagraphs ? s.scriptParagraphs.map(sp => sp.text).join(' ') : ''} ${meta.gistZh || ''}`;
    return calculateRelevanceScore({
      title: combinedTitle,
      category: combinedCat,
      keyVocab: s.keyVocab,
      text: combinedText
    }, searchTokens);
  };

  // Score each volume
  const scoredVolumes = allAuthenticVolumes.map(vol => {
    let score = 0;
    if (matchesSearchTokens(`${vol.bookTitle} ${vol.englishTitle} ${vol.description}`, searchTokens)) {
      score += 40;
    }
    vol.tests.forEach(t => {
      t.readingPassages.forEach(p => {
        score += scorePassage(p);
      });
      t.listeningSections.forEach(s => {
        score += scoreListening(s);
      });
    });
    return { volume: vol, score };
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scoredVolumes.length > 0) {
    const matchedVol = scoredVolumes[0].volume;

    // Gather all authentic reading passages & listening sections across authentic volumes
    const allPassages = Array.from(new Map(
      allAuthenticVolumes.flatMap(v => v.tests.flatMap(t => t.readingPassages)).map(p => [p.id, p])
    ).values());
    const allListening = Array.from(new Map(
      allAuthenticVolumes.flatMap(v => v.tests.flatMap(t => t.listeningSections)).map(s => [s.id, s])
    ).values());

    const matchedPassages = allPassages
      .map(p => ({ passage: p, score: scorePassage(p) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.passage);

    const matchedListening = allListening
      .map(s => ({ section: s, score: scoreListening(s) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.section);

    const matchedArticles: Array<{ title: string; url: string; domain: string; snippet: string }> = [];

    matchedPassages.forEach(p => {
      matchedArticles.push({
        title: p.title,
        url: 'https://www.cambridgeenglish.org/exams-and-tests/ielts/',
        domain: p.cambridgeBook || 'Cambridge IELTS Reading',
        snippet: p.text.slice(0, 180) + '...'
      });
    });

    matchedListening.forEach(s => {
      matchedArticles.push({
        title: s.title,
        url: 'https://www.cambridgeenglish.org/exams-and-tests/ielts/',
        domain: s.cambridgeBook || 'Cambridge IELTS Listening',
        snippet: `${s.scenario} · ${s.speakerRole}`
      });
    });

    if (matchedVol.sources && matchedVol.sources.length > 0) {
      matchedVol.sources.forEach(src => {
        if (!matchedArticles.some(a => a.title.toLowerCase().includes(src.title.toLowerCase().slice(0, 20)))) {
          matchedArticles.push({
            title: src.title,
            url: src.url || 'https://www.cambridgeenglish.org/exams-and-tests/ielts/',
            domain: src.domain || 'cambridgeenglish.org',
            snippet: src.snippet || ''
          });
        }
      });
    }

    if (matchedArticles.length === 0) {
      matchedVol.tests.forEach(t => {
        t.readingPassages.forEach(p => {
          matchedArticles.push({
            title: p.title,
            url: 'https://www.cambridgeenglish.org/exams-and-tests/ielts/',
            domain: 'cambridgeenglish.org',
            snippet: p.text.slice(0, 160) + '...'
          });
        });
      });
    }

    return {
      success: true,
      volume: matchedVol,
      hasRealArticles: true,
      articles: matchedArticles,
      sources: matchedVol.sources || [
        { title: `${matchedVol.bookTitle} · Authentic Examination Archive`, url: 'https://www.cambridgeenglish.org/exams-and-tests/ielts/', domain: 'cambridgeenglish.org' }
      ]
    };
  }

  // 5. Match against Exam Timeline Sessions (e.g. recent real exam recollections)
  const matchingTimeline = EXAM_TIMELINE_SESSIONS.find(s => {
    return matchesSearchTokens(`${s.dateLabel} ${s.regionBadge} ${s.readingPassages?.map(p => `${p.title} ${p.summary || ''}`).join(' ') || ''}`, searchTokens);
  });
  if (matchingTimeline) {
    const vol = buildVolumeFromTimelineSession(matchingTimeline);
    const articles = (matchingTimeline.readingPassages || []).map(p => ({
      title: p.title,
      url: 'https://takeielts.britishcouncil.org/',
      domain: matchingTimeline.regionBadge || 'IELTS Recall',
      snippet: p.summary || ''
    }));
    return {
      success: true,
      volume: vol,
      hasRealArticles: true,
      articles,
      sources: [
        {
          title: `${matchingTimeline.dateLabel} ${matchingTimeline.regionBadge} 官方实考回忆`,
          url: 'https://takeielts.britishcouncil.org/',
          domain: 'takeielts.britishcouncil.org'
        }
      ]
    };
  }

  // 6. Check individual passages in CAMBRIDGE_IELTS_PASSAGES
  const matchedPassages = CAMBRIDGE_IELTS_PASSAGES
    .map(p => ({ passage: p, score: scorePassage(p) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.passage);

  if (matchedPassages.length > 0) {
    const topPassage = matchedPassages[0];
    const containingVol = allAuthenticVolumes.find(v => 
      v.tests.some(t => t.readingPassages.some(p => p.id === topPassage.id))
    );
    if (containingVol) {
      return {
        success: true,
        volume: containingVol,
        hasRealArticles: true,
        articles: matchedPassages.map(p => ({
          title: p.title,
          url: 'https://www.cambridgeenglish.org/exams-and-tests/ielts/',
          domain: p.cambridgeBook || 'Cambridge IELTS Reading',
          snippet: p.text.slice(0, 180) + '...'
        })),
        sources: containingVol.sources
      };
    }
  }

  // 7. Authoritative Not Found
  return {
    success: false,
    notFound: true,
    message: `未在雅思官方全真题库中收录「${cleanQuery}」`,
    hint: `雅思考试（IELTS Academic）学术类真题严格选材自剑桥大学考评部官方真题集（剑1~19）及全球考场真实机经回忆。为保证备考绝对严谨与权威，系统严格杜绝虚构自编非真题。请检索官方真题卷号（如「剑19」）或真实考场机经（如「2026亚太考场真题」、「网球拍材料演变」、「城市微森林」、「古罗马」）。`,
    suggestedQueries: [
      '剑雅19官方全套',
      '剑雅18官方全套',
      '2026亚太考场真题',
      '网球拍材料演化真题',
      '城市微森林真题',
      '古罗马工程与混凝土'
    ]
  };
}
