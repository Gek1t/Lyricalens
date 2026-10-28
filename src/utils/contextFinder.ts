import { SEED_SONGS, SEED_PASSAGE } from '../db/seedData';
import { getLyricLineTranslation } from './lyricDictionary';

export interface LyricContextResult {
  found: boolean;
  songTitle?: string;
  artist?: string;
  lyricEn?: string;
  lyricCn?: string;
}

export interface IELTSContextResult {
  found: boolean;
  source: string;
  sentenceEn: string;
  sentenceCn: string;
}

const PASSAGE_SENTENCES: { en: string; cn: string; source: string }[] = [
  {
    en: 'In the cracks of concrete sidewalks and the forgotten margins of industrial zones, a quiet botanical revolution is underway.',
    cn: '在混凝土人行道的裂缝中，以及工业区被遗忘的边缘地带，一场静悄悄的植物学革命正在展开。',
    source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
  },
  {
    en: 'While city planners obsess over meticulously curated parks, the true ecological pioneers of the urban landscape are the ephemeral weeds that seize any available micro-habitat.',
    cn: '当城市规划者们对精心打理的公园极尽推崇时，城市景观中真正的生态先锋，是那些抓住一切可用微生境、生命周期短暂的野草。',
    source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
  },
  {
    en: 'These resilient opportunists defy the harsh conditions of pollution, compacted soil, and extreme temperature fluctuations created by the urban heat island effect.',
    cn: '这些顽强的机会主义物种不惧恶劣的污染环境、紧密板结的土壤以及由城市热岛效应所引发的极端温度起伏。',
    source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
  },
  {
    en: 'Recent longitudinal studies by the Institute of Urban Ecology suggest that this resilience is not merely a matter of survival, but of rapid evolutionary adaptation.',
    cn: '城市生态研究所近期的追踪研究表明，这种非凡韧性不仅关乎生存，更是快速进化适应的体现。',
    source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
  },
  {
    en: 'For instance, researchers have observed a marked divergence in seed dispersal mechanisms between rural and urban dandelion populations within a surprisingly short timeframe.',
    cn: '例如，研究人员在令人惊讶的短时间内，观察到了乡村与城市蒲公英种群在种子散播机制上的显著分化。',
    source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
  },
  {
    en: 'In the city, where seeds risk falling onto impermeable asphalt rather than fertile ground, heavy-seeded variants that drop immediately next to the parent plant are becoming statistically dominant over their lighter, wind-borne cousins.',
    cn: '在城市中，由于种子极易落在不透水的沥青路面上而非肥沃土壤，因此直接落在母株旁的重籽变种在统计学上已逐渐超越其随风飘落的轻籽近亲占据优势。',
    source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
  },
  {
    en: 'Furthermore, the composition of these spontaneous urban ecosystems provides a living record of human activity and historical trade routes.',
    cn: '此外，这些自生城市生态系统的构成，如同一部记录人类活动与历史贸易路线的鲜活档案。',
    source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
  },
  {
    en: 'The ubiquitous presence of specific non-native flora along railway lines, for example, maps almost perfectly onto 19th-century grain transportation networks.',
    cn: '例如，铁路沿线特定外来植物的普遍存在，几乎完全对应了19世纪的粮食运输网络。',
    source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
  },
  {
    en: 'As cities continue to expand and traditional natural habitats contract, understanding the complex dynamics of these accidental ecosystems becomes crucial for developing sustainable, biodiverse urban futures that integrate rather than eradicate spontaneous nature.',
    cn: '随着城市持续扩张而传统自然栖息地不断萎缩，理解这些偶然生态系统的复杂动态，对于构建融合而非消除自发自然的、可持续且富有多样性的城市未来至关重要。',
    source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
  }
];

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Searches the user's playlist songs to check if the word actually appears in any song
 */
export function findSongContextInPlaylist(targetWord: string): LyricContextResult {
  if (!targetWord) return { found: false };
  const clean = targetWord.toLowerCase().trim();
  const stem = clean.replace(/(?:ing|ed|es|s|ly|tion|ence|ance)$/i, '');

  for (const song of SEED_SONGS) {
    // Split lyric lines
    const rawLines = song.lrcText.split('\n');
    for (const line of rawLines) {
      const textOnly = line.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, '').trim();
      if (!textOnly) continue;

      const lowerText = textOnly.toLowerCase();
      // Check word boundary or stem match
      let isMatch = false;
      if (clean.includes(' ')) {
        isMatch = lowerText.includes(clean);
      } else {
        const regex = stem.length >= 4 
          ? new RegExp(`\\b${escapeRegExp(stem)}[a-z]*\\b`, 'i')
          : new RegExp(`\\b${escapeRegExp(clean)}\\b`, 'i');
        isMatch = regex.test(lowerText);
      }

      if (isMatch) {
        const cnTrans = getLyricLineTranslation(textOnly) || `收录于《${song.title}》歌曲原声。`;
        return {
          found: true,
          songTitle: song.title,
          artist: song.artist,
          lyricEn: textOnly,
          lyricCn: cnTrans
        };
      }
    }
  }

  return { found: false };
}

