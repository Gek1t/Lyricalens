import { WordItem, SubWordItem } from '../types';
import { SEED_WORDS } from '../db/seedData';
import { db } from '../db';
import { lookupInIeltsCorpus, estimateIpaPhonetics } from './ieltsCorpusDictionary';

/**
 * Standard Part of Speech Formatter
 * Normalizes all POS tags to clean, canonical standard formats like:
 * 'n. 名词', 'v. 动词', 'adj. 形容词', 'adv. 副词', 'prep. 介词', 'conj. 连词', 'pron. 代词', 'phrase 短语'
 */
export function formatPartOfSpeech(pos?: string, word: string = ''): string {
  const w = word.toLowerCase().trim();
  if (w.includes(' ') && (!pos || pos.includes('语境') || pos.includes('学术'))) {
    return 'phrase 短语';
  }

  if (!pos || pos.trim() === '' || pos.includes('语境') || pos.includes('学术') || pos.includes('特征') || pos.includes('行为') || pos.includes('性质') || pos.includes('演变') || pos.includes('过程') || pos.includes('可能性')) {
    if (w.endsWith('ing') || w.endsWith('ed') || w.endsWith('ize') || w.endsWith('ise') || w.endsWith('ate') || w.endsWith('ify')) {
      return 'v. 动词';
    }
    if (w.endsWith('ly')) {
      return 'adv. 副词';
    }
    if (w.endsWith('ful') || w.endsWith('ous') || w.endsWith('al') || w.endsWith('ic') || w.endsWith('ive') || w.endsWith('able') || w.endsWith('ible')) {
      return 'adj. 形容词';
    }
    return 'n. 名词';
  }

  const clean = pos.trim();
  
  if (/^n\.?\s*(名词|复数名词)?$/i.test(clean) || clean === 'n' || clean === 'noun') return 'n. 名词';
  if (/^v\.?\s*(动词|be动词)?$/i.test(clean) || clean === 'v' || clean === 'verb') return 'v. 动词';
  if (/^adj\.?\s*(形容词)?$/i.test(clean) || clean === 'adj' || clean === 'adjective') return 'adj. 形容词';
  if (/^adv\.?\s*(副词)?$/i.test(clean) || clean === 'adv' || clean === 'adverb') return 'adv. 副词';
  if (/^prep\.?\s*(介词)?$/i.test(clean) || clean === 'prep' || clean === 'preposition') return 'prep. 介词';
  if (/^conj\.?\s*(连词)?$/i.test(clean) || clean === 'conj' || clean === 'conjunction') return 'conj. 连词';
  if (/^pron\.?\s*(代词|物主代词)?$/i.test(clean) || clean === 'pron' || clean === 'pronoun') return 'pron. 代词';
  if (/^art\.?\s*(冠词)?$/i.test(clean) || clean === 'art' || clean === 'article') return 'art. 冠词';

  if (clean.includes('n.') && clean.includes('adj.')) return 'n. / adj. (名词/形容词)';
  if (clean.includes('n.') && clean.includes('v.')) return 'n. / v. (名词/动词)';
  if (clean.includes('v.') && clean.includes('n.')) return 'v. / n. (动词/名词)';
  if (clean.includes('adj.') && clean.includes('n.')) return 'adj. / n. (形容词/名词)';
  if (clean.includes('adj.') && clean.includes('v.')) return 'adj. / v. (形容词/动词)';
  if (clean.includes('prep.') && clean.includes('adv.')) return 'prep. / adv. (介词/副词)';
  if (clean.includes('adj. + n.')) return 'adj. + n. (形容词+名词)';
  if (clean.includes('v. + n.')) return 'v. + n. (动词+名词)';
  if (clean.includes('n. + prep.')) return 'n. + prep. (名词+介词)';
  if (clean.includes('v. + prep.')) return 'v. + prep. (动词+介词)';
  if (clean.includes('短语') || clean.includes('phrase') || clean.includes('词组')) return 'phrase 短语';

  if (clean.startsWith('n.')) return 'n. 名词';
  if (clean.startsWith('v.')) return 'v. 动词';
  if (clean.startsWith('adj.')) return 'adj. 形容词';
  if (clean.startsWith('adv.')) return 'adv. 副词';
  if (clean.startsWith('prep.')) return 'prep. 介词';
  if (clean.startsWith('conj.')) return 'conj. 连词';
  if (clean.startsWith('pron.')) return 'pron. 代词';

  if (clean.includes('名词')) return 'n. 名词';
  if (clean.includes('动词')) return 'v. 动词';
  if (clean.includes('形容词')) return 'adj. 形容词';
  if (clean.includes('副词')) return 'adv. 副词';
  if (clean.includes('介词')) return 'prep. 介词';
  if (clean.includes('连词')) return 'conj. 连词';

  return 'n. 名词';
}

/**
 * Built-in lexical dictionary for IELTS Academic vocabulary, 
 * lyric terms, and idiomatic phrases with full bilingual contextual definitions.
 */
const BUILTIN_VOCAB_DICT: Record<string, Partial<WordItem>> = {
  // === Key Academic Core Vocab & Everyday Words ===
  'empirical': {
    word: 'empirical',
    phoneticUk: '/ɪmˈpɪr.ɪ.kəl/',
    phoneticUs: '/ɪmˈpɪr.ɪ.kəl/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Based on, concerned with, or verifiable by observation or experience rather than theory or pure logic.',
    definitionCn: '以经验（或实验）为依据的，实证的，经验主义的',
    examples: [
      {
        en: 'The comprehensive analysis provides key empirical insights for academic discourse.',
        cn: '这项综合分析为学术探讨提供了关键的实证见解。',
        source: 'IELTS Academic Passage'
      },
      {
        en: 'Empirical evidence supports the hypothesis that biodiversity enhances urban resilience.',
        cn: '实证数据支持了生物多样性能提升城市韧性的假说。',
        source: 'IELTS Academic Reading'
      }
    ]
  },
  'morning': {
    word: 'morning',
    phoneticUk: '/ˈmɔː.nɪŋ/',
    phoneticUs: '/ˈmɔːr.nɪŋ/',
    partOfSpeech: 'n. 名词',
    definition: 'The period of time between midnight or sunrise and noon.',
    definitionCn: '早晨，清晨，上午',
    examples: [
      {
        en: 'Gentle morning light filters through the quiet room.',
        cn: '柔和的晨光穿透静谧的房间。',
        source: 'Song · Jasmine Breeze'
      },
      {
        en: 'Morning observations revealed significant biological activity among urban flora.',
        cn: '清晨的观测揭示了城市植物群落显著的生物活性。',
        source: 'IELTS Reading Passage'
      }
    ]
  },
  'notes': {
    word: 'notes',
    phoneticUk: '/nəʊts/',
    phoneticUs: '/noʊts/',
    partOfSpeech: 'n. 名词',
    definition: 'Musical tones or brief records written down as an aid to memory.',
    definitionCn: '音符，乐音；笔记，要点',
    examples: [
      {
        en: 'Breathing soft notes like a blooming jasmine flower.',
        cn: '呼吸轻柔的音符，如初绽的茉莉花。',
        source: 'Song · Jasmine Breeze'
      },
      {
        en: 'The researcher took detailed notes during the botanical field study.',
        cn: '研究员在植物学实地考察期间记录了详尽的笔记。',
        source: 'IELTS Academic Reading'
      }
    ]
  },
  'gentle': {
    word: 'gentle',
    phoneticUk: '/ˈdʒen.təl/',
    phoneticUs: '/ˈdʒen.t̬əl/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Mild in temperament or behavior; kind; tender; not harsh or severe.',
    definitionCn: '温柔的，柔和的，温和的',
    examples: [
      {
        en: 'Gentle morning light filters through the quiet room.',
        cn: '柔和的晨光穿透静谧的房间。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'filters': {
    word: 'filters',
    phoneticUk: '/ˈfɪl.təz/',
    phoneticUs: '/ˈfɪl.tɚz/',
    partOfSpeech: 'v. 动词',
    definition: 'Passes gradually through something (such as light through glass or air).',
    definitionCn: '透射，滤过，缓缓穿过',
    examples: [
      {
        en: 'Gentle morning light filters through the quiet room.',
        cn: '柔和的晨光穿透静谧的房间。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'quiet': {
    word: 'quiet',
    phoneticUk: '/ˈkwaɪ.ət/',
    phoneticUs: '/ˈkwaɪ.ət/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Making little or no noise; calm, peaceful and serene.',
    definitionCn: '安静的，静谧的，沉静的',
    examples: [
      {
        en: 'In this quiet room, thoughts begin to settle.',
        cn: '在这静谧的房间里，思绪渐渐沉淀。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'room': {
    word: 'room',
    phoneticUk: '/ruːm/',
    phoneticUs: '/ruːm/',
    partOfSpeech: 'n. 名词',
    definition: 'A part of the inside of a building that is separated from other parts by walls, floor, and ceiling.',
    definitionCn: '房间，室内，空间',
    examples: [
      {
        en: 'Filters through the quiet room.',
        cn: '穿透静谧的房间。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'breathing': {
    word: 'breathing',
    phoneticUk: '/ˈbriː.ðɪŋ/',
    phoneticUs: '/ˈbriː.ðɪŋ/',
    partOfSpeech: 'v. / n. (动词/名词)',
    definition: 'The process of taking air into and expelling it from the lungs.',
    definitionCn: '呼吸，吐纳，深呼吸',
    examples: [
      {
        en: 'Breathing soft notes like a blooming jasmine flower.',
        cn: '呼吸轻柔的音符，如初绽的茉莉花。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'soft': {
    word: 'soft',
    phoneticUk: '/sɒft/',
    phoneticUs: '/sɑːft/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Easy to mold; not hard or loud; gentle and pleasing to the senses.',
    definitionCn: '轻柔的，柔和的，温婉的',
    examples: [
      {
        en: 'Breathing soft notes like a blooming jasmine flower.',
        cn: '呼吸轻柔的音符，如初绽的茉莉花。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'blooming': {
    word: 'blooming',
    phoneticUk: '/ˈbluː.mɪŋ/',
    phoneticUs: '/ˈbluː.mɪŋ/',
    partOfSpeech: 'adj. / v. (形容词/动词)',
    definition: 'Opening into flower; blossoming, flourishing.',
    definitionCn: '初绽的，盛开的，繁茂的',
    examples: [
      {
        en: 'Like a blooming jasmine flower.',
        cn: '如同初绽的茉莉花。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'jasmine': {
    word: 'jasmine',
    phoneticUk: '/ˈdʒæz.mɪn/',
    phoneticUs: '/ˈdʒæz.mɪn/',
    partOfSpeech: 'n. 名词',
    definition: 'A climbing plant which bears fragrant white or yellow flowers.',
    definitionCn: '茉莉，茉莉花',
    examples: [
      {
        en: 'Drifting calmly with the golden jasmine breeze.',
        cn: '随金色的茉莉微风从容漂流。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'flower': {
    word: 'flower',
    phoneticUk: '/ˈflaʊ.ər/',
    phoneticUs: '/ˈflaʊ.ɚ/',
    partOfSpeech: 'n. 名词',
    definition: 'The blossom of a plant; the finest, most flourishing stage.',
    definitionCn: '花朵，花卉，芳华',
    examples: [
      {
        en: 'Like a blooming jasmine flower.',
        cn: '如同初绽的茉莉花。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'whisper': {
    word: 'whisper',
    phoneticUk: '/ˈwɪs.pər/',
    phoneticUs: '/ˈwɪs.pɚ/',
    partOfSpeech: 'n. / v. (名词/动词)',
    definition: 'Speak very softly; a gentle, murmuring sound in the air.',
    definitionCn: '轻语，低语，窃窃私语',
    examples: [
      {
        en: 'Every whisper holds an ephemeral trace of grace.',
        cn: '每一句轻语都蕴含着转瞬即逝的优雅痕迹。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'holds': {
    word: 'holds',
    phoneticUk: '/həʊldz/',
    phoneticUs: '/hoʊldz/',
    partOfSpeech: 'v. 动词',
    definition: 'Carries, contains, or grasps within itself.',
    definitionCn: '蕴含，持有，容纳',
    examples: [
      {
        en: 'Every whisper holds an ephemeral trace of grace.',
        cn: '每一句轻语都蕴含着转瞬即逝的优雅痕迹。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'stillness': {
    word: 'stillness',
    phoneticUk: '/ˈstɪl.nəs/',
    phoneticUs: '/ˈstɪl.nəs/',
    partOfSpeech: 'n. 名词',
    definition: 'The state of being quiet, calm, or completely motionless.',
    definitionCn: '宁静，沉静，静止',
    examples: [
      {
        en: 'Moments of stillness in this warm and silent space.',
        cn: '在这温暖而宁静的空间里沉淀片刻。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'warm': {
    word: 'warm',
    phoneticUk: '/wɔːm/',
    phoneticUs: '/wɔːrm/',
    partOfSpeech: 'adj. 形容词',
    definition: 'At a comfortable temperature; cordial and comforting.',
    definitionCn: '温暖的，和煦的，温情的',
    examples: [
      {
        en: 'In this warm and silent space.',
        cn: '在这温暖而宁静的空间里。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'silent': {
    word: 'silent',
    phoneticUk: '/ˈsaɪ.lənt/',
    phoneticUs: '/ˈsaɪ.lənt/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Not making or accompanied by any sound; tranquil.',
    definitionCn: '寂静的，无声的，默然的',
    examples: [
      {
        en: 'Moments of stillness in this warm and silent space.',
        cn: '在这温暖而宁静的空间里沉淀片刻。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'space': {
    word: 'space',
    phoneticUk: '/speɪs/',
    phoneticUs: '/speɪs/',
    partOfSpeech: 'n. 名词',
    definition: 'A continuous area or expanse which is available or unoccupied.',
    definitionCn: '空间，处所，天地',
    examples: [
      {
        en: 'In this warm and silent space.',
        cn: '在这温暖而宁静的空间里。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'beneath': {
    word: 'beneath',
    phoneticUk: '/bɪˈniːθ/',
    phoneticUs: '/bɪˈniːθ/',
    partOfSpeech: 'prep. 介词',
    definition: 'Extending or directly underneath; below the surface.',
    definitionCn: '在……下方，在……底下',
    examples: [
      {
        en: 'Beneath the concrete, finding our inner resilience.',
        cn: '在混凝土之下，寻得我们内心的坚韧。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'light': {
    word: 'light',
    phoneticUk: '/laɪt/',
    phoneticUs: '/laɪt/',
    partOfSpeech: 'n. / adj. (名词/形容词)',
    definition: 'The natural agent that stimulates sight and makes things visible; illuminating.',
    definitionCn: '光芒，晨光，光明；轻盈的',
    examples: [
      {
        en: 'Gentle morning light filters through the quiet room.',
        cn: '柔和的晨光穿透静谧的房间。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  // === IELTS Passage & Key Academic Core Vocab ===
  'landscape': {
    word: 'landscape',
    phoneticUk: '/ˈlænd.skeɪp/',
    phoneticUs: '/ˈlænd.skeɪp/',
    partOfSpeech: 'n. 名词',
    definition: 'All the visible features of an area of countryside or land; urban panorama.',
    definitionCn: '景观，地貌，城市全景，风貌',
    examples: [
      {
        en: 'The true ecological pioneers of the urban landscape are ephemeral weeds.',
        cn: '城市景观中真正的生态先锋，是那些转瞬即逝的野草。',
        source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
      },
      {
        en: 'The cultural landscape of the ancient valley evolved through centuries of trade.',
        cn: '古老山谷的人文景观历经数百年的贸易往来而逐渐演变。',
        source: 'IELTS Academic Reading'
      }
    ]
  },
  'crack': {
    word: 'crack',
    phoneticUk: '/kræk/',
    phoneticUs: '/kræk/',
    partOfSpeech: 'n. / v.',
    definition: 'A line on the surface of something along which it has split without breaking into pieces.',
    definitionCn: '裂缝，缝隙，裂隙；破裂，爆裂',
    examples: [
      {
        en: 'In the cracks of concrete sidewalks, a quiet botanical revolution is underway.',
        cn: '在混凝土人行道的裂缝中，一场静悄悄的植物学革命正在展开。',
        source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
      },
      {
        en: 'Microscopic cracks in materials can propagate rapidly under sustained pressure.',
        cn: '材料中的微观裂隙在持续受压下会迅速扩张。',
        source: 'IELTS Academic Science'
      }
    ]
  },
  'cracks': {
    word: 'cracks',
    phoneticUk: '/kræks/',
    phoneticUs: '/kræks/',
    partOfSpeech: 'n. 复数名词',
    definition: 'Plural of crack; fissures or narrow openings in surfaces.',
    definitionCn: '裂缝，缝隙，裂纹（复数）',
    examples: [
      {
        en: 'In the cracks of concrete sidewalks and forgotten margins of industrial zones...',
        cn: '在混凝土人行道的裂缝中，以及工业区被遗忘的边缘地带……',
        source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
      },
      {
        en: 'Pioneer flora thrives by penetrating tiny cracks in weathered asphalt.',
        cn: '先锋植物通过扎根于风化沥青的微小裂缝中得以繁衍。',
        source: 'IELTS Academic Reading'
      }
    ]
  },
  'is': {
    word: 'is',
    phoneticUk: '/ɪz/',
    phoneticUs: '/ɪz/',
    partOfSpeech: 'v. be动词',
    definition: 'Third person singular present tense of be; represents existence or state.',
    definitionCn: '是，存在（be 动词第三人称单数现在时）',
    examples: [
      {
        en: 'A quiet botanical revolution is underway in modern cities.',
        cn: '一场静谧的植物学革命正在现代城市中悄然展开。',
        source: 'IELTS Academic Reading'
      },
      {
        en: 'Life is a continuous process of quiet resilience and adaptation.',
        cn: '生命是一场坚韧与适应的持续过程。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'are': {
    word: 'are',
    phoneticUk: '/ɑːr/',
    phoneticUs: '/ɑːr/',
    partOfSpeech: 'v. be动词',
    definition: 'Second person singular and present plural of be.',
    definitionCn: '是，存在（be 动词复数及第二人称现在时）',
    examples: [
      {
        en: 'The true ecological pioneers of the urban landscape are the ephemeral weeds.',
        cn: '城市景观中真正的生态先锋，正是那些生命力顽强的野草。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'concrete': {
    word: 'concrete',
    phoneticUk: '/ˈkɒŋ.kriːt/',
    phoneticUs: '/ˈkɑːn.kriːt/',
    partOfSpeech: 'n. / adj.',
    definition: 'A heavy, rough building material made from cement, gravel, and sand; specific and tangible.',
    definitionCn: '混凝土；具体的，有形的',
    examples: [
      {
        en: 'In the cracks of concrete sidewalks...',
        cn: '在混凝土人行道的裂隙之间……',
        source: 'IELTS Passage 2'
      },
      {
        en: 'Beneath the concrete, finding our inner resilience.',
        cn: '在混凝土之下，寻得我们内心的坚韧。',
        source: 'Song · Jasmine Breeze'
      }
    ]
  },
  'sidewalks': {
    word: 'sidewalks',
    phoneticUk: '/ˈsaɪd.wɔːks/',
    phoneticUs: '/ˈsaɪd.wɑːks/',
    partOfSpeech: 'n. 复数名词',
    definition: 'Paved paths for pedestrians at the sides of streets.',
    definitionCn: '人行道，步行道',
    examples: [
      {
        en: 'In the cracks of concrete sidewalks and industrial zones...',
        cn: '在混凝土人行道的裂缝中与工业地带……',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'margins': {
    word: 'margins',
    phoneticUk: '/ˈmɑː.dʒɪnz/',
    phoneticUs: '/ˈmɑːr.dʒɪnz/',
    partOfSpeech: 'n. 复数名词',
    definition: 'The edge or border of an area or group; peripheral zones.',
    definitionCn: '边缘，边缘地带，边陲',
    examples: [
      {
        en: 'The forgotten margins of industrial zones.',
        cn: '工业区域被遗忘的边缘地带。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'industrial': {
    word: 'industrial',
    phoneticUk: '/ɪnˈdʌs.tri.əl/',
    phoneticUs: '/ɪnˈdʌs.tri.əl/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Relating to or characterized by industry or manufacture.',
    definitionCn: '工业的，产业的，制造业的',
    examples: [
      {
        en: 'The forgotten margins of industrial zones.',
        cn: '工业地带被遗忘的边缘地带。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'zones': {
    word: 'zones',
    phoneticUk: '/zəʊnz/',
    phoneticUs: '/zoʊnz/',
    partOfSpeech: 'n. 复数名词',
    definition: 'Areas having a particular characteristic, purpose, or use.',
    definitionCn: '区域，地带，分区',
    examples: [
      {
        en: 'Industrial zones and urban sectors.',
        cn: '工业区与城市地带。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'botanical': {
    word: 'botanical',
    phoneticUk: '/bəˈtæn.ɪ.kəl/',
    phoneticUs: '/bəˈtæn.ɪ.kəl/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Relating to plants or botany.',
    definitionCn: '植物学的，植物的',
    examples: [
      {
        en: 'A quiet botanical revolution is underway in urban centers.',
        cn: '一场静悄悄的植物学变革正在城市中心展开。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'revolution': {
    word: 'revolution',
    phoneticUk: '/ˌrev.əˈluː.ʃən/',
    phoneticUs: '/ˌrev.əˈluː.ʃən/',
    partOfSpeech: 'n. 名词',
    definition: 'A dramatic and wide-reaching change in conditions or operations.',
    definitionCn: '重大变革，革命，剧变',
    examples: [
      {
        en: 'A quiet botanical revolution is underway.',
        cn: '一场静默的植物学变革正在进行中。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'underway': {
    word: 'underway',
    phoneticUk: '/ˌʌn.dəˈweɪ/',
    phoneticUs: '/ˌʌn.dɚˈweɪ/',
    partOfSpeech: 'adj. / adv.',
    definition: 'Having started and in progress; being carried out.',
    definitionCn: '正在进行中，已开展的',
    examples: [
      {
        en: 'An extensive urban greening initiative is currently underway.',
        cn: '一项广泛的城市绿化计划目前正在进行中。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'planners': {
    word: 'planners',
    phoneticUk: '/ˈplæn.əz/',
    phoneticUs: '/ˈplæn.ɚz/',
    partOfSpeech: 'n. 复数名词',
    definition: 'Persons who make plans for buildings, towns, or developments.',
    definitionCn: '规划者，城市规划师',
    examples: [
      {
        en: 'City planners obsess over meticulously curated parks.',
        cn: '城市规划师们对精心打理的公园极尽推崇。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'obsess': {
    word: 'obsess',
    phoneticUk: '/əbˈses/',
    phoneticUs: '/ɑːbˈses/',
    partOfSpeech: 'v. 动词',
    definition: 'Preoccupy or fill the mind of someone continually.',
    definitionCn: '痴迷于，过分着迷，念念不忘',
    examples: [
      {
        en: 'While city planners obsess over meticulously curated parks...',
        cn: '当城市规划师们痴迷于精心照料的公园时……',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'curated': {
    word: 'curated',
    phoneticUk: '/kjʊəˈreɪ.tɪd/',
    phoneticUs: '/kjʊˈreɪ.t̬ɪd/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Carefully chosen, organized, and looked after.',
    definitionCn: '精心策划的，悉心整理与打理的',
    examples: [
      {
        en: 'City planners obsess over meticulously curated parks.',
        cn: '城市规划师们热衷于精心修剪的公园。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'parks': {
    word: 'parks',
    phoneticUk: '/pɑːks/',
    phoneticUs: '/pɑːrks/',
    partOfSpeech: 'n. 复数名词',
    definition: 'Large public gardens or recreation grounds.',
    definitionCn: '公园，公共绿地',
    examples: [
      {
        en: 'Meticulously curated urban parks.',
        cn: '精心规划的城市公园。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'ecological': {
    word: 'ecological',
    phoneticUk: '/ˌiː.kəˈlɒdʒ.ɪ.kəl/',
    phoneticUs: '/ˌiː.kəˈlɑː.dʒɪ.kəl/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Relating to or concerned with the relation of living organisms to their environment.',
    definitionCn: '生态学的，生态平衡的',
    examples: [
      {
        en: 'The true ecological pioneers of the urban landscape.',
        cn: '城市风貌中真正的生态先驱。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'pioneers': {
    word: 'pioneers',
    phoneticUk: '/ˌpaɪəˈnɪəz/',
    phoneticUs: '/ˌpaɪəˈnɪrz/',
    partOfSpeech: 'n. 复数名词',
    definition: 'Species or persons among the first to colonize or develop an area.',
    definitionCn: '先驱，先锋物种，拓荒者',
    examples: [
      {
        en: 'The true ecological pioneers of the urban landscape.',
        cn: '城市地貌中真正的生态先驱者。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'urban': {
    word: 'urban',
    phoneticUk: '/ˈɜː.bən/',
    phoneticUs: '/ˈɝː.bən/',
    partOfSpeech: 'adj. 形容词',
    definition: 'In, relating to, or characteristic of a town or city.',
    definitionCn: '城市的，市区的，都市的',
    examples: [
      {
        en: 'The secret life of urban flora and fauna.',
        cn: '城市动植物群的秘密生活。',
        source: 'IELTS Passage 2'
      },
      {
        en: 'Urban solitude sketched in shades of blue.',
        cn: '蓝色微光中勾勒的城市独处时光。',
        source: 'Song · Urban Solitude'
      }
    ]
  },
  'weeds': {
    word: 'weeds',
    phoneticUk: '/wiːdz/',
    phoneticUs: '/wiːdz/',
    partOfSpeech: 'n. 复数名词',
    definition: 'Wild plants growing where they are not wanted; spontaneous plants.',
    definitionCn: '杂草，野草，自生野生植物',
    examples: [
      {
        en: 'Ephemeral weeds that seize any available micro-habitat.',
        cn: '在任何可用微生境中扎根繁衍的自生野草。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'seize': {
    word: 'seize',
    phoneticUk: '/siːz/',
    phoneticUs: '/siːz/',
    partOfSpeech: 'v. 动词',
    definition: 'Take eagerly or aggressively; capture an opportunity.',
    definitionCn: '抓住，占据，夺取，迅速利用',
    examples: [
      {
        en: 'Ephemeral weeds that seize any available micro-habitat.',
        cn: '抓住一切微小生境迅速扎根的野草。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'available': {
    word: 'available',
    phoneticUk: '/əˈveɪ.lə.bəl/',
    phoneticUs: '/əˈveɪ.lə.bəl/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Able to be used or obtained; accessible.',
    definitionCn: '可利用的，现成的，可获得的',
    examples: [
      {
        en: 'Seize any available micro-habitat.',
        cn: '利用一切可用的微环境。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'micro-habitat': {
    word: 'micro-habitat',
    phoneticUk: '/ˈmaɪ.krəʊˌhæb.ɪ.tæt/',
    phoneticUs: '/ˈmaɪ.kroʊˌhæb.ə.tæt/',
    partOfSpeech: 'n. 名词',
    definition: 'A habitat which is of small or limited extent and differs in character from some more extensive surrounding habitat.',
    definitionCn: '微生境，微型栖息地',
    examples: [
      {
        en: 'Seize any available micro-habitat in the asphalt cracks.',
        cn: '占据沥青裂隙中任何可利用的微生境。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'resilient': {
    word: 'resilient',
    phoneticUk: '/rɪˈzɪl.jənt/',
    phoneticUs: '/rɪˈzɪl.jənt/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Able to withstand or recover quickly from difficult conditions.',
    definitionCn: '坚韧的，有适应力的，能迅速恢复的',
    examples: [
      {
        en: 'These resilient opportunists defy the harsh conditions of pollution.',
        cn: '这些生命力顽强的物种战胜了污染的严苛条件。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'opportunists': {
    word: 'opportunists',
    phoneticUk: '/ˌɒp.əˈtʃuː.nɪsts/',
    phoneticUs: '/ˌɑː.pɚˈtuː.nɪsts/',
    partOfSpeech: 'n. 复数名词',
    definition: 'Organisms capable of thriving in varied, disturbed, or transient conditions.',
    definitionCn: '适生种，机会适应型生物',
    examples: [
      {
        en: 'These resilient opportunists defy the harsh conditions of pollution.',
        cn: '这些适应力极强的先锋适生物种克服了恶劣的污染环境。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'defy': {
    word: 'defy',
    phoneticUk: '/dɪˈfaɪ/',
    phoneticUs: '/dɪˈfaɪ/',
    partOfSpeech: 'v. 动词',
    definition: 'Openly resist or refuse to obey; withstand or challenge adversity.',
    definitionCn: '不畏，违抗，抵御，战胜',
    examples: [
      {
        en: 'Defy the harsh conditions of pollution and heat.',
        cn: '抵御污染与高温的严苛考验。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'harsh': {
    word: 'harsh',
    phoneticUk: '/hɑːʃ/',
    phoneticUs: '/hɑːrʃ/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Unpleasantly rough, severe, or cruel in nature.',
    definitionCn: '严苛的，恶劣的，残酷的',
    examples: [
      {
        en: 'Defy the harsh conditions of pollution.',
        cn: '战胜污染的恶劣环境。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'conditions': {
    word: 'conditions',
    phoneticUk: '/kənˈdɪʃ.ənz/',
    phoneticUs: '/kənˈdɪʃ.ənz/',
    partOfSpeech: 'n. 复数名词',
    definition: 'The factors or circumstances affecting the way people or organisms live.',
    definitionCn: '环境条件，状况，因素',
    examples: [
      {
        en: 'Harsh conditions of compacted soil and heat.',
        cn: '板结土壤与高温的严苛条件。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'pollution': {
    word: 'pollution',
    phoneticUk: '/pəˈluː.ʃən/',
    phoneticUs: '/pəˈluː.ʃən/',
    partOfSpeech: 'n. 名词',
    definition: 'The presence or introduction into the environment of harmful substances.',
    definitionCn: '污染，污染物',
    examples: [
      {
        en: 'The harsh conditions of urban pollution.',
        cn: '城市污染的严峻环境。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'compacted': {
    word: 'compacted',
    phoneticUk: '/kəmˈpæk.tɪd/',
    phoneticUs: '/kəmˈpæk.tɪd/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Closely and firmly packed together; dense.',
    definitionCn: '板结压实的，紧密的',
    examples: [
      {
        en: 'Compact soil lacking aeration.',
        cn: '缺乏透气性的板结土壤。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'soil': {
    word: 'soil',
    phoneticUk: '/sɔɪl/',
    phoneticUs: '/sɔɪl/',
    partOfSpeech: 'n. 名词',
    definition: 'The upper layer of earth in which plants grow.',
    definitionCn: '土壤，泥土，土地',
    examples: [
      {
        en: 'Compacted soil and extreme temperatures.',
        cn: '板结的土壤与极端的气温。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'extreme': {
    word: 'extreme',
    phoneticUk: '/ɪkˈstriːm/',
    phoneticUs: '/ɪkˈstriːm/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Reaching a high or the highest degree; very severe.',
    definitionCn: '极端的，极其剧烈的',
    examples: [
      {
        en: 'Extreme temperature fluctuations created by the urban heat island.',
        cn: '城市热岛效应造成的极端气温波动。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'temperature': {
    word: 'temperature',
    phoneticUk: '/ˈtem.prə.tʃər/',
    phoneticUs: '/ˈtem.pɚ.ə.tʃɚ/',
    partOfSpeech: 'n. 名词',
    definition: 'The degree of internal heat of a body or substance.',
    definitionCn: '温度，气温',
    examples: [
      {
        en: 'Extreme temperature fluctuations in asphalt micro-climates.',
        cn: '沥青微气候中的极端温度波动。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'fluctuations': {
    word: 'fluctuations',
    phoneticUk: '/ˌflʌk.tʃuˈeɪ.ʃənz/',
    phoneticUs: '/ˌflʌk.tʃuˈeɪ.ʃənz/',
    partOfSpeech: 'n. 复数名词',
    definition: 'Irregular variations and changes in level or state.',
    definitionCn: '波动，起伏，剧烈变动',
    examples: [
      {
        en: 'Extreme temperature fluctuations created by the urban heat island effect.',
        cn: '由城市热岛效应引发的极端温度起伏。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'island': {
    word: 'island',
    phoneticUk: '/ˈaɪ.lənd/',
    phoneticUs: '/ˈaɪ.lənd/',
    partOfSpeech: 'n. 名词',
    definition: 'A piece of land surrounded by water, or an isolated distinct zone.',
    definitionCn: '岛屿；（城市）热岛',
    examples: [
      {
        en: 'The urban heat island effect elevates downtown temperatures.',
        cn: '城市热岛效应使得市中心气温显著升高。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'effect': {
    word: 'effect',
    phoneticUk: '/ɪˈfekt/',
    phoneticUs: '/əˈfekt/',
    partOfSpeech: 'n. 名词',
    definition: 'A change which is a result or consequence of an action or other cause.',
    definitionCn: '效应，影响，效果',
    examples: [
      {
        en: 'The urban heat island effect.',
        cn: '城市热岛效应。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'longitudinal': {
    word: 'longitudinal',
    phoneticUk: '/ˌlɒŋ.ɡɪˈtʃuː.dɪ.nəl/',
    phoneticUs: '/ˌlɑːn.dʒəˈtuː.dən.əl/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Relating to research involving information about the same subjects over a long period.',
    definitionCn: '纵向的，长期的，历时追踪的',
    examples: [
      {
        en: 'Recent longitudinal studies by the Institute of Urban Ecology...',
        cn: '城市生态研究所近期的长期追踪研究……',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'studies': {
    word: 'studies',
    phoneticUk: '/ˈstʌd.iz/',
    phoneticUs: '/ˈstʌd.iz/',
    partOfSpeech: 'n. 复数名词',
    definition: 'Detailed investigations and analyses of a subject.',
    definitionCn: '学术研究，科研调研',
    examples: [
      {
        en: 'Recent longitudinal studies suggest rapid evolutionary adaptation.',
        cn: '近期的长期追踪研究表明了物种快速的进化适应。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'institute': {
    word: 'institute',
    phoneticUk: '/ˈɪn.stɪ.tjuːt/',
    phoneticUs: '/ˈɪn.stə.tuːt/',
    partOfSpeech: 'n. 名词',
    definition: 'An organization having a particular purpose, especially scientific research.',
    definitionCn: '研究所，学院，学术机构',
    examples: [
      {
        en: 'The Institute of Urban Ecology.',
        cn: '城市生态学研究所。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'ecology': {
    word: 'ecology',
    phoneticUk: '/iˈkɒl.ə.dʒi/',
    phoneticUs: '/iˈkɑː.lə.dʒi/',
    partOfSpeech: 'n. 名词',
    definition: 'The study of the relationships between living organisms and their physical environment.',
    definitionCn: '生态学，生态环境',
    examples: [
      {
        en: 'Institute of Urban Ecology.',
        cn: '城市生态研究所。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'suggest': {
    word: 'suggest',
    phoneticUk: '/səˈdʒest/',
    phoneticUs: '/səˈdʒest/',
    partOfSpeech: 'v. 动词',
    definition: 'State or indicate a likely conclusion.',
    definitionCn: '表明，指出，提示，暗示',
    examples: [
      {
        en: 'Studies suggest that this resilience is not merely survival.',
        cn: '研究表明这种韧性不仅仅关乎生存。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'merely': {
    word: 'merely',
    phoneticUk: '/ˈmɪə.li/',
    phoneticUs: '/ˈmɪr.li/',
    partOfSpeech: 'adv. 副词',
    definition: 'Just; only; simply.',
    definitionCn: '仅仅，只不过，纯粹',
    examples: [
      {
        en: 'Not merely a matter of survival, but evolutionary adaptation.',
        cn: '不仅是生存问题，更是演化适应机制。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'survival': {
    word: 'survival',
    phoneticUk: '/səˈvaɪ.vəl/',
    phoneticUs: '/sɚˈvaɪ.vəl/',
    partOfSpeech: 'n. 名词',
    definition: 'The state or fact of continuing to live or exist in difficult conditions.',
    definitionCn: '生存，存活，幸存',
    examples: [
      {
        en: 'Not merely a matter of survival.',
        cn: '不仅仅关乎生存。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'evolutionary': {
    word: 'evolutionary',
    phoneticUk: '/ˌiː.vəˈluː.ʃən.ər.i/',
    phoneticUs: '/ˌev.əˈluː.ʃən.er.i/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Relating to the gradual development and genetic adaptation of organisms.',
    definitionCn: '进化的，演化上的，渐进发展的',
    examples: [
      {
        en: 'Rapid evolutionary adaptation in urban environments.',
        cn: '城市环境中的快速进化适应。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'adaptation': {
    word: 'adaptation',
    phoneticUk: '/ˌæd.æpˈteɪ.ʃən/',
    phoneticUs: '/ˌæd.əpˈteɪ.ʃən/',
    partOfSpeech: 'n. 名词',
    definition: 'The biological process whereby organisms become better suited to their habitat.',
    definitionCn: '适应，适应机制，演化适应',
    examples: [
      {
        en: 'Rapid evolutionary adaptation in seed dispersal.',
        cn: '种子传播机制上的快速演化适应。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'researchers': {
    word: 'researchers',
    phoneticUk: '/rɪˈsɜː.tʃəz/',
    phoneticUs: '/ˈriː.sɝː.tʃɚz/',
    partOfSpeech: 'n. 复数名词',
    definition: 'People who carry out academic or scientific study.',
    definitionCn: '研究人员，学者',
    examples: [
      {
        en: 'Researchers have observed a marked divergence.',
        cn: '研究学者们观察到了显著的分歧与演变。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'observed': {
    word: 'observed',
    phoneticUk: '/əbˈzɜːvd/',
    phoneticUs: '/əbˈzɝːvd/',
    partOfSpeech: 'v. / adj.',
    definition: 'Noticed or perceived through scientific measurement or attention.',
    definitionCn: '观察到，观测到的',
    examples: [
      {
        en: 'Researchers have observed a marked divergence.',
        cn: '研究者观测到了显著的差异。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'marked': {
    word: 'marked',
    phoneticUk: '/mɑːkt/',
    phoneticUs: '/mɑːrkt/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Clearly noticeable; pronounced; evident.',
    definitionCn: '显著的，明显的，醒目的',
    examples: [
      {
        en: 'A marked divergence in seed dispersal mechanisms.',
        cn: '种子传播机制上的显著分歧。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'divergence': {
    word: 'divergence',
    phoneticUk: '/daɪˈvɜː.dʒəns/',
    phoneticUs: '/daɪˈvɝː.dʒəns/',
    partOfSpeech: 'n. 名词',
    definition: 'The process of separating, branching off, or differing.',
    definitionCn: '分歧，差异，分化演变',
    examples: [
      {
        en: 'A marked divergence in seed dispersal mechanisms.',
        cn: '种子传播机制上的显著分化。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'dispersal': {
    word: 'dispersal',
    phoneticUk: '/dɪˈspɜː.səl/',
    phoneticUs: '/dɪˈspɝː.səl/',
    partOfSpeech: 'n. 名词',
    definition: 'The distribution or spreading of seeds, organisms, or particles.',
    definitionCn: '传播，散播，扩散',
    examples: [
      {
        en: 'Seed dispersal mechanisms between rural and urban plants.',
        cn: '城乡植物之间的种子传播扩散机制。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'mechanisms': {
    word: 'mechanisms',
    phoneticUk: '/ˈmek.ə.nɪ.zəmz/',
    phoneticUs: '/ˈmek.ə.nɪ.zəmz/',
    partOfSpeech: 'n. 复数名词',
    definition: 'Natural processes or systems by which something takes place.',
    definitionCn: '机制，机理，运行构造',
    examples: [
      {
        en: 'Seed dispersal mechanisms in changing environments.',
        cn: '多变环境中的种子散播机理。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'dandelion': {
    word: 'dandelion',
    phoneticUk: '/ˈdæn.dɪ.laɪ.ən/',
    phoneticUs: '/ˈdæn.də.laɪ.ən/',
    partOfSpeech: 'n. 名词',
    definition: 'A yellow-flowered wild composite plant with deeply notched leaves.',
    definitionCn: '蒲公英',
    examples: [
      {
        en: 'Rural and urban dandelion populations.',
        cn: '乡村与城市的蒲公英种群。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'populations': {
    word: 'populations',
    phoneticUk: '/ˌpɒp.jəˈleɪ.ʃənz/',
    phoneticUs: '/ˌpɑː.pjəˈleɪ.ʃənz/',
    partOfSpeech: 'n. 复数名词',
    definition: 'Groups of individuals of the same species occupying a given area.',
    definitionCn: '种群，群体，群落',
    examples: [
      {
        en: 'Urban dandelion populations.',
        cn: '城市蒲公英种群。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'impermeable': {
    word: 'impermeable',
    phoneticUk: '/ɪmˈpɜː.mi.ə.bəl/',
    phoneticUs: '/ɪmˈpɝː.mi.ə.bəl/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Not allowing fluid or moisture to pass through.',
    definitionCn: '不可渗透的，不透水的，致密的',
    examples: [
      {
        en: 'Seeds risk falling onto impermeable asphalt.',
        cn: '种子面临掉落在不透水沥青地面的风险。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'asphalt': {
    word: 'asphalt',
    phoneticUk: '/ˈæs.fælt/',
    phoneticUs: '/ˈæs.fɑːlt/',
    partOfSpeech: 'n. 名词',
    definition: 'A dark petroleum-based material used for surfacing roads.',
    definitionCn: '沥青，柏油路面',
    examples: [
      {
        en: 'Impermeable asphalt rather than fertile ground.',
        cn: '不透水的沥青路面而非肥沃的土壤。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'fertile': {
    word: 'fertile',
    phoneticUk: '/ˈfɜː.taɪl/',
    phoneticUs: '/ˈfɝː.t̬əl/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Capable of producing abundant vegetation or crops; nutrient-rich.',
    definitionCn: '肥沃的，富饶的，利于生长的',
    examples: [
      {
        en: 'Rather than fertile ground, seeds fall on concrete.',
        cn: '种子掉落在混凝土上，而非肥沃的土壤中。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'variants': {
    word: 'variants',
    phoneticUk: '/ˈveə.ri.ənts/',
    phoneticUs: '/ˈver.i.ənts/',
    partOfSpeech: 'n. 复数名词',
    definition: 'Forms or versions differing in some respect from others.',
    definitionCn: '变体，变型，变异种',
    examples: [
      {
        en: 'Heavy-seeded variants drop immediately next to the parent plant.',
        cn: '重籽型变种会直接落在母株旁边。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'dominant': {
    word: 'dominant',
    phoneticUk: '/ˈdɒm.ɪ.nənt/',
    phoneticUs: '/ˈdɑː.mə.nənt/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Most important, powerful, or statistically prevailing.',
    definitionCn: '占优势的，主导的，支配性的',
    examples: [
      {
        en: 'Heavy-seeded variants are becoming statistically dominant.',
        cn: '重籽型变种在统计学上正逐渐占据优势地位。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'wind-borne': {
    word: 'wind-borne',
    phoneticUk: '/ˈwɪnd.bɔːn/',
    phoneticUs: '/ˈwɪnd.bɔːrn/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Carried or dispersed by air currents.',
    definitionCn: '随风飘扬的，风媒散布的',
    examples: [
      {
        en: 'Dominant over their lighter, wind-borne cousins.',
        cn: '胜过更轻盈、随风散播的近亲。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'spontaneous': {
    word: 'spontaneous',
    phoneticUk: '/spɒnˈteɪ.ni.əs/',
    phoneticUs: '/spɑːnˈteɪ.ni.əs/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Growing naturally without human cultivation or planning.',
    definitionCn: '自发的，自生的，天然野生萌发的',
    examples: [
      {
        en: 'The composition of these spontaneous urban ecosystems...',
        cn: '这些城市自生生态系统的构成……',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'ecosystems': {
    word: 'ecosystems',
    phoneticUk: '/ˈiː.kəʊˌsɪs.təmz/',
    phoneticUs: '/ˈiː.koʊˌsɪs.təmz/',
    partOfSpeech: 'n. 复数名词',
    definition: 'Biological communities of interacting organisms and their physical environment.',
    definitionCn: '生态系统，生态群落',
    examples: [
      {
        en: 'Spontaneous urban ecosystems provide a living record.',
        cn: '自发的城市生态系统提供了一份活生生的历史记录。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'biodiverse': {
    word: 'biodiverse',
    phoneticUk: '/ˌbaɪ.əʊ.daɪˈvɜːs/',
    phoneticUs: '/ˌbaɪ.oʊ.dɪˈvɝːs/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Characterized by high species diversity and biological variety.',
    definitionCn: '具有生物多样性的，物种丰富的',
    examples: [
      {
        en: 'Crucial for developing sustainable, biodiverse urban futures.',
        cn: '对构建可持续且具生物多样性的城市未来至关重要。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'sustainable': {
    word: 'sustainable',
    phoneticUk: '/səˈsteɪ.nə.bəl/',
    phoneticUs: '/səˈsteɪ.nə.bəl/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Able to be maintained over the long term without depleting resources.',
    definitionCn: '可持续的，长久生态平衡的',
    examples: [
      {
        en: 'Developing sustainable urban futures.',
        cn: '构建可持续发展的城市未来。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'integrate': {
    word: 'integrate',
    phoneticUk: '/ˈɪn.tɪ.ɡreɪt/',
    phoneticUs: '/ˈɪn.t̬ə.ɡreɪt/',
    partOfSpeech: 'v. 动词',
    definition: 'Combine components into a unified, harmonious whole.',
    definitionCn: '融合，整合，使融为一体',
    examples: [
      {
        en: 'Integrate rather than eradicate spontaneous nature.',
        cn: '包容融合而非铲除自生自然。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'eradicate': {
    word: 'eradicate',
    phoneticUk: '/ɪˈræd.ɪ.keɪt/',
    phoneticUs: '/ɪˈræd.ə.keɪt/',
    partOfSpeech: 'v. 动词',
    definition: 'Destroy completely; put an end to.',
    definitionCn: '根除，消灭，彻底铲除',
    examples: [
      {
        en: 'Integrate rather than eradicate spontaneous nature.',
        cn: '融合共存而非彻底根除自生自然。',
        source: 'IELTS Passage 2'
      }
    ]
  },

  // === Core Lyric & Ambient Words ===
  'ephemeral': {
    word: 'ephemeral',
    phoneticUk: '/ɪˈfem.ər.əl/',
    phoneticUs: '/ɪˈfem.ər.əl/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Lasting for a very short time; fleeting.',
    definitionCn: '短暂的，转瞬即逝的，昙花一现的',
    examples: [
      {
        en: 'Fragrant whispers in the ephemeral air...',
        cn: '落日的晚风中，芬芳低语随风转瞬即逝。',
        source: 'Song · Jasmine Breeze'
      },
      {
        en: 'The ephemeral blooming cycle of alpine flora enables survival in harsh urban microclimates.',
        cn: '城市高山植物短暂的开花周期使其能够在严酷的微气候中生存繁衍。',
        source: 'IELTS Passage 2 · The Secret Life of Urban Flora'
      }
    ]
  },
  'resilience': {
    word: 'resilience',
    phoneticUk: '/rɪˈzɪl.jəns/',
    phoneticUs: '/rɪˈzɪl.jəns/',
    partOfSpeech: 'n. 名词',
    definition: 'The capacity to recover quickly from difficulties; toughness.',
    definitionCn: '恢复力，坚韧性，适应力',
    examples: [
      {
        en: 'Finding quiet resilience amidst the falling rain.',
        cn: '在连绵落雨中寻得一份沉静的坚韧。',
        source: 'Song · Urban Solitude'
      },
      {
        en: 'Urban flora displays remarkable physiological resilience against concrete heat islands.',
        cn: '城市植物展现出对抗混凝土热岛效应的非凡生理韧性。',
        source: 'IELTS Academic Reading'
      }
    ]
  },
  'meticulous': {
    word: 'meticulous',
    phoneticUk: '/məˈtɪk.jə.ləs/',
    phoneticUs: '/məˈtɪk.jə.ləs/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Showing great attention to detail; very careful and precise.',
    definitionCn: '一丝不苟的；缜密的；细致入微的',
    examples: [
      {
        en: 'Meticulous memories sketched in shades of blue.',
        cn: '蓝调微光中勾勒出一丝不苟的记忆。',
        source: 'Song · Urban Solitude'
      },
      {
        en: 'City botanists conduct meticulous surveys across fractured tarmac crevices.',
        cn: '城市植物学家对碎裂的沥青路面裂隙进行了细致入微的生态调研。',
        source: 'IELTS Academic Passage'
      }
    ]
  },
  'catalyst': {
    word: 'catalyst',
    phoneticUk: '/ˈkæt.əl.ɪst/',
    phoneticUs: '/ˈkæt̬.əl.ɪst/',
    partOfSpeech: 'n. 名词',
    definition: 'A person or thing that precipitates an event or change.',
    definitionCn: '催化剂，促成重大变化的人或事物',
    examples: [
      {
        en: 'Every quiet encounter is a catalyst for inner calm.',
        cn: '每一次不经意的相遇，都是内心宁静的催化剂。',
        source: 'Song · Urban Solitude'
      },
      {
        en: 'The development of transport networks acted as a catalyst for botanical dispersion.',
        cn: '交通网络的扩展成为了城市植物物种扩散的关键催化剂。',
        source: 'IELTS Passage 2'
      }
    ]
  },
  'ubiquitous': {
    word: 'ubiquitous',
    phoneticUk: '/juːˈbɪk.wɪ.təs/',
    phoneticUs: '/juːˈbɪk.wə.t̬əs/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Present, appearing, or found everywhere.',
    definitionCn: '无所不在的，普遍存在的，随处可见的',
    examples: [
      {
        en: 'Ubiquitous neon lights softly hum in the dusk.',
        cn: '黄昏中无处不在的霓虹微光低声低鸣。',
        source: 'Song · Tokyo Rain'
      },
      {
        en: 'The ubiquitous presence of spontaneous vegetation challenges traditional city planning.',
        cn: '自生植物的普遍存在对传统的城市景观规划提出了深刻挑战。',
        source: 'IELTS Academic Passage'
      }
    ]
  },
  'transient': {
    word: 'transient',
    phoneticUk: '/ˈtræn.zi.ənt/',
    phoneticUs: '/ˈtræn.ʃənt/',
    partOfSpeech: 'adj. 形容词',
    definition: 'Lasting only for a short time; impermanent.',
    definitionCn: '短暂的，瞬息即逝的，过客',
    examples: [
      {
        en: 'The transient shadows softly start to fade.',
        cn: '转瞬即逝的光影悄然开始褪去。',
        source: 'Song · Jasmine Breeze'
      },
      {
        en: 'Transient environmental disturbances foster botanical diversity.',
        cn: '短暂的环境扰动促进了植物的多样性。',
        source: 'IELTS Academic'
      }
    ]
  },
  'serendipity': {
    word: 'serendipity',
    phoneticUk: '/ˌser.ənˈdɪp.ə.ti/',
    phoneticUs: '/ˌser.ənˈdɪp.ə.t̬i/',
    partOfSpeech: 'n. 名词',
    definition: 'The occurrence and development of events by chance in a happy or beneficial way.',
    definitionCn: '意外发现珍奇事物的机缘，美好的意外收获',
    examples: [
      {
        en: 'Pure serendipity walking down the street.',
        cn: '漫步街道时偶遇的纯粹美好与机缘。',
        source: 'Song · Urban Solitude'
      },
      {
        en: 'Scientific breakthroughs often stem from pure serendipity during experimentation.',
        cn: '科学上的重大突破往往源自实验过程中的意外发现。',
        source: 'IELTS Academic Reading'
      }
    ]
  },
  'sanctuary': {
    word: 'sanctuary',
    phoneticUk: '/ˈsæŋk.tʃu.ə.ri/',
    phoneticUs: '/ˈsæŋk.tʃu.er.i/',
    partOfSpeech: 'n. 名词',
    definition: 'A place of safety, refuge, or quiet retreat.',
    definitionCn: '避难所，静谧庇护所，圣殿',
    examples: [
      {
        en: 'In this sanctuary that our minds have made.',
        cn: '在我们心灵筑造的静谧庇护所中。',
        source: 'Song · Jasmine Breeze'
      },
      {
        en: 'Urban green corridors serve as vital ecological sanctuaries for migrating birds.',
        cn: '城市生态绿道为候鸟提供了关键的生态庇护所。',
        source: 'IELTS Academic'
      }
    ]
  }
};

/**
 * Common grammatical, academic, and lyric vocabulary lookup map.
 */
const COMMON_WORD_CN_DICT: Record<string, { cn: string; pos: string; en: string; uk?: string; us?: string }> = {
  // Articles & Function Words
  'the': { cn: '这，那（定冠词）', pos: 'art. 冠词', en: 'Denoting one or more people or things already mentioned.' },
  'a': { cn: '一，一个（不定冠词）', pos: 'art. 冠词', en: 'Used when referring to someone or something for the first time.' },
  'an': { cn: '一，一个（元音前冠词）', pos: 'art. 冠词', en: 'Used before words beginning with a vowel sound.' },
  'in': { cn: '在……之中，处于', pos: 'prep. 介词', en: 'Expressing the situation of something enclosed or surrounded.' },
  'on': { cn: '在……之上，在……表面', pos: 'prep. 介词', en: 'Physically in contact with and supported by a surface.' },
  'at': { cn: '在……时刻，处于', pos: 'prep. 介词', en: 'Expressing location or arrival in a particular place or position.' },
  'of': { cn: '……的，属于，关于', pos: 'prep. 介词', en: 'Expressing the relationship between a part and a whole.' },
  'to': { cn: '朝向，给，去往', pos: 'prep. 介词', en: 'Expressing direction towards a location or person.' },
  'for': { cn: '为了，作为，对于', pos: 'prep. 介词', en: 'Affecting, with regard to, or in respect of.' },
  'with': { cn: '伴随，随同，携带着', pos: 'prep. 介词', en: 'Accompanied by another person or thing.' },
  'by': { cn: '由，经过，借助', pos: 'prep. 介词', en: 'Through the agency or instrumentality of.' },
  'from': { cn: '来自于，起自', pos: 'prep. 介词', en: 'Indicating the point in space or time at which an action starts.' },
  'into': { cn: '进入，转变为', pos: 'prep. 介词', en: 'Expressing movement or action with the result that someone or something becomes enclosed.' },
  'about': { cn: '关于，大约', pos: 'prep. / adv.', en: 'On the subject of; concerning.' },
  'between': { cn: '在……之间', pos: 'prep. 介词', en: 'At, into, or across the space separating two objects.' },
  'through': { cn: '穿过，经由，透视', pos: 'prep. 介词', en: 'Moving in one side and out of the other side.' },
  'over': { cn: '胜过，在……上方，遍布', pos: 'prep. 介词', en: 'Extending directly upward from; more than.' },
  'under': { cn: '在……下方，在……之下', pos: 'prep. 介词', en: 'Extending or directly below.' },
  'beneath': { cn: '在……下方，深处', pos: 'prep. 介词', en: 'Extending or directly underneath.' },
  'along': { cn: '沿着，顺着', pos: 'prep. 介词', en: 'Moving in a constant direction on a road or path.' },
  'onto': { cn: '到……之上，映射到', pos: 'prep. 介词', en: 'Moving to a position on.' },
  'without': { cn: '没有，不伴随', pos: 'prep. 介词', en: 'In the absence of.' },

  // Conjunctions & Pronouns
  'and': { cn: '并且，和，与', pos: 'conj. 连词', en: 'Used to connect words of the same part of speech.' },
  'or': { cn: '或者，亦或', pos: 'conj. 连词', en: 'Used to link alternatives.' },
  'but': { cn: '但是，然而', pos: 'conj. 连词', en: 'Used to introduce a phrase or clause contrasting with what has gone before.' },
  'while': { cn: '当……之时；虽然，而', pos: 'conj. 连词', en: 'During the time that; whereas.' },
  'as': { cn: '正如，伴随着，因为', pos: 'conj. / prep.', en: 'Used to indicate that something happens during the time when.' },
  'that': { cn: '那，引导词', pos: 'pron. / conj.', en: 'Used to identify a specific person or thing observed.' },
  'which': { cn: '哪一个，关系代词', pos: 'pron. 代词', en: 'Asking for information specifying one or more people or things.' },
  'where': { cn: '在……地方，那里', pos: 'adv. / conj.', en: 'In or to what place or position.' },
  'who': { cn: '谁，哪个人', pos: 'pron. 代词', en: 'What or which person or people.', uk: '/huː/', us: '/huː/' },
  'what': { cn: '什么，多么', pos: 'pron. / det.', en: 'Asking for information specifying something.', uk: '/wɒt/', us: '/wɑːt/' },
  'when': { cn: '何时，当……时候', pos: 'adv. / conj.', en: 'At what time or period.', uk: '/wen/', us: '/wen/' },
  'why': { cn: '为什么，为何', pos: 'adv. 副词', en: 'For what reason or purpose.', uk: '/waɪ/', us: '/waɪ/' },
  'how': { cn: '如何，怎样，多么', pos: 'adv. 副词', en: 'In what way or by what means.', uk: '/haʊ/', us: '/haʊ/' },
  'this': { cn: '这，这个', pos: 'pron. / det.', en: 'Used to identify a specific person or thing close at hand.' },
  'these': { cn: '这些', pos: 'pron. / det.', en: 'Plural of this.' },
  'those': { cn: '那些', pos: 'pron. / det.', en: 'Plural of that.' },
  'you': { cn: '你，你们，您', pos: 'pron. 人称代词', en: 'Used to refer to the person or people that the speaker is addressing.', uk: '/juː/', us: '/juː/' },
  'i': { cn: '我', pos: 'pron. 人称代词', en: 'Used by a speaker to refer to himself or herself.', uk: '/aɪ/', us: '/aɪ/' },
  'me': { cn: '我（宾格）', pos: 'pron. 人称代词', en: 'Used by a speaker to refer to himself or herself as the object.', uk: '/miː/', us: '/miː/' },
  'he': { cn: '他', pos: 'pron. 人称代词', en: 'Used to refer to a man, boy, or male.', uk: '/hiː/', us: '/hiː/' },
  'him': { cn: '他（宾格）', pos: 'pron. 人称代词', en: 'Used as the object of a verb or preposition to refer to a male.', uk: '/hɪm/', us: '/hɪm/' },
  'his': { cn: '他的', pos: 'pron. 物主代词', en: 'Belonging to or associated with a male.', uk: '/hɪz/', us: '/hɪz/' },
  'she': { cn: '她', pos: 'pron. 人称代词', en: 'Used to refer to a woman or girl.', uk: '/ʃiː/', us: '/ʃiː/' },
  'her': { cn: '她的；她（宾格）', pos: 'pron. 物主代词 / 宾格', en: 'Belonging to or associated with a female.', uk: '/hɜː/', us: '/hɜːr/' },
  'we': { cn: '我们', pos: 'pron. 人称代词', en: 'Used by a speaker to refer to himself or herself and others.', uk: '/wiː/', us: '/wiː/' },
  'us': { cn: '我们（宾格）', pos: 'pron. 人称代词', en: 'Used as the object to refer to the speaker and others.', uk: '/ʌs/', us: '/ʌs/' },
  'they': { cn: '他们，她们，它们', pos: 'pron. 人称代词', en: 'Used to refer to two or more people or things.', uk: '/ðeɪ/', us: '/ðeɪ/' },
  'them': { cn: '他们/她们/它们（宾格）', pos: 'pron. 人称代词', en: 'Used as the object to refer to two or more people or things.', uk: '/ðem/', us: '/ðem/' },
  'their': { cn: '他们的，它们所属的', pos: 'pron. 物主代词', en: 'Belonging to or associated with the people or things previously mentioned.' },
  'theirs': { cn: '他们的（名词性物主代词）', pos: 'pron. 代词', en: 'Belonging to or associated with them.' },
  'our': { cn: '我们的', pos: 'pron. 物主代词', en: 'Belonging to or associated with the speaker and others.' },
  'ours': { cn: '我们的（名词性物主代词）', pos: 'pron. 代词', en: 'Belonging to or associated with us.' },
  'my': { cn: '我的', pos: 'pron. 物主代词', en: 'Belonging to or associated with the speaker.' },
  'mine': { cn: '我的（东西）', pos: 'pron. 代词', en: 'Belonging to or associated with the speaker.' },
  'your': { cn: '你的，你们的', pos: 'pron. 物主代词', en: 'Belonging to or associated with the person addressed.' },
  'yours': { cn: '你的（东西），你们的', pos: 'pron. 代词', en: 'Belonging to or associated with you.' },
  'it': { cn: '它，这件事', pos: 'pron. 人称代词', en: 'Used to refer to a thing, animal, or situation.', uk: '/ɪt/', us: '/ɪt/' },
  'its': { cn: '它的', pos: 'pron. 物主代词', en: 'Belonging to or associated with a thing.' },
  'all': { cn: '所有的，全部，一切', pos: 'det. / pron.', en: 'The whole number or amount of.', uk: '/ɔːl/', us: '/ɑːl/' },
  'some': { cn: '一些，某些', pos: 'det. / pron.', en: 'An unspecified amount or number of.', uk: '/sʌm/', us: '/sʌm/' },
  'any': { cn: '任何，任一', pos: 'det. / pron.', en: 'Used to refer to one or some of a thing or number of things.', uk: '/ˈen.i/', us: '/ˈen.i/' },
  'no': { cn: '没有，不', pos: 'det. / adv.', en: 'Not any; not at all.', uk: '/nəʊ/', us: '/noʊ/' },
  'never': { cn: '决不，从未，永不', pos: 'adv. 副词', en: 'At no time in the past or future; not ever.', uk: '/ˈnev.ər/', us: '/ˈnev.ɚ/' },
  'always': { cn: '总是，始终，永远', pos: 'adv. 副词', en: 'At all times; on all occasions.', uk: '/ˈɔːl.weɪz/', us: '/ˈɑːl.weɪz/' },
  'often': { cn: '经常，常常', pos: 'adv. 副词', en: 'Frequently; many times.', uk: '/ˈɒf.ən/', us: '/ˈɑːf.ən/' },
  'sometimes': { cn: '有时，间或', pos: 'adv. 副词', en: 'Occasionally, rather than all of the time.', uk: '/ˈsʌm.taɪmz/', us: '/ˈsʌm.taɪmz/' },
  'ever': { cn: '曾经，究竟，永远', pos: 'adv. 副词', en: 'At any time; continuously.', uk: '/ˈev.ər/', us: '/ˈev.ɚ/' },
  'not': { cn: '不，并非', pos: 'adv. 副词', en: 'Used with an auxiliary verb or "be" to form the negative.' },
  'more': { cn: '更多，更', pos: 'adj. / adv.', en: 'A greater or additional amount or degree.' },
  'most': { cn: '最多，绝大多数', pos: 'adj. / adv.', en: 'Greatest in amount, quantity, or degree.' },
  'than': { cn: '比，较之', pos: 'conj. / prep.', en: 'Used to introduce the second element in a comparison.' },
  'rather': { cn: '而不是，宁可，相当', pos: 'adv. 副词', en: 'Used to indicate preference or alternative.' },
  'furthermore': { cn: '此外，而且，再者', pos: 'adv. 副词', en: 'In addition; moreover.' },
  'for instance': { cn: '例如，举例来说', pos: '短语', en: 'As an example.' },
  'for example': { cn: '例如，比如', pos: '短语', en: 'Used to introduce an example.' },
  'give up': { cn: '放弃，放手，认输', pos: 'v. 动词短语', en: 'To cease making an effort; surrender.', uk: '/ɡɪv ʌp/', us: '/ɡɪv ʌp/' },
  'you gotta give up': { cn: '你必须放弃 / 你得放手', pos: '短语 · 表达', en: 'Expression indicating that one must surrender or let go.' },
  'never gonna give you up': { cn: '绝不会放弃你 / 绝不对你放手', pos: '经典歌词 · 核心句', en: 'A famous lyric promising steadfast commitment and love.' },
  'let down': { cn: '使……失望，辜负', pos: 'v. 动词短语', en: 'Fail to support or help as expected.', uk: '/let daʊn/', us: '/let daʊn/' },
  'run around': { cn: '东奔西跑，到处乱跑', pos: 'v. 动词短语', en: 'Be very busy doing many different things.', uk: '/rʌn əˈraʊnd/', us: '/rʌn əˈraʊnd/' },
  'tell a lie': { cn: '说谎，撒谎', pos: '短语 · 动词词组', en: 'To speak falsely with the intention to deceive.', uk: '/tel ə laɪ/', us: '/tel ə laɪ/' },
  'say goodbye': { cn: '道别，说再见', pos: '短语 · 表达', en: 'To bid farewell to someone.' },

  // Verbs & Nouns from Passages & Lyrics
  'be': { cn: '是，存在', pos: 'v. 动词', en: 'Exist; have a specified quality.' },
  'am': { cn: '是（第一人称单数）', pos: 'v. be动词', en: 'First person singular present of be.' },
  'is': { cn: '是（第三人称单数）', pos: 'v. be动词', en: 'Third person singular present of be.' },
  'are': { cn: '是（复数/第二人称）', pos: 'v. be动词', en: 'Second person singular and plural present of be.' },
  'was': { cn: '是（过去时）', pos: 'v. be动词', en: 'First and third person singular past of be.' },
  'were': { cn: '是（复数/第二人称过去时）', pos: 'v. be动词', en: 'Second person singular and plural past of be.' },
  'been': { cn: '已经存在（过去分词）', pos: 'v. be动词', en: 'Past participle of be.' },
  'being': { cn: '存在，处于……状态', pos: 'v. / n.', en: 'Present participle of be; existence.' },
  'do': { cn: '做，干，助动词', pos: 'v. 动词', en: 'Perform an action, the deed or task.', uk: '/duː/', us: '/duː/' },
  'did': { cn: '做了（过去时）', pos: 'v. 动词', en: 'Past tense of do.' },
  'done': { cn: '完成，做完', pos: 'v. 动词', en: 'Past participle of do.' },
  'has': { cn: '拥有，具有（单数）', pos: 'v. 动词', en: 'Third person singular present of have.' },
  'have': { cn: '具有，拥有，度过', pos: 'v. 动词', en: 'Possess, own, or hold.' },
  'had': { cn: '曾拥有，过去具有', pos: 'v. 动词', en: 'Past tense of have.' },
  'give': { cn: '给予，付出，交给', pos: 'v. 动词', en: 'Freely transfer the possession of something to someone.', uk: '/ɡɪv/', us: '/ɡɪv/' },
  'gave': { cn: '给予（过去时）', pos: 'v. 动词', en: 'Past tense of give.' },
  'given': { cn: '给定的，给予（过去分词）', pos: 'v. / adj.', en: 'Past participle of give.' },
  'up': { cn: '向上；彻底，完全', pos: 'adv. / prep.', en: 'Towards a higher position; completely.', uk: '/ʌp/', us: '/ʌp/' },
  'gotta': { cn: '必须，得（got to 的口语缩读）', pos: 'v. / aux. 口语', en: 'Informal contraction of "(have) got to" or "got a".', uk: '/ˈɡɒt.ə/', us: '/ˈɡɑː.t̬ə/' },
  'gonna': { cn: '将要，打算（going to 的口语缩读）', pos: 'v. / aux. 口语', en: 'Informal contraction of "going to".', uk: '/ˈɡɒn.ə/', us: '/ˈɡɑː.nə/' },
  'wanna': { cn: '想要（want to 的口语缩读）', pos: 'v. 口语', en: 'Informal contraction of "want to" or "want a".', uk: '/ˈwɒn.ə/', us: '/ˈwɑː.nə/' },
  'got': { cn: '得到，拥有（get 的过去式）', pos: 'v. 动词', en: 'Past tense of get.', uk: '/ɡɒt/', us: '/ɡɑːt/' },
  'get': { cn: '获得，得到，变成', pos: 'v. 动词', en: 'Come to have or hold something; receive.', uk: '/ɡet/', us: '/ɡet/' },
  'getting': { cn: '正在变得，获得中', pos: 'v. 动词', en: 'Present participle of get.' },
  'let': { cn: '让，允许，任凭', pos: 'v. 动词', en: 'Not prevent or forbid; allow.', uk: '/let/', us: '/let/' },
  'tell': { cn: '讲述，告知，分辨', pos: 'v. 动词', en: 'Communicate information, facts, or news.', uk: '/tel/', us: '/tel/' },
  'told': { cn: '讲述（过去时）', pos: 'v. 动词', en: 'Past tense of tell.' },
  'say': { cn: '说，表达，道出', pos: 'v. 动词', en: 'Utter words so as to convey information.', uk: '/seɪ/', us: '/seɪ/' },
  'said': { cn: '说道（过去时）', pos: 'v. 动词', en: 'Past tense of say.' },
  'cry': { cn: '哭泣，流泪；呼喊', pos: 'v. / n.', en: 'Shed tears, typically as an expression of sorrow.', uk: '/kraɪ/', us: '/kraɪ/' },
  'crying': { cn: '哭泣着，流泪', pos: 'v. 动词', en: 'Present participle of cry.' },
  'lie': { cn: '谎言；说谎；平躺', pos: 'n. / v.', en: 'An intentionally false statement; recline.', uk: '/laɪ/', us: '/laɪ/' },
  'hurt': { cn: '伤害，使受创，疼痛', pos: 'v. / adj.', en: 'Cause physical or emotional pain to.', uk: '/hɜːt/', us: '/hɝːt/' },
  'desert': { cn: '抛弃，离弃；沙漠', pos: 'v. / n.', en: 'Abandon in a way considered disloyal or treacherous.', uk: '/dɪˈzɜːt/', us: '/dɪˈzɝːt/' },
  'around': { cn: '到处，在周围，大约', pos: 'adv. / prep.', en: 'Located or moving on every side.', uk: '/əˈraʊnd/', us: '/əˈraʊnd/' },
  'run': { cn: '奔跑，运转，流淌', pos: 'v. 动词', en: 'Move at a speed faster than a walk.', uk: '/rʌn/', us: '/rʌn/' },
  'running': { cn: '奔跑着，运转中', pos: 'v. 动词', en: 'Present participle of run.' },
  'know': { cn: '知晓，懂得，了解', pos: 'v. 动词', en: 'Be aware of through observation, inquiry, or information.', uk: '/nəʊ/', us: '/noʊ/' },
  'knew': { cn: '曾知晓（过去时）', pos: 'v. 动词', en: 'Past tense of know.' },
  'known': { cn: '知名的，已知的', pos: 'v. / adj.', en: 'Past participle of know.' },
  'feel': { cn: '感受，触碰，觉得', pos: 'v. 动词', en: 'Be aware of through physical sensation or emotion.', uk: '/fiːl/', us: '/fiːl/' },
  'feeling': { cn: '感觉，情愫，触感', pos: 'n. / v.', en: 'An emotional state or reaction.' },
  'felt': { cn: '感受到（过去时）', pos: 'v. 动词', en: 'Past tense of feel.' },
  'make': { cn: '制作，塑造，使得', pos: 'v. 动词', en: 'Form by putting parts together; create.', uk: '/meɪk/', us: '/meɪk/' },
  'making': { cn: '制造中，正在塑造', pos: 'v. 动词', en: 'Present participle of make.' },
  'see': { cn: '看见，领会，目睹', pos: 'v. 动词', en: 'Perceive with the eyes; discern visually.', uk: '/siː/', us: '/siː/' },
  'saw': { cn: '目睹（过去时）', pos: 'v. 动词', en: 'Past tense of see.' },
  'seen': { cn: '看见（过去分词）', pos: 'v. 动词', en: 'Past participle of see.' },
  'think': { cn: '思考，遐想，认为', pos: 'v. 动词', en: 'Have a particular opinion, belief, or idea.', uk: '/θɪŋk/', us: '/θɪŋk/' },
  'thought': { cn: '思考过（过去时）；思绪', pos: 'v. / n.', en: 'Past tense of think; an idea.' },
  'love': { cn: '爱，热爱，深情', pos: 'n. / v.', en: 'An intense feeling of deep affection.', uk: '/lʌv/', us: '/lʌv/' },
  'like': { cn: '喜欢；如同，类似', pos: 'v. / prep.', en: 'Find agreeable; having the same characteristics.', uk: '/laɪk/', us: '/laɪk/' },
  'need': { cn: '需要，必须，渴求', pos: 'v. / n.', en: 'Require because it is essential or very important.', uk: '/niːd/', us: '/niːd/' },
  'want': { cn: '想要，希求，期望', pos: 'v. 动词', en: 'Have a desire to possess or do.', uk: '/wɒnt/', us: '/wɑːnt/' },
  'live': { cn: '生活，生存，居住', pos: 'v. 动词', en: 'Remain alive; make one\'s home.', uk: '/lɪv/', us: '/lɪv/' },
  'leave': { cn: '离开，遗留，告别', pos: 'v. 动词', en: 'Go away from; leave behind.', uk: '/liːv/', us: '/liːv/' },
  'left': { cn: '离开（过去时）；左边', pos: 'v. / adj.', en: 'Past tense of leave; opposite of right.' },
  'stay': { cn: '停留，留下，保持', pos: 'v. 动词', en: 'Remain in the same place or condition.', uk: '/steɪ/', us: '/steɪ/' },
  'keep': { cn: '保持，保留，守护', pos: 'v. 动词', en: 'Continue or cause to continue in a specified condition.', uk: '/kiːp/', us: '/kiːp/' },
  'kept': { cn: '保持（过去时）', pos: 'v. 动词', en: 'Past tense of keep.' },
  'hold': { cn: '执握，保持，容纳', pos: 'v. 动词', en: 'Grasp, carry, or support with one\'s hands.', uk: '/həʊld/', us: '/hoʊld/' },
  'held': { cn: '执握（过去时）', pos: 'v. 动词', en: 'Past tense of hold.' },
  'fall': { cn: '坠落，飘落，秋天', pos: 'v. / n.', en: 'Move downward, typically rapidly and freely.', uk: '/fɔːl/', us: '/fɑːl/' },
  'fell': { cn: '跌落（过去时）', pos: 'v. 动词', en: 'Past tense of fall.' },
  'fallen': { cn: '坠落的，陨落的', pos: 'adj. / v.', en: 'Past participle of fall.' },
  'look': { cn: '看，注视，神态', pos: 'v. / n.', en: 'Direct one\'s gaze toward someone or something.', uk: '/lʊk/', us: '/lʊk/' },
  'good': { cn: '美好的，良好的，优秀的', pos: 'adj. 形容词', en: 'To be desired or approved of.', uk: '/ɡʊd/', us: '/ɡʊd/' },
  'better': { cn: '更好的，更胜一筹', pos: 'adj. / adv.', en: 'Comparative of good.' },
  'best': { cn: '最好的，极佳的', pos: 'adj. / adv.', en: 'Superlative of good.' },
  'bad': { cn: '不好的，糟糕的', pos: 'adj. 形容词', en: 'Of poor quality or low standard.', uk: '/bæd/', us: '/bæd/' },
  'world': { cn: '世界，尘世，天地', pos: 'n. 名词', en: 'The earth, together with all of its countries and peoples.', uk: '/wɜːld/', us: '/wɝːld/' },
  'life': { cn: '生命，人生，生活', pos: 'n. 名词', en: 'The condition that distinguishes animals and plants from inorganic matter.', uk: '/laɪf/', us: '/laɪf/' },
  'day': { cn: '白昼，日子，天', pos: 'n. 名词', en: 'A period of twenty-four hours; daytime.', uk: '/deɪ/', us: '/deɪ/' },
  'days': { cn: '岁月，日子，时光', pos: 'n. 名词', en: 'Plural of day.' },
  'way': { cn: '道路，方式，途径', pos: 'n. 名词', en: 'A method, style, or manner of doing something.', uk: '/weɪ/', us: '/weɪ/' },
  'light': { cn: '光芒，晨曦，轻盈的', pos: 'n. / adj.', en: 'The natural agent that stimulates sight and makes things visible.', uk: '/laɪt/', us: '/laɪt/' },
  'soul': { cn: '灵魂，心神，精髓', pos: 'n. 名词', en: 'The spiritual or immaterial part of a human being.', uk: '/səʊl/', us: '/soʊl/' },
  'dream': { cn: '梦想，梦境，憧憬', pos: 'n. / v.', en: 'A series of thoughts, images, and sensations occurring in a person\'s mind.', uk: '/driːm/', us: '/driːm/' },
  'dreams': { cn: '美梦，梦想，愿景', pos: 'n. 名词', en: 'Plural of dream.' },
  'finding': { cn: '寻得，发现，探得', pos: 'v. / n.', en: 'Discovering or attaining something.' },
  'persists': { cn: '恒久延续，坚持，存续', pos: 'v. 动词', en: 'Continues to exist; be prolonged.' },
  'subtle': { cn: '微妙的，细致的，含蓄的', pos: 'adj. 形容词', en: 'Delicate or precise as to be difficult to analyze.' },
  'warmth': { cn: '温暖，温情，和煦', pos: 'n. 名词', en: 'The quality or sensation of being warm.' },
  'surrounds': { cn: '环绕，包围，萦绕', pos: 'v. 动词', en: 'All around someone or something.' },
  'thoughts': { cn: '思绪，心绪，遐想', pos: 'n. 名词', en: 'Ideas or opinions produced by thinking.' },
  'learning': { cn: '领悟，体会，汲取', pos: 'v. / n.', en: 'The acquisition of knowledge or wisdom.' },
  'beauty': { cn: '美丽，美好，韶华', pos: 'n. 名词', en: 'A combination of qualities that pleases aesthetic senses.' },
  'lessons': { cn: '领悟，启迪，岁月的沉淀', pos: 'n. 名词', en: 'A period of learning or experience that teaches wisdom.' },
  'time': { cn: '时光，岁月，时间', pos: 'n. 名词', en: 'The indefinite continued progress of existence.' },
  'brought': { cn: '带来，赋予，沉淀', pos: 'v. 动词', en: 'Past participle of bring; caused to come.' },
  'shadows': { cn: '光影，阴影，残影', pos: 'n. 名词', en: 'Dark areas produced by an obstacle blocking light.' },
  'softly': { cn: '轻柔地，悄然地，温和地', pos: 'adv. 副词', en: 'In a careful, gentle, and quiet manner.' },
  'start': { cn: '开始，启程，萌生', pos: 'v. / n.', en: 'Begin or be reckoned from a particular point.' },
  'fade': { cn: '褪去，消散，渐隐', pos: 'v. 动词', en: 'Gradually grow faint and disappear.' },
  'minds': { cn: '心灵，心神，意绪', pos: 'n. 名词', en: 'The human faculty of reasoning, thought, and emotion.' },
  'made': { cn: '构筑，塑造，营造', pos: 'v. 动词', en: 'Formed or created.' },
  'listen': { cn: '倾听，聆听，静听', pos: 'v. 动词', en: 'Give one\'s attention to a sound.' },
  'pulse': { cn: '脉动，节拍，律动', pos: 'n. 名词', en: 'A rhythmical throbbing or vibrating movement.' },
  'tranquility': { cn: '恬淡，宁静，安详', pos: 'n. 名词', en: 'The quality or state of being tranquil; peace.' },
  'ease': { cn: '从容，舒缓，惬意', pos: 'n. 名词', en: 'Freedom from worries; lightness of mind.' },
  'drifting': { cn: '漂流，漫游，从容飘移', pos: 'v. 动词', en: 'Being carried slowly by a current.' },
  'calmly': { cn: '从容地，恬静地，平静地', pos: 'adv. 副词', en: 'Without agitation or strong emotion.' },
  'golden': { cn: '金色的，灿烂温暖的', pos: 'adj. 形容词', en: 'Radiant or colored like gold.' },
  'words': { cn: '词句，言语，词汇', pos: 'n. 名词', en: 'Single distinct meaningful elements of speech or writing.' },
  'awaken': { cn: '唤醒，启发，苏醒', pos: 'v. 动词', en: 'Rouse from sleep; evoke wisdom.' },
  'wisdom': { cn: '智慧，哲思，豁达', pos: 'n. 名词', en: 'The quality of having experience, knowledge, and good judgement.' },
  'heart': { cn: '内心，心房，心扉', pos: 'n. 名词', en: 'The centre of a person\'s thoughts and emotions.' },
  'serene': { cn: '安详的，静谧的，恬适的', pos: 'adj. 形容词', en: 'Calm, peaceful, and untroubled; tranquil.' },
  'journey': { cn: '旅程，旅途，行旅', pos: 'n. 名词', en: 'An act of traveling; life progression.' },
  'ready': { cn: '蓄势待发，准备就绪', pos: 'adj. 形容词', en: 'In a suitable state for an action.' },
  'take': { cn: '开启，踏上，执取', pos: 'v. 动词', en: 'Lay hold of; carry out or undertake.' },
  'air': { cn: '微风，空气，空间氛围', pos: 'n. 名词', en: 'Atmospheric ambiance; the air around us.' },
  'raindrops': { cn: '雨滴，细雨微芒', pos: 'n. 名词', en: 'Single drops of rain.' },
  'tapping': { cn: '轻敲，轻叩，淅淅沥沥', pos: 'v. 动词', en: 'Striking a surface lightly and repeatedly.' },
  'foggy': { cn: '雾气氤氲的，朦胧的', pos: 'adj. 形容词', en: 'Full of fog; hazy and moody.' },
  'window': { cn: '窗户，玻璃窗', pos: 'n. 名词', en: 'An opening fitted with glass.' },
  'pane': { cn: '窗玻璃，窗格', pos: 'n. 名词', en: 'A single sheet of glass in a window.' },
  'melody': { cn: '旋律，曲调，悠扬之音', pos: 'n. 名词', en: 'A musically satisfying sequence of notes.' },
  'echoing': { cn: '回响，回荡，回鸣', pos: 'v. 动词', en: 'Resonating or repeating a sound.' },
  'down': { cn: '沿着，顺着道路延伸', pos: 'prep. / adv.', en: 'Along in a specified direction.' },
  'avenue': { cn: '大道，林荫道，街道', pos: 'n. 名词', en: 'A broad road in a town or city.' },
  'again': { cn: '再次，重又，再度', pos: 'adv. 副词', en: 'Another time; once more.' },
  'memories': { cn: '记忆，回忆，往事', pos: 'n. 名词', en: 'Something remembered from the past.' },
  'sketched': { cn: '勾勒，描摹，素描', pos: 'v. 动词', en: 'Drawn or outlined with delicate strokes.' },
  'blue': { cn: '蓝色，忧郁蓝调，靛蓝', pos: 'n. / adj.', en: 'Poetic melancholy or indigo color.' },
  'chance': { cn: '偶然的，偶遇的，契机', pos: 'adj. / n.', en: 'A possibility; unexpected opportunity.' },
  'encounter': { cn: '相遇，邂逅，偶遇', pos: 'n. / v.', en: 'An unexpected or casual meeting.' },
  'dissolving': { cn: '消解，融化，消散', pos: 'v. 动词', en: 'Dispersing or fading gently.' },
  'sorrow': { cn: '忧伤，悲愁，心绪', pos: 'n. 名词', en: 'A feeling of deep emotional distress.' },
  'twilight': { cn: '暮色，薄暮，黄昏', pos: 'n. 名词', en: 'The soft glowing light from the sky at dusk.' },
  'mist': { cn: '薄雾，烟雨，雾气', pos: 'n. 名词', en: 'A cloud of tiny water droplets in air.' },
  'pure': { cn: '纯粹的，纯净的，清澈的', pos: 'adj. 形容词', en: 'Not mixed; clear and unadulterated.' },
  'walking': { cn: '漫步，踱步，独行', pos: 'v. 动词', en: 'Moving at a regular contemplative pace.' },
  'street': { cn: '街头，街巷，马路', pos: 'n. 名词', en: 'A public road in a city or town.' },
  'midnight': { cn: '子夜，午夜，夜深时分', pos: 'n. 名词', en: 'Twelve o\'clock at night.' },
  'distant': { cn: '遥远的，旷远的，隐约的', pos: 'adj. 形容词', en: 'Far away in space or time.' },
  'echoes': { cn: '回声，余音，回响', pos: 'n. 名词', en: 'Reflected sounds or lingering traces.' },
  'meet': { cn: '相逢，交汇，交织', pos: 'v. 动词', en: 'Come into contact or unite.' },
  'city': { cn: '城市，都市，城廓', pos: 'n. 名词', en: 'A large town.' },
  'humming': { cn: '低吟，轻声哼唱，微鸣', pos: 'n. / v.', en: 'Making a low, steady continuous sound.' },
  'sound': { cn: '声响，回声，音律', pos: 'n. 名词', en: 'Auditory vibration or musical tone.' },
  'oasis': { cn: '绿洲，静谧庇护地', pos: 'n. 名词', en: 'A pleasant, peaceful retreat.' },
  'waiting': { cn: '静待，等待，静候', pos: 'v. 动词', en: 'Remaining in expectation.' },
  'embrace': { cn: '拥抱，接纳，融汇', pos: 'v. 动词', en: 'Accept willingly or hold close.' },
  'rhythm': { cn: '节奏，律动，节拍', pos: 'n. 名词', en: 'A strong, regular pattern of sound.' },
  'solitary': { cn: '独行的，独处的，沉静的', pos: 'adj. 形容词', en: 'Done or existing alone.' },
  'flight': { cn: '航程，旅途，飞翔', pos: 'n. 名词', en: 'Personal contemplative voyage.' },
  'guiding': { cn: '指引，引领，导航', pos: 'v. 动词', en: 'Directing the path.' },
  'steps': { cn: '脚步，足迹，步履', pos: 'n. 名词', en: 'Paces or footsteps.' },
  'cool': { cn: '清冷的，凉爽的，沉着的', pos: 'adj. 形容词', en: 'Of low temperature; calm.' },
  'obsidian': { cn: '黑曜石般的，深邃暗夜的', pos: 'adj. / n.', en: 'Deep volcanic black glass.' },
  'night': { cn: '长夜，黑夜，夜幕', pos: 'n. 名词', en: 'The dark period of twenty-four hours.' },
  'piano': { cn: '钢琴，钢琴和弦', pos: 'n. 名词', en: 'A keyboard musical instrument.' },
  'chords': { cn: '和弦，琴音，音律', pos: 'n. 名词', en: 'Harmonious musical notes played together.' },
  'sky': { cn: '苍穹，夜空，天际', pos: 'n. 名词', en: 'The heavenly expanse.' },
  'moments': { cn: '时光，片刻，瞬间', pos: 'n. 名词', en: 'Brief, memorable instants.' },
  'wander': { cn: '漫游，流淌，漫步', pos: 'v. 动词', en: 'Move slowly and contemplatively.' },
  'flora': { cn: '植物群，植被，植物志', pos: 'n. 名词', en: 'The plants of a particular region or habitat.' },
  'fauna': { cn: '动物群，动物志', pos: 'n. 名词', en: 'The animals of a particular region or habitat.' },
  'grain': { cn: '谷物，粮食，谷粒', pos: 'n. 名词', en: 'Wheat or cereal grain transported along trade lines.' },
  'transportation': { cn: '交通，运输，货运', pos: 'n. 名词', en: 'The movement of goods or passengers.' },
  'networks': { cn: '网络，交通体系', pos: 'n. 复数名词', en: 'Interconnected systems or routes.' },
  'contract': { cn: '收缩，缩减，减小', pos: 'v. 动词', en: 'Decrease in extent or size.' },
  'expand': { cn: '扩张，延伸，扩大', pos: 'v. 动词', en: 'Increase in area or volume.' },
  'dynamics': { cn: '动态机制，动态过程', pos: 'n. 名词', en: 'Forces or processes stimulating change within a system.' },
  'accidental': { cn: '偶发的，偶然形成的', pos: 'adj. 形容词', en: 'Occurring unintentionally or naturally.' },
  'crucial': { cn: '至关重要的，关键性的', pos: 'adj. 形容词', en: 'Decisive or critical for success.' },
  'developing': { cn: '构建，发展，推进', pos: 'v. 动词', en: 'Growing or advancing to a mature state.' },
  'futures': { cn: '未来，发展前景', pos: 'n. 复数名词', en: 'Prospective states or ecological visions.' },
  // Lyric & Academic core vocabulary additions
  'ancient': { cn: '古老的，远古的，古代的', pos: 'adj. 形容词', en: 'Belonging to the very distant past and no longer in existence.', uk: '/ˈeɪn.ʃənt/', us: '/ˈeɪn.ʃənt/' },
  'stone': { cn: '石头，石阶，石碑', pos: 'n. 名词', en: 'Hard solid non-metallic mineral matter.', uk: '/stəʊn/', us: '/stoʊn/' },
  'across': { cn: '横跨，穿过，穿行', pos: 'prep. 介词', en: 'From one side to the other of something.', uk: '/əˈkrɒs/', us: '/əˈkrɑːs/' },
  'step': { cn: '步伐，迈步，步骤', pos: 'n. / v.', en: 'An act or movement of putting one leg in front of the other.', uk: '/step/', us: '/step/' },
  'embers': { cn: '余烬，余晖，微光', pos: 'n. 名词', en: 'Small pieces of glowing coal or wood in a dying fire.', uk: '/ˈem.bəz/', us: '/ˈem.bɚz/' },
  'ember': { cn: '余烬，微光', pos: 'n. 名词', en: 'A small piece of glowing coal in a dying fire.', uk: '/ˈem.bər/', us: '/ˈem.bɚ/' },
  'velvet': { cn: '天鹅绒般的，柔滑深邃的', pos: 'adj. / n.', en: 'Closely woven fabric with a thick soft pile.', uk: '/ˈvel.vɪt/', us: '/ˈvel.vət/' },
  'fleeting': { cn: '飞逝的，转瞬即逝的，短暂的', pos: 'adj. 形容词', en: 'Lasting for a very short time; ephemeral.', uk: '/ˈfliː.tɪŋ/', us: '/ˈfliː.t̬ɪŋ/' },
  'drift': { cn: '漂流，飘荡，流淌', pos: 'v. 动词', en: 'Be carried slowly by a current of air or water.', uk: '/drɪft/', us: '/drɪft/' },
  'spark': { cn: '火花，闪光，灵感', pos: 'n. 名词', en: 'A small fiery particle thrown off from a fire.', uk: '/spɑːk/', us: '/spɑːrk/' },
  'tide': { cn: '潮汐，晨潮，浪潮', pos: 'n. 名词', en: 'The alternate rising and falling of the sea.', uk: '/taɪd/', us: '/taɪd/' },
  'diverse': { cn: '多元的，多样的，千姿百态的', pos: 'adj. 形容词', en: 'Showing a great deal of variety; very different.', uk: '/daɪˈvɜːs/', us: '/dɪˈvɝːs/' },
  'spirits': { cn: '灵魂，心神，生灵', pos: 'n. 名词', en: 'The non-physical parts of a person; attitudes.', uk: '/ˈspɪr.ɪts/', us: '/ˈspɪr.əts/' },
  'spirit': { cn: '精神，灵魂，气魄', pos: 'n. 名词', en: 'The non-physical part of a person; soul.', uk: '/ˈspɪr.ɪt/', us: '/ˈspɪr.ət/' },
  'peacefully': { cn: '平和地，宁静地，安详地', pos: 'adv. 副词', en: 'In a peaceful manner; serenely.', uk: '/ˈpiːs.fəl.i/', us: '/ˈpiːs.fəl.i/' },
  'coexist': { cn: '共存，和平相处', pos: 'v. 动词', en: 'Exist at the same time or in the same place.', uk: '/ˌkəʊ.ɪɡˈzɪst/', us: '/ˌkoʊ.ɪɡˈzɪst/' },
  'transformation': { cn: '蜕变，转变，升华', pos: 'n. 名词', en: 'A marked change in form, nature, or appearance.', uk: '/ˌtræns.fəˈmeɪ.ʃən/', us: '/ˌtræns.fɚˈmeɪ.ʃən/' },
  'deep': { cn: '深刻的，深沉的，深邃的', pos: 'adj. / adv.', en: 'Extending far down from the top or surface.', uk: '/diːp/', us: '/diːp/' },
  'within': { cn: '在……内部，在心底', pos: 'prep. 介词', en: 'Inside something; inwardly.', uk: '/wɪˈðɪn/', us: '/wɪˈðɪn/' },
  'broken': { cn: '破碎的，残缺的，受创的', pos: 'adj. 形容词', en: 'Having been fractured or damaged.', uk: '/ˈbrəʊ.kən/', us: '/ˈbroʊ.kən/' },
  'whole': { cn: '完整的，全然，健全的', pos: 'adj. / n.', en: 'Entire; uninjured or restored.', uk: '/həʊl/', us: '/hoʊl/' },
  'carry': { cn: '携带，承载，传递', pos: 'v. 动词', en: 'Support and move someone or something.', uk: '/ˈkær.i/', us: '/ˈker.i/' },
  'acoustic': { cn: '原声的，声学的，听觉的', pos: 'adj. 形容词', en: 'Relating to sound or musical instruments without electrical amplification.', uk: '/əˈkuː.stɪk/', us: '/əˈkuː.stɪk/' },
  'embracing': { cn: '拥抱，接纳，融汇', pos: 'v. 动词', en: 'Holding closely; accepting eagerly.', uk: '/ɪmˈbreɪ.sɪŋ/', us: '/ɪmˈbreɪ.sɪŋ/' },
  'shared': { cn: '共同的，共享的，共有的', pos: 'adj. 形容词', en: 'Distributed between two or more people.', uk: '/ʃeəd/', us: '/ʃerd/' },
  'reality': { cn: '现实，真切瞬间，真实', pos: 'n. 名词', en: 'The world or state of things as they actually exist.', uk: '/riˈæl.ə.ti/', us: '/riˈæl.ə.t̬i/' },
  'gently': { cn: '温柔地，轻轻地，从容地', pos: 'adv. 副词', en: 'With a gentle or mild manner.', uk: '/ˈdʒent.li/', us: '/ˈdʒent.li/' },
  'harmony': { cn: '和谐，和睦，和声', pos: 'n. 名词', en: 'Agreement, concord, or harmonious combination.', uk: '/ˈhɑː.mə.ni/', us: '/ˈhɑːr.mə.ni/' },
  'radiance': { cn: '光华，光芒，容光焕发', pos: 'n. 名词', en: 'Light or heat emitted or reflected by something.', uk: '/ˈreɪ.di.əns/', us: '/ˈreɪ.di.əns/' },
  'watching': { cn: '注视着，静观，看着', pos: 'v. 动词', en: 'Observing attentively over a period of time.', uk: '/ˈwɒtʃ.ɪŋ/', us: '/ˈwɑːtʃ.ɪŋ/' },
  'whisper': { cn: '低语，耳语，呢喃', pos: 'n. / v.', en: 'Speak very softly using one\'s breath.', uk: '/ˈwɪs.pər/', us: '/ˈwɪs.pɚ/' },
  'breeze': { cn: '微风，和风', pos: 'n. 名词', en: 'A gentle wind.', uk: '/briːz/', us: '/briːz/' },
  'guide': { cn: '指引，引导，向导', pos: 'v. / n.', en: 'Show or indicate the way to.', uk: '/ɡaɪd/', us: '/ɡaɪd/' },
  'guides': { cn: '指引着，引领', pos: 'v. 动词', en: 'Third person singular of guide.' }
};

/**
 * Clean punctuation for lookup
 */
export function cleanWordText(raw: string): string {
  return raw.replace(/^[“"‘'(\[{]+|[”"’')\]},.!?;:]+$/g, '').trim();
}

/**
 * Smart lemmatization: generates potential base lemmas for morphological inflections
 * e.g., 'cracks' -> ['crack'], 'landscapes' -> ['landscape'], 'observed' -> ['observe', 'observ']
 */
function getLemmatizedCandidates(word: string): string[] {
  const w = word.toLowerCase().trim();
  const candidates = new Set<string>();

  // 1. Plural or 3rd person singular -s, -es, -ies
  if (w.endsWith('ies') && w.length > 4) {
    candidates.add(w.slice(0, -3) + 'y');
  }
  if (w.endsWith('es') && w.length > 3) {
    candidates.add(w.slice(0, -2));
    candidates.add(w.slice(0, -1)); // e.g. landscapes -> landscape
  }
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) {
    candidates.add(w.slice(0, -1));
  }

  // 2. Past tense & participles -ed, -ied
  if (w.endsWith('ied') && w.length > 4) {
    candidates.add(w.slice(0, -3) + 'y');
  }
  if (w.endsWith('ed') && w.length > 3) {
    candidates.add(w.slice(0, -2));
    candidates.add(w.slice(0, -1)); // e.g. observed -> observe
    // double consonant: e.g. planned -> plan
    if (w.length > 4 && w[w.length - 3] === w[w.length - 4]) {
      candidates.add(w.slice(0, -3));
    }
  }

  // 3. Continuous / Gerund -ing
  if (w.endsWith('ing') && w.length > 4) {
    candidates.add(w.slice(0, -3));
    candidates.add(w.slice(0, -3) + 'e'); // e.g. becoming -> become
    // double consonant: e.g. tapping -> tap
    if (w.length > 5 && w[w.length - 4] === w[w.length - 5]) {
      candidates.add(w.slice(0, -4));
    }
  }

  // 4. Adverbs -ly, -ally
  if (w.endsWith('ally') && w.length > 5) {
    candidates.add(w.slice(0, -4) + 'ic');
  }
  if (w.endsWith('ly') && w.length > 4) {
    candidates.add(w.slice(0, -2));
  }

  // 5. Comparatives -er, -est
  if (w.endsWith('est') && w.length > 4) {
    candidates.add(w.slice(0, -3));
    candidates.add(w.slice(0, -3) + 'e');
  }
  if (w.endsWith('er') && w.length > 4) {
    candidates.add(w.slice(0, -2));
    candidates.add(w.slice(0, -2) + 'e');
  }

  return Array.from(candidates);
}

/**
 * Intelligent morphological analyzer for arbitrary words not explicitly in the static list.
 * Always returns standard, clear grammatical POS tags ('n. 名词', 'v. 动词', 'adj. 形容词', 'adv. 副词', etc.)
 */
function inferWordMorphology(word: string, isAcademicContext: boolean): {
  pos: string;
  cn: string;
  en: string;
  uk?: string;
  us?: string;
} {
  const w = word.toLowerCase().trim();

  // 1. Check comprehensive IELTS Corpus Dictionary (exact, lemma, compound, prefix)
  const corpusHit = lookupInIeltsCorpus(w);
  if (corpusHit) {
    return {
      pos: corpusHit.pos,
      cn: corpusHit.cn,
      en: corpusHit.en,
      uk: corpusHit.uk,
      us: corpusHit.us
    };
  }

  // 2. Check lemmatized candidates against COMMON_WORD_CN_DICT and BUILTIN_VOCAB_DICT
  const cands = getLemmatizedCandidates(w);
  for (const cand of cands) {
    if (COMMON_WORD_CN_DICT[cand]) {
      const info = COMMON_WORD_CN_DICT[cand];
      return {
        pos: info.pos,
        cn: info.cn,
        en: info.en,
        uk: info.uk,
        us: info.us
      };
    }
    if (BUILTIN_VOCAB_DICT[cand]?.definitionCn) {
      const dict = BUILTIN_VOCAB_DICT[cand]!;
      return {
        pos: dict.partOfSpeech || 'n. 名词',
        cn: dict.definitionCn!,
        en: dict.definition || `Related to "${cand}".`,
        uk: dict.phoneticUk,
        us: dict.phoneticUs
      };
    }
    const candCorpus = lookupInIeltsCorpus(cand);
    if (candCorpus) {
      return {
        pos: candCorpus.pos,
        cn: candCorpus.cn,
        en: candCorpus.en,
        uk: candCorpus.uk,
        us: candCorpus.us
      };
    }
  }

  // 3. Hyphenated compound fallback combining COMMON_WORD_CN_DICT + BUILTIN_VOCAB_DICT + IELTS_CORPUS
  if (w.includes('-')) {
    const parts = w.split('-').filter(Boolean);
    const partMeanings = parts.map(p => {
      const direct = COMMON_WORD_CN_DICT[p]?.cn || BUILTIN_VOCAB_DICT[p]?.definitionCn || lookupInIeltsCorpus(p)?.cn;
      if (direct) return direct.split(/[；，、（(]/)[0].trim();
      for (const l of getLemmatizedCandidates(p)) {
        const lHit = COMMON_WORD_CN_DICT[l]?.cn || BUILTIN_VOCAB_DICT[l]?.definitionCn || lookupInIeltsCorpus(l)?.cn;
        if (lHit) return lHit.split(/[；，、（(]/)[0].trim();
      }
      return '';
    });
    if (partMeanings.some(Boolean)) {
      const ph = estimateIpaPhonetics(w);
      return {
        pos: 'adj. / n. 复合词',
        cn: partMeanings.filter(Boolean).join('·'),
        en: `Compound expression formed from ${parts.map(p => `"${p}"`).join(' + ')}.`,
        uk: ph.uk,
        us: ph.us
      };
    }
  }

  // 4. Numeric / time / currency expressions
  if (/^\d+([:.,-]\d+)*(%|am|pm|st|nd|rd|th|km|m|kg|g|bc|ad)?$/i.test(w)) {
    return {
      pos: 'num. 数词 / 数值',
      cn: `数值 / 编号：${word}`,
      en: `Numerical value, measurement, or identifier (${word}) in context.`,
      uk: `/${w}/`,
      us: `/${w}/`
    };
  }

  // 5. Proper noun or specialized academic term fallback
  const ph = estimateIpaPhonetics(w);
  const isCapitalized = /^[A-Z]/.test(word.trim());
  if (isCapitalized) {
    return {
      pos: 'n. 专有名词',
      cn: `${word}（专有名词 / 术语）`,
      en: `Proper noun, name, or specialized designation in this passage.`,
      uk: ph.uk,
      us: ph.us
    };
  }

  return {
    pos: formatPartOfSpeech(undefined, w),
    cn: isAcademicContext ? `${word}（学术专业术语）` : `${word}（语境词汇）`,
    en: `Specialized term "${word}" used in the current context.`,
    uk: ph.uk,
    us: ph.us
  };
}

/**
 * Known common lyric idioms and phrases
 */
const KNOWN_PHRASE_TRANSLATIONS: Record<string, { cn: string; pos: string }> = {
  // Common Lyric & User Selections
  'the ancient stone': { cn: '古老的石阶 / 远古石碑', pos: '短语 · 名词词组' },
  'ancient stone': { cn: '古老的石阶 / 远古石碑', pos: '短语 · 名词词组' },
  'across the ancient stone': { cn: '穿行过古老的石阶', pos: '短语 · 介词短语' },
  'meticulous steps': { cn: '审慎漫步 / 细致步履', pos: '短语 · 名词词组' },
  'meticulous steps across the ancient stone': { cn: '谨小慎微地漫步过古老的石阶', pos: '歌词精选金句' },
  'ubiquitous echoes': { cn: '无处不在的回响', pos: '短语 · 名词词组' },
  'city unknown': { cn: '未知的城市 / 陌生都市', pos: '短语 · 名词词组' },
  'touch of serendipity': { cn: '一丝不期而遇的机缘 / 意外之喜', pos: '短语 · 名词词组' },
  'a touch of serendipity': { cn: '一丝不期而遇的机缘', pos: '短语 · 名词词组' },
  'golden embers': { cn: '金色的余晖 / 金色微光', pos: '短语 · 名词词组' },
  'close the day': { cn: '为这一天拉下帷幕 / 告别这一天', pos: '短语 · 动词词组' },
  'gently close the day': { cn: '温柔地为这一天拉下帷幕', pos: '短语 · 动词词组' },
  'velvet sky': { cn: '天鹅绒般的夜空 / 丝绒苍穹', pos: '短语 · 名词词组' },
  'in the velvet sky': { cn: '在天鹅绒般的天空中', pos: '短语 · 介词短语' },
  'fleeting dreams': { cn: '浮光掠影的梦想 / 飘忽之梦', pos: '短语 · 名词词组' },
  'drift on by': { cn: '缓缓飘过 / 从容流淌', pos: '短语 · 动词词组' },
  'luminous spark': { cn: '明亮的光华 / 璀璨火花', pos: '短语 · 名词词组' },
  'a luminous spark': { cn: '一缕明亮的光华 / 璀璨火花', pos: '短语 · 名词词组' },
  'morning tide': { cn: '清晨的浪潮 / 晨潮', pos: '短语 · 名词词组' },
  'across the morning tide': { cn: '在晨潮之上跃动', pos: '短语 · 介词短语' },
  'diverse spirits': { cn: '多元的灵魂 / 千姿百态的生灵', pos: '短语 · 名词词组' },
  'peacefully coexist': { cn: '和平共存 / 和睦相处', pos: '短语 · 动词词组' },
  'catalyst for transformation': { cn: '蜕变与升华的催化剂', pos: '短语 · 核心搭配' },
  'deep within the soul': { cn: '在心灵深处', pos: '短语 · 介词短语' },
  'broken whole': { cn: '抚平残缺 / 重归完整', pos: '短语 · 意象表达' },
  'make the broken whole': { cn: '抚平所有的残缺 / 使破碎重归完整', pos: '短语 · 动词词组' },
  'gentle breezes': { cn: '和煦的微风', pos: '短语 · 名词词组' },
  'acoustic melody': { cn: '悠扬的原声旋律', pos: '短语 · 名词词组' },
  'shared reality': { cn: '共同真切经历 / 共同面对的现实', pos: '短语 · 名词词组' },
  'our shared reality': { cn: '我们共同经历的真切瞬间', pos: '短语 · 名词词组' },
  'you gotta give up': { cn: '你必须放弃 / 你得放手', pos: '短语 · 口语表达' },
  'never gonna give you up': { cn: '绝不会放弃你 / 绝不对你放手', pos: '经典歌词 · 核心句' },
  'never gonna let you down': { cn: '绝不会让你失望', pos: '经典歌词 · 核心句' },
  'never gonna run around and desert you': { cn: '绝不会东奔西跑抛下你', pos: '经典歌词 · 核心句' },
  'never gonna make you cry': { cn: '绝不会让你哭泣', pos: '经典歌词 · 核心句' },
  'never gonna say goodbye': { cn: '绝不会对你说再见', pos: '经典歌词 · 核心句' },
  'never gonna tell a lie and hurt you': { cn: '绝不会说谎伤害你', pos: '经典歌词 · 核心句' },
  'give you up': { cn: '放弃你 / 对你放手', pos: '短语 · 动词词组' },
  'let you down': { cn: '让你失望 / 辜负你', pos: '短语 · 动词词组' },
  'gotta give up': { cn: '必须放弃 / 得放手', pos: '短语 · 动词词组' },
  'gotta give': { cn: '必须给予 / 得付出', pos: '短语 · 动词词组' },
  'you gotta': { cn: '你必须 / 你得', pos: '短语 · 口语表达' },
  'i gotta': { cn: '我得 / 我必须', pos: '短语 · 口语表达' },
  'give up': { cn: '放弃，放手，认输', pos: 'v. 动词短语' },
  'let down': { cn: '使……失望，辜负', pos: 'v. 动词短语' },
  'run around': { cn: '东奔西跑，到处乱跑', pos: 'v. 动词短语' },
  'tell a lie': { cn: '说谎，撒谎', pos: '短语 · 动词词组' },
  'say goodbye': { cn: '道别，说再见', pos: '短语 · 表达' },
  'hurt you': { cn: '伤害你', pos: '短语 · 动词词组' },
  'make you cry': { cn: '让你哭泣 / 惹你伤心', pos: '短语 · 动词词组' },
  'in the morning': { cn: '在清晨 / 在早晨', pos: '短语 · 介词短语' },
  'for example': { cn: '例如，比如', pos: '短语' },
  'for instance': { cn: '例如，举例来说', pos: '短语' },
  'by heart': { cn: '熟记 / 牢记于心', pos: '短语' },
  'all night long': { cn: '整夜 / 通宵达旦', pos: '短语' }
};

/**
 * Derives a poetic, natural Chinese translation for any multi-word phrase
 */
function derivePhraseChinese(phrase: string, fullSentence: string): { cn: string; pos: string } {
  const pLower = phrase.toLowerCase().replace(/^[“"‘'(\[{]+|[”"’')\]},.!?;:]+$/g, '').trim();
  
  // 1. Direct lyric line translation if entire line is selected
  const lineTrans = getLyricLineTranslation(pLower);
  if (lineTrans) {
    return { cn: lineTrans, pos: '歌词精选金句' };
  }

  // 2. Known phrases map
  if (KNOWN_PHRASE_TRANSLATIONS[pLower]) {
    return KNOWN_PHRASE_TRANSLATIONS[pLower];
  }

  // 3. Built-in special phrases in dictionary
  if (BUILTIN_VOCAB_DICT[pLower]?.definitionCn) {
    return {
      cn: BUILTIN_VOCAB_DICT[pLower]!.definitionCn!,
      pos: BUILTIN_VOCAB_DICT[pLower]!.partOfSpeech || '短语 · 重点词组'
    };
  }
  if (COMMON_WORD_CN_DICT[pLower]?.cn) {
    return {
      cn: COMMON_WORD_CN_DICT[pLower].cn,
      pos: COMMON_WORD_CN_DICT[pLower].pos || '短语 · 词组'
    };
  }

  // 4. Grammar Pattern & Semantic Composition
  const words = pLower.split(/\s+/).map(cleanWordText).filter(Boolean);
  if (words.length === 0) {
    return { cn: phrase, pos: '短语' };
  }

  // Pattern A: Article + Adjective + Noun (e.g. "the ancient stone", "a luminous spark", "the quiet room")
  if (words.length === 3 && (words[0] === 'the' || words[0] === 'a' || words[0] === 'an')) {
    const adj = words[1];
    const noun = words[2];
    const adjCn = (COMMON_WORD_CN_DICT[adj]?.cn || BUILTIN_VOCAB_DICT[adj]?.definitionCn || '').split(/[/；，（]/)[0].trim();
    const nounCn = (COMMON_WORD_CN_DICT[noun]?.cn || BUILTIN_VOCAB_DICT[noun]?.definitionCn || '').split(/[/；，（]/)[0].trim();
    if (adjCn && nounCn) {
      const formattedAdj = adjCn.endsWith('的') ? adjCn : `${adjCn}的`;
      return {
        cn: `${formattedAdj}${nounCn}`,
        pos: '短语 · 名词词组'
      };
    }
  }

  // Pattern B: Adjective + Noun (e.g. "ancient stone", "luminous spark", "fleeting dreams")
  if (words.length === 2) {
    const w1 = words[0];
    const w2 = words[1];
    const cn1 = (COMMON_WORD_CN_DICT[w1]?.cn || BUILTIN_VOCAB_DICT[w1]?.definitionCn || '').split(/[/；，（]/)[0].trim();
    const cn2 = (COMMON_WORD_CN_DICT[w2]?.cn || BUILTIN_VOCAB_DICT[w2]?.definitionCn || '').split(/[/；，（]/)[0].trim();
    if (cn1 && cn2) {
      return {
        cn: `${cn1}的${cn2}`,
        pos: '短语 · 名词词组'
      };
    }
  }

  // Pattern C: Noun + of + Noun (e.g. "whisper of serenity", "pulse of tranquility")
  if (words.length === 3 && words[1] === 'of') {
    const n1 = words[0];
    const n2 = words[2];
    const cn1 = (COMMON_WORD_CN_DICT[n1]?.cn || BUILTIN_VOCAB_DICT[n1]?.definitionCn || '').split(/[/；，（]/)[0].trim();
    const cn2 = (COMMON_WORD_CN_DICT[n2]?.cn || BUILTIN_VOCAB_DICT[n2]?.definitionCn || '').split(/[/；，（]/)[0].trim();
    if (cn1 && cn2) {
      return {
        cn: `${cn2}的${cn1}`,
        pos: '短语 · 表达'
      };
    }
  }

  // Pattern D: Pronoun + gotta/gonna/must + Verb phrase (e.g. "you gotta give up")
  if (words[0] === 'you' || words[0] === 'i' || words[0] === 'we') {
    const pronounCn = words[0] === 'you' ? '你' : words[0] === 'i' ? '我' : '我们';
    const rest = words.slice(1).join(' ');
    if (KNOWN_PHRASE_TRANSLATIONS[rest]) {
      return {
        cn: `${pronounCn}${KNOWN_PHRASE_TRANSLATIONS[rest].cn}`,
        pos: '短语 · 表达'
      };
    }
  }

  // 5. Greedy chunking with clean Chinese words (no raw English concatenated)
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    let matched = false;
    for (let len = Math.min(3, words.length - i); len >= 1; len--) {
      const sub = words.slice(i, i + len).join(' ');
      if (KNOWN_PHRASE_TRANSLATIONS[sub]) {
        chunks.push(KNOWN_PHRASE_TRANSLATIONS[sub].cn.split(/[/；，]/)[0].trim());
        i += len;
        matched = true;
        break;
      } else if (BUILTIN_VOCAB_DICT[sub]?.definitionCn) {
        chunks.push(BUILTIN_VOCAB_DICT[sub]!.definitionCn!.split(/[/；，]/)[0].trim());
        i += len;
        matched = true;
        break;
      } else if (COMMON_WORD_CN_DICT[sub]?.cn) {
        chunks.push(COMMON_WORD_CN_DICT[sub].cn.split(/[/；，（]/)[0].trim());
        i += len;
        matched = true;
        break;
      } else {
        const corpusSub = lookupInIeltsCorpus(sub);
        if (corpusSub?.cn) {
          chunks.push(corpusSub.cn.split(/[/；，（(]/)[0].trim());
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const w = words[i];
      if (w !== 'the' && w !== 'a' && w !== 'an') {
        const morph = inferWordMorphology(w, false);
        chunks.push(morph.cn.split(/[/；，（(]/)[0].trim() || w);
      }
      i++;
    }
  }

  if (chunks.length > 0) {
    return {
      cn: chunks.join(' · '),
      pos: '短语 · 组合表达'
    };
  }

  return {
    cn: phrase,
    pos: '短语'
  };
}

/**
 * Builds a rich WordItem for single word or multi-word phrase,
 * populating subWords if it is a phrase to enable sub-word drilldown.
 */
export async function lookupLyricTerm(
  rawText: string,
  fullSentence: string = ''
): Promise<WordItem> {
  const cleaned = cleanWordText(rawText);
  const lower = cleaned.toLowerCase();
  const isAcademic = fullSentence.toLowerCase().includes('passage') ||
    fullSentence.toLowerCase().includes('cambridge') ||
    fullSentence.toLowerCase().includes('ielts') ||
    fullSentence.toLowerCase().includes('urban flora') ||
    fullSentence.toLowerCase().includes('ecosystem') ||
    fullSentence.toLowerCase().includes('studies') ||
    fullSentence.toLowerCase().includes('adaptation');

  // 1. Check if already exists in Dexie DB
  let existingRecord: WordItem | undefined;
  try {
    existingRecord = await db.words.where('word').equalsIgnoreCase(lower).first();
    if (existingRecord) {
      const defCnTrim = (existingRecord.definitionCn || '').trim();
      const defEn = existingRecord.definition || '';
      // Self-heal corrupted or outdated placeholder cache in Dexie DB
      const needsHealing =
        !defCnTrim ||
        defCnTrim.toLowerCase() === lower ||
        defCnTrim.toLowerCase() === existingRecord.word.toLowerCase() ||
        defCnTrim === `“${existingRecord.word}”` ||
        defCnTrim.includes('ancientstone') ||
        defCnTrim.includes('undefined') ||
        defCnTrim.startsWith('语境精选短语') ||
        defCnTrim.startsWith('学术精选词汇') ||
        defEn.includes('To perform, cause, or undergo') ||
        defEn.includes('The action, process, quality, or state') ||
        defEn.includes('Characterized by or suitable for') ||
        defEn.includes('In a manner characteristic of') ||
        defEn.startsWith('Vocabulary item:') ||
        defEn.startsWith('Key vocabulary item:') ||
        existingRecord.phoneticUk === `/${lower}/`;

      if (!needsHealing) {
        if (existingRecord.word.includes(' ') && !existingRecord.subWords) {
          existingRecord.subWords = await buildSubWords(existingRecord.word, fullSentence);
        }
        return existingRecord;
      }
    }
  } catch {
    // continue
  }

  const persistHealedIfExisting = async (resolved: WordItem): Promise<WordItem> => {
    if (existingRecord && existingRecord.id !== undefined) {
      const merged: WordItem = {
        ...resolved,
        id: existingRecord.id,
        isStarred: existingRecord.isStarred ?? resolved.isStarred,
        addedTimestamp: existingRecord.addedTimestamp || resolved.addedTimestamp
      };
      try {
        await db.words.put(merged);
      } catch {
        // ignore db write error
      }
      return merged;
    }
    return resolved;
  };

  const estPhonetics = estimateIpaPhonetics(lower);

  // 2. Check in seed words (exact + lemmatized)
  const seedMatch = SEED_WORDS.find(w => w.word.toLowerCase() === lower);
  if (seedMatch) {
    return persistHealedIfExisting({
      ...seedMatch,
      isStarred: seedMatch.isStarred ?? false,
      addedTimestamp: Date.now()
    });
  }
  const lemmas = getLemmatizedCandidates(lower);
  for (const lemma of lemmas) {
    const seedLemmaMatch = SEED_WORDS.find(w => w.word.toLowerCase() === lemma);
    if (seedLemmaMatch) {
      return persistHealedIfExisting({
        ...seedLemmaMatch,
        word: cleaned,
        phoneticUk: seedLemmaMatch.phoneticUk || estPhonetics.uk,
        phoneticUs: seedLemmaMatch.phoneticUs || estPhonetics.us,
        isStarred: false,
        addedTimestamp: Date.now()
      });
    }
  }

  // 3. Check in built-in dictionary (exact + lemmatized)
  if (BUILTIN_VOCAB_DICT[lower]) {
    const dict = BUILTIN_VOCAB_DICT[lower];
    const isPhrase = lower.includes(' ');
    const subWords = isPhrase ? await buildSubWords(lower, fullSentence) : undefined;
    return persistHealedIfExisting({
      word: cleaned,
      phoneticUk: dict.phoneticUk || estPhonetics.uk,
      phoneticUs: dict.phoneticUs || estPhonetics.us,
      partOfSpeech: formatPartOfSpeech(dict.partOfSpeech, cleaned),
      definition: dict.definition || `Vocabulary item: ${cleaned}`,
      definitionCn: dict.definitionCn || (isAcademic ? '学术精选词汇' : '语境精选词汇'),
      examples: dict.examples || [
        {
          en: fullSentence || `Encountered in context: "${cleaned}"`,
          cn: fullSentence ? `原句：“${fullSentence}”` : `收录于当前语境。`,
          source: isAcademic ? 'IELTS Academic' : 'Song Lyric Context'
        }
      ],
      sourceContext: fullSentence ? (isAcademic ? `IELTS Passage: ${fullSentence}` : `Song Lyric: ${fullSentence}`) : (isAcademic ? 'IELTS Academic' : 'Lyric Context'),
      dateKey: new Date().toISOString().split('T')[0],
      isStarred: false,
      addedTimestamp: Date.now(),
      categories: [isAcademic ? 'IELTS Academic' : (isPhrase ? 'Lyric Idiom' : 'Lyric Vocab')],
      isPhrase,
      subWords
    });
  }

  // 4. Check in common word dictionary (exact)
  if (COMMON_WORD_CN_DICT[lower]) {
    const info = COMMON_WORD_CN_DICT[lower];
    return persistHealedIfExisting({
      word: cleaned,
      phoneticUk: info.uk || estPhonetics.uk,
      phoneticUs: info.us || estPhonetics.us,
      partOfSpeech: formatPartOfSpeech(info.pos, cleaned),
      definition: info.en,
      definitionCn: info.cn,
      examples: [
        {
          en: fullSentence || `Encountered in context: "${cleaned}"`,
          cn: fullSentence ? `原句：“${fullSentence}”` : `语境精选`,
          source: isAcademic ? 'IELTS Academic' : 'Song Context'
        }
      ],
      sourceContext: fullSentence ? (isAcademic ? `IELTS Passage: ${fullSentence}` : `Song Lyric: ${fullSentence}`) : (isAcademic ? 'IELTS Academic' : 'Lyric Context'),
      dateKey: new Date().toISOString().split('T')[0],
      isStarred: false,
      addedTimestamp: Date.now(),
      categories: [isAcademic ? 'IELTS Academic' : 'Lyric Vocab'],
      isPhrase: false
    });
  }

  // 5. Check in comprehensive IELTS Corpus Dictionary (exact, lemmatized, compound, prefix)
  const corpusMatch = lookupInIeltsCorpus(lower);
  if (corpusMatch) {
    return persistHealedIfExisting({
      word: cleaned,
      phoneticUk: corpusMatch.uk || estPhonetics.uk,
      phoneticUs: corpusMatch.us || estPhonetics.us,
      partOfSpeech: formatPartOfSpeech(corpusMatch.pos, cleaned),
      definition: corpusMatch.en,
      definitionCn: corpusMatch.cn,
      examples: [
        {
          en: fullSentence || `Encountered in IELTS context: "${cleaned}"`,
          cn: fullSentence ? `原句：“${fullSentence}”` : `剑桥雅思高频核心词：${corpusMatch.cn}`,
          source: isAcademic ? 'Cambridge IELTS Corpus' : 'Contextual Usage'
        }
      ],
      sourceContext: fullSentence ? (isAcademic ? `IELTS Context: ${fullSentence}` : `Context: ${fullSentence}`) : 'Cambridge IELTS Corpus',
      dateKey: new Date().toISOString().split('T')[0],
      isStarred: false,
      addedTimestamp: Date.now(),
      categories: ['IELTS Academic'],
      isPhrase: false
    });
  }

  // 6. Check lemmatized matches in BUILTIN_VOCAB_DICT & COMMON_WORD_CN_DICT
  for (const lemma of lemmas) {
    if (BUILTIN_VOCAB_DICT[lemma]) {
      const dict = BUILTIN_VOCAB_DICT[lemma];
      return persistHealedIfExisting({
        word: cleaned,
        phoneticUk: dict.phoneticUk || estPhonetics.uk,
        phoneticUs: dict.phoneticUs || estPhonetics.us,
        partOfSpeech: formatPartOfSpeech(dict.partOfSpeech, cleaned),
        definition: dict.definition || `Inflected form of ${lemma}: ${cleaned}`,
        definitionCn: dict.definitionCn || `${lemma} 的词形变化`,
        examples: dict.examples || [
          {
            en: fullSentence || `Usage of "${cleaned}" in context.`,
            cn: fullSentence ? `原句：“${fullSentence}”` : `语境例句`,
            source: isAcademic ? 'IELTS Academic' : 'Song Context'
          }
        ],
        sourceContext: fullSentence ? (isAcademic ? `IELTS Passage: ${fullSentence}` : `Song Lyric: ${fullSentence}`) : (isAcademic ? 'IELTS Academic' : 'Lyric Context'),
        dateKey: new Date().toISOString().split('T')[0],
        isStarred: false,
        addedTimestamp: Date.now(),
        categories: [isAcademic ? 'IELTS Academic' : 'Lyric Vocab'],
        isPhrase: false
      });
    }
    if (COMMON_WORD_CN_DICT[lemma]) {
      const info = COMMON_WORD_CN_DICT[lemma];
      return persistHealedIfExisting({
        word: cleaned,
        phoneticUk: info.uk || estPhonetics.uk,
        phoneticUs: info.us || estPhonetics.us,
        partOfSpeech: formatPartOfSpeech(info.pos, cleaned),
        definition: info.en,
        definitionCn: `${info.cn}（${lemma} 的变形）`,
        examples: [
          {
            en: fullSentence || `Encountered in context: "${cleaned}"`,
            cn: fullSentence ? `原句：“${fullSentence}”` : `语境例句`,
            source: isAcademic ? 'IELTS Academic' : 'Song Context'
          }
        ],
        sourceContext: fullSentence ? (isAcademic ? `IELTS Passage: ${fullSentence}` : `Song Lyric: ${fullSentence}`) : (isAcademic ? 'IELTS Academic' : 'Lyric Context'),
        dateKey: new Date().toISOString().split('T')[0],
        isStarred: false,
        addedTimestamp: Date.now(),
        categories: [isAcademic ? 'IELTS Academic' : 'Lyric Vocab'],
        isPhrase: false
      });
    }
  }

  // 7. Fallback generation for generic word or arbitrary selected phrase
  const isPhrase = lower.includes(' ');
  const subWords = isPhrase ? await buildSubWords(lower, fullSentence) : undefined;
  
  let partOfSpeech = isPhrase ? 'phrase 短语' : 'n. 名词';
  let definition = isPhrase ? `Contextual expression: "${cleaned}"` : `Key vocabulary item: "${cleaned}"`;
  let definitionCn = isPhrase ? `短语：“${cleaned}”` : `“${cleaned}”`;
  let ukPhonetic = estPhonetics.uk;
  let usPhonetic = estPhonetics.us;

  if (isPhrase) {
    const derived = derivePhraseChinese(cleaned, fullSentence);
    partOfSpeech = formatPartOfSpeech(derived.pos, cleaned);
    definitionCn = derived.cn;
  } else {
    const morph = inferWordMorphology(cleaned, isAcademic);
    partOfSpeech = formatPartOfSpeech(morph.pos, cleaned);
    definition = morph.en;
    definitionCn = morph.cn;
    if (morph.uk) ukPhonetic = morph.uk;
    if (morph.us) usPhonetic = morph.us;
  }

  return persistHealedIfExisting({
    word: cleaned,
    phoneticUk: ukPhonetic,
    phoneticUs: usPhonetic,
    partOfSpeech: formatPartOfSpeech(partOfSpeech, cleaned),
    definition,
    definitionCn,
    examples: [
      {
        en: fullSentence || `"${cleaned}" as used in the text.`,
        cn: fullSentence ? `收录于原句：“${fullSentence}”` : (isAcademic ? `收录于雅思学术语境。` : `收录于当前音乐语境。`),
        source: isAcademic ? 'IELTS Academic' : 'Lyric Context'
      }
    ],
    sourceContext: fullSentence ? (isAcademic ? `IELTS Passage: ${fullSentence}` : `Song Lyric: ${fullSentence}`) : (isAcademic ? 'IELTS Academic' : 'Lyric Context'),
    dateKey: new Date().toISOString().split('T')[0],
    isStarred: false,
    addedTimestamp: Date.now(),
    categories: [isAcademic ? 'IELTS Academic' : (isPhrase ? 'Phrase' : 'Word')],
    isPhrase,
    subWords
  });
}

/**
 * Splits a phrase into individual sub-words with their own dictionary lookup
 */
async function buildSubWords(phrase: string, fullSentence: string): Promise<SubWordItem[]> {
  const parts = phrase.split(/\s+/).map(cleanWordText).filter(p => p.length > 0);
  const results: SubWordItem[] = [];

  for (const part of parts) {
    const pLower = part.toLowerCase();
    const estPh = estimateIpaPhonetics(pLower);
    if (BUILTIN_VOCAB_DICT[pLower]) {
      const dict = BUILTIN_VOCAB_DICT[pLower];
      results.push({
        word: part,
        phoneticUk: dict.phoneticUk || estPh.uk,
        phoneticUs: dict.phoneticUs || estPh.us,
        partOfSpeech: dict.partOfSpeech || 'n. / v.',
        definition: dict.definition || `Word in phrase "${phrase}"`,
        definitionCn: dict.definitionCn || '单单词释义',
        examples: dict.examples || [
          {
            en: fullSentence || `Part of phrase: "${phrase}"`,
            cn: `短语“${phrase}”中的核心子词。`,
            source: 'Phrase Context'
          }
        ],
        sourceContext: `Phrase: ${phrase}`,
        dateKey: new Date().toISOString().split('T')[0],
        isStarred: false,
        addedTimestamp: Date.now(),
        parentPhrase: phrase
      });
    } else if (COMMON_WORD_CN_DICT[pLower]) {
      const info = COMMON_WORD_CN_DICT[pLower];
      results.push({
        word: part,
        phoneticUk: info.uk || estPh.uk,
        phoneticUs: info.us || estPh.us,
        partOfSpeech: info.pos,
        definition: info.en,
        definitionCn: info.cn,
        examples: [
          {
            en: fullSentence || `Component of phrase: "${phrase}"`,
            cn: `短语“${phrase}”组成词：${info.cn}。`,
            source: 'Phrase'
          }
        ],
        sourceContext: `Phrase: ${phrase}`,
        dateKey: new Date().toISOString().split('T')[0],
        isStarred: false,
        addedTimestamp: Date.now(),
        parentPhrase: phrase
      });
    } else {
      const morph = inferWordMorphology(part, false);
      results.push({
        word: part,
        phoneticUk: morph.uk || estPh.uk,
        phoneticUs: morph.us || estPh.us,
        partOfSpeech: morph.pos,
        definition: morph.en,
        definitionCn: morph.cn,
        examples: [
          {
            en: fullSentence || `Component of phrase: "${phrase}"`,
            cn: `短语“${phrase}”组成词：${morph.cn}。`,
            source: 'Phrase'
          }
        ],
        sourceContext: `Phrase: ${phrase}`,
        dateKey: new Date().toISOString().split('T')[0],
        isStarred: false,
        addedTimestamp: Date.now(),
        parentPhrase: phrase
      });
    }
  }

  return results;
}

/**
 * Built-in poetic Chinese translations for seed lyric lines
 */
const LYRIC_LINE_TRANSLATIONS: Record<string, string> = {
  // Jasmine Breeze
  'gentle morning light filters through the quiet room': '柔和的晨光穿透静谧的房间',
  'breathing soft notes like a blooming jasmine flower': '呼吸轻柔的音符，如初绽的茉莉花',
  'every whisper holds an ephemeral trace of grace': '每一句轻语都蕴含着转瞬即逝的优雅痕迹',
  'moments of stillness in this warm and silent space': '在这温暖而宁静的空间里沉淀片刻',
  'beneath the concrete, finding our inner resilience': '在混凝土之下，寻得我们内心的坚韧',
  'life persists in subtle quiet brilliance': '生命在微妙而静谧的辉芒中恒久延续',
  'a ubiquitous warmth surrounds our morning thoughts': '无处不在的温暖环绕着清晨的思绪',
  'learning beauty in the lessons time has brought': '在岁月带来的沉淀中领悟美丽',
  'the transient shadows softly start to fade': '转瞬即逝的阴影悄然开始褪去',
  'in this sanctuary that our minds have made': '在我们心灵筑造的静谧庇护所中',
  'listen to the pulse of tranquility and ease': '倾听宁静与舒缓的脉动',
  'drifting calmly with the golden jasmine breeze': '随金色的茉莉微风从容漂流',
  'let the words awaken wisdom in your heart': '让词句唤醒你内心的智慧',
  'a serene journey ready to take its start': '一段静谧的旅程正待开启',
  'whisper of serenity lingering in the air': '宁静的低语在空气中轻柔萦绕',
  'peaceful harmony beyond compare': '无与伦比的祥和与安宁',

  // Urban Solitude
  'raindrops tapping softly on the foggy window pane': '雨滴轻敲在雾气氤氲的窗玻璃上',
  'a quiet melody echoing down the avenue again': '静谧的旋律再次在大道上回响',
  'meticulous memories sketched in shades of blue': '细致入微的回忆描摹在蓝色光影中',
  'finding serenity in everything we knew': '在我们熟悉的一切中寻觅安宁',
  'every chance encounter is a quiet catalyst': '每一次偶遇都是一份静默的催化剂',
  'dissolving sorrow like a gentle twilight mist': '如温柔的薄暮迷雾般消解悲伤',
  'pure serendipity walking down the street': '漫步街头，与纯粹的意外之喜相逢',
  'where midnight shadows and distant echoes meet': '在子夜暗影与遥远回声交汇之处',
  'in the heart of the city\'s gentle humming sound': '在城市温柔低吟的中心深处',
  'a peaceful oasis is waiting to be found': '一片宁静的绿洲正静待被发现',
  'embrace the rhythm of this solitary flight': '拥抱这段独行旅程的节奏',
  'guiding our steps through the cool obsidian night': '指引脚步穿过清冷的黑曜石长夜',
  'soft piano chords drifting toward the sky': '轻柔的钢琴和弦飘向苍穹',
  'as quiet moments slowly wander by': '伴随静谧的时光缓缓流淌',

  // Urban Twilight Glow
  'meticulous steps across the ancient stone': '谨小慎微地漫步过古老的石阶',
  'ubiquitous echoes in a city unknown': '在未知的都市里回荡着无处不在的回响',
  'a touch of serendipity in the evening light': '暮色中一抹不期而遇的惊喜',
  'golden embers gently close the day': '金色的余晖温柔地为这一天拉下帷幕',
  'whispers of dreams in the velvet sky': '天鹅绒般夜空中轻语的梦想',
  'fleeting memories drift on by': '转瞬即逝的回忆缓缓飘过',

  // Echoes of Dawn
  'a luminous spark across the morning tide': '晨潮之上一缕跃动的璀璨光芒',
  'where diverse spirits peacefully coexist': '多元的生灵在此安详共存',
  'a quiet catalyst for transformation deep within': '内心深处悄然蜕变的催化剂',
  'music to make the broken whole': '让音乐抚平残缺，重归完整',
  'gentle breezes carry the acoustic melody': '轻柔的微风传递着悠扬原声音符',
  'embracing harmony in our shared reality': '在我们共同的真切瞬间中拥抱和谐'
};

/**
 * Returns Chinese translation for a lyric sentence
 */
export function getLyricLineTranslation(rawText: string): string {
  const normalized = rawText.toLowerCase().replace(/[.,!?'"“”]/g, '').trim();
  if (LYRIC_LINE_TRANSLATIONS[normalized]) {
    return LYRIC_LINE_TRANSLATIONS[normalized];
  }
  // Try fuzzy prefix match
  for (const [key, val] of Object.entries(LYRIC_LINE_TRANSLATIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return val;
    }
  }
  return '';
}

/**
 * Alias for lookupLyricTerm for universal lexical lookup
 */
export const lookupWord = lookupLyricTerm;