/**
 * Searches IELTS academic passage database for the true passage sentence
 */
export function findIELTSAcademicContext(targetWord: string): IELTSContextResult {
  if (!targetWord) {
    return {
      found: false,
      source: 'IELTS Academic Reading',
      sentenceEn: '',
      sentenceCn: ''
    };
  }

  const clean = targetWord.toLowerCase().trim();
  const stem = clean.replace(/(?:ing|ed|es|s|ly|tion|ence|ance)$/i, '');

  // 1. Search IELTS Passage 2 sentences first
  for (const item of PASSAGE_SENTENCES) {
    const lower = item.en.toLowerCase();
    let isMatch = false;
    if (clean.includes(' ')) {
      isMatch = lower.includes(clean);
    } else {
      const regex = stem.length >= 4
        ? new RegExp(`\\b${escapeRegExp(stem)}[a-z]*\\b`, 'i')
        : new RegExp(`\\b${escapeRegExp(clean)}\\b`, 'i');
      isMatch = regex.test(lower);
    }

    if (isMatch) {
      return {
        found: true,
        source: item.source,
        sentenceEn: item.en,
        sentenceCn: item.cn
      };
    }
  }

  // 2. High frequency academic fallback contexts
  const academicFallbacks: Record<string, { sentenceEn: string; sentenceCn: string; source: string }> = {
    'compacted': {
      sentenceEn: 'These resilient opportunists defy the harsh conditions of pollution, compacted soil, and extreme temperature fluctuations.',
      sentenceCn: '这些顽强的机会主义物种不惧恶劣的污染环境、紧密板结的土壤以及由城市热岛效应所引发的极端温度起伏。',
      source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
    },
    'compact': {
      sentenceEn: 'In high-density metropolises, compact ecological designs facilitate species coexistence.',
      sentenceCn: '在高密度大都市中，紧凑型生态设计有助于物种和谐共生。',
      source: 'IELTS Academic Reading · Urban Planning'
    },
    'botanical': {
      sentenceEn: 'In the forgotten margins of industrial zones, a quiet botanical revolution is underway.',
      sentenceCn: '在工业区被遗忘的边缘地带，一场静悄悄的植物学革命正在展开。',
      source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
    },
    'pioneers': {
      sentenceEn: 'The true ecological pioneers of the urban landscape are the ephemeral weeds.',
      sentenceCn: '城市景观中真正的生态先锋，是那些生命周期短暂的先锋野草。',
      source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
    },
    'micro-habitat': {
      sentenceEn: 'Ephemeral weeds seize any available micro-habitat along pavement cracks and brick walls.',
      sentenceCn: '短生野草牢牢抓住人行道缝隙与砖墙间任何可用的微生境。',
      source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
    },
    'divergence': {
      sentenceEn: 'Researchers have observed a marked divergence in seed dispersal mechanisms between rural and urban populations.',
      sentenceCn: '研究人员观察到了乡村与城市种群在种子散播机制上的显著分化。',
      source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
    },
    'impermeable': {
      sentenceEn: 'In urban environments, seeds risk falling onto impermeable asphalt rather than fertile ground.',
      sentenceCn: '在城市环境中，种子极易落在不透水的沥青路面上而非肥沃土壤。',
      source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
    },
    'spontaneous': {
      sentenceEn: 'The composition of these spontaneous urban ecosystems provides a living record of human trade history.',
      sentenceCn: '这些自生城市生态系统的构成，如同一部记录人类贸易历史的鲜活档案。',
      source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
    },
    'longitudinal': {
      sentenceEn: 'Recent longitudinal studies suggest that this resilience is a product of rapid evolutionary adaptation.',
      sentenceCn: '近期的追踪研究表明，这种非凡韧性正是快速进化适应的产物。',
      source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
    },
    'dispersal': {
      sentenceEn: 'Variations in seed dispersal mechanisms determine reproductive success in fragmented landscapes.',
      sentenceCn: '种子散播机制的差异决定了物种在碎片化生境中的繁殖成效。',
      source: 'IELTS Passage 2 · Academic Reading'
    }
  };

  if (academicFallbacks[clean]) {
    return {
      found: true,
      ...academicFallbacks[clean]
    };
  }

  // If no true academic sentence exists, return found: false cleanly
  return {
    found: false,
    source: 'IELTS Academic Reading',
    sentenceEn: '',
    sentenceCn: ''
  };
}
