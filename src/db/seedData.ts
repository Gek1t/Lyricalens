import { WordItem, SongItem, IELTSTestRecord } from '../types';

export const SEED_WORDS: Omit<WordItem, 'id'>[] = [
  {
    word: 'ephemeral',
    phoneticUk: "/ɪˈfem.ər.əl/",
    phoneticUs: "/ɪˈfem.ər.əl/",
    partOfSpeech: 'ADJ.',
    definition: 'Lasting for a very short time; fleeting.',
    definitionCn: '短暂的，转瞬即逝的',
    examples: [
      {
        en: 'The beauty of the sunset was ephemeral, lasting only a few moments.',
        cn: '落日的余晖转瞬即逝，仅停留片刻。',
        source: 'Song: Jasmine Breeze',
      },
      {
        en: 'The joy of a holiday is often ephemeral, fading as soon as work resumes.',
        cn: '假期的快乐往往是短暂的，一旦恢复工作便会消逝。',
        source: 'Daily Context',
      },
      {
        en: 'Artists often try to capture the ephemeral light of dawn in their paintings.',
        cn: '艺术家们常试图在画作中捕捉黎明那转瞬即逝的光影。',
        source: 'Passage 2',
      }
    ],
    sourceContext: 'Song: Jasmine Breeze',
    dateKey: new Date().toISOString().split('T')[0],
    isStarred: true,
    masteryLevel: 1,
    addedTimestamp: Date.now() - 1000 * 60 * 60 * 2,
    categories: ['IELTS Academic', 'Nature & Poetry'],
    aiTags: ['High Frequency', 'Band 7.5+'],
  },
  {
    word: 'resilience',
    phoneticUk: "/rɪˈzɪl.jəns/",
    phoneticUs: "/rɪˈzɪl.jəns/",
    partOfSpeech: 'NOUN',
    definition: 'The capacity to recover quickly from difficulties; toughness.',
    definitionCn: '恢复力，坚韧性，适应力',
    examples: [
      {
        en: 'Urban flora displays remarkable resilience against harsh pavement heat.',
        cn: '城市植物在恶劣的路面高温下展现了令人惊叹的韧性。',
        source: 'Passage 2: The Secret Life of Urban Flora',
      },
      {
        en: 'The economic resilience of the region helped it withstand global turbulence.',
        cn: '该地区的经济韧性帮助其抵御了全球动荡。',
        source: 'IELTS Academic Reading',
      }
    ],
    sourceContext: 'Passage 2',
    dateKey: new Date().toISOString().split('T')[0],
    isStarred: true,
    masteryLevel: 2,
    addedTimestamp: Date.now() - 1000 * 60 * 60 * 5,
    categories: ['IELTS Academic', 'Science & Ecology'],
    aiTags: ['Band 8.0', 'Essential'],
  },
  {
    word: 'ubiquitous',
    phoneticUk: "/juːˈbɪk.wɪ.təs/",
    phoneticUs: "/juːˈbɪk.wə.t̬əs/",
    partOfSpeech: 'ADJ.',
    definition: 'Present, appearing, or found everywhere.',
    definitionCn: '无所不在的，普遍存在的',
    examples: [
      {
        en: 'The ubiquitous presence of non-native flora maps onto 19th-century trade routes.',
        cn: '外来植物的普遍存在几乎完全对应了19世纪的贸易路线。',
        source: 'Passage 2',
      },
      {
        en: 'Smartphones have become ubiquitous in modern daily life.',
        cn: '智能手机在现代日常生活中已经无处不在。',
        source: 'Technology Reading',
      }
    ],
    sourceContext: 'Passage 2',
    dateKey: new Date().toISOString().split('T')[0],
    isStarred: false,
    masteryLevel: 1,
    addedTimestamp: Date.now() - 1000 * 60 * 60 * 12,
    categories: ['IELTS Academic'],
    aiTags: ['Band 8.5', 'Academic Vocabulary'],
  },
  {
    word: 'meticulous',
    phoneticUk: "/məˈtɪk.jə.ləs/",
    phoneticUs: "/məˈtɪk.jə.ləs/",
    partOfSpeech: 'ADJ.',
    definition: 'Showing great attention to detail; very careful and precise.',
    definitionCn: '谨小慎微的，一丝不苟的',
    examples: [
      {
        en: 'City planners obsess over meticulously curated botanical gardens.',
        cn: '城市规划者们对精心照料的植物园精雕细琢。',
        source: 'Passage 2',
      },
      {
        en: 'She performed meticulous research before drafting the thesis.',
        cn: '她在撰写论文前进行了细致入微的研究。',
        source: 'Academic Writing',
      }
    ],
    sourceContext: 'Song: Urban Solitude',
    dateKey: new Date().toISOString().split('T')[0],
    isStarred: true,
    masteryLevel: 1,
    addedTimestamp: Date.now() - 1000 * 60 * 60 * 24,
    categories: ['IELTS Academic'],
    aiTags: ['Band 7.5+'],
  },
  {
    word: 'catalyst',
    phoneticUk: "/ˈkæt.əl.ɪst/",
    phoneticUs: "/ˈkæt̬.əl.ɪst/",
    partOfSpeech: 'NOUN',
    definition: 'A person or thing that precipitates an event or change.',
    definitionCn: '催化剂，促进因素',
    examples: [
      {
        en: 'The arrival of new transportation links acted as a catalyst for urban flora dispersal.',
        cn: '新交通网络的到来成为了城市植物扩散的催化剂。',
        source: 'IELTS Academic Passage',
      }
    ],
    sourceContext: 'Song: Urban Solitude',
    dateKey: new Date().toISOString().split('T')[0],
    isStarred: false,
    masteryLevel: 0,
    addedTimestamp: Date.now() - 1000 * 60 * 60 * 36,
    categories: ['Science', 'IELTS Academic'],
    aiTags: ['Band 8.0'],
  },
  {
    word: 'serendipity',
    phoneticUk: "/ˌser.ənˈdɪp.ə.ti/",
    phoneticUs: "/ˌser.ənˈdɪp.ə.t̬i/",
    partOfSpeech: 'NOUN',
    definition: 'The occurrence and development of events by chance in a happy or beneficial way.',
    definitionCn: '意外发现珍宝的运气，意外之喜',
    examples: [
      {
        en: 'Meeting an old friend in a foreign train station was pure serendipity.',
        cn: '在异国火车站偶遇老友纯属意外之喜。',
        source: 'Daily Context',
      }
    ],
    sourceContext: 'AR: Coffee Mug',
    dateKey: new Date().toISOString().split('T')[0],
    isStarred: true,
    masteryLevel: 2,
    addedTimestamp: Date.now() - 1000 * 60 * 60 * 48,
    categories: ['Culture & Lifestyle', 'Daily'],
    aiTags: ['Quiet Luxury', 'Expression'],
  },
  {
    word: 'transient',
    phoneticUk: "/ˈtræn.zi.ənt/",
    phoneticUs: "/ˈtræn.zənt/",
    partOfSpeech: 'ADJ.',
    definition: 'Lasting only for a short time; impermanent.',
    definitionCn: '短暂的，临时的，暂住的',
    examples: [
      {
        en: 'The transient morning mist dissolved as the sun ascended above the skyline.',
        cn: '随着太阳升上地平线，晨间的薄雾悄然散去。',
        source: 'Song: Jasmine Breeze',
      }
    ],
    sourceContext: 'Song: Jasmine Breeze',
    dateKey: new Date().toISOString().split('T')[0],
    isStarred: false,
    masteryLevel: 0,
    addedTimestamp: Date.now() - 1000 * 60 * 60 * 60,
    categories: ['IELTS Academic'],
    aiTags: ['Synonym of Ephemeral'],
  },
  {
    word: 'aesthetic',
    phoneticUk: "/esˈθet.ɪk/",
    phoneticUs: "/esˈθet̬.ɪk/",
    partOfSpeech: 'ADJ. / NOUN',
    definition: 'Concerned with beauty or the appreciation of beauty.',
    definitionCn: '审美的，美学的，具有审美价值的',
    examples: [
      {
        en: 'The gallery interior balances minimalist lines with a warm, serene aesthetic.',
        cn: '画廊内部将极简线条与温暖宁静的美学相平衡。',
        source: 'Zen Design Principles',
      }
    ],
    sourceContext: 'AR: Zen Plant',
    dateKey: new Date().toISOString().split('T')[0],
    isStarred: true,
    masteryLevel: 1,
    addedTimestamp: Date.now() - 1000 * 60 * 60 * 72,
    categories: ['Art & Design', 'Academic'],
    aiTags: ['Band 8.0'],
  }
];

export const SEED_SONGS: SongItem[] = [
  {
    id: 'song-serenity-bloom',
    title: 'Serenity & Solitude',
    artist: 'Aether Bloom',
    duration: 184,
    albumArtUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
    audioUrl: 'https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3',
    palette: ['#7C8F6E', '#C4AC82', '#A69880'],
    keyVocab: ['ephemeral', 'resilience', 'solitude'],
    lrcText: `[00:00.00]Serenity & Solitude - Aether Bloom
[00:04.00]In the quiet morning light, gentle moments bloom
[00:10.00]Ephemeral beauty whispers through the room
[00:18.00]Finding inner resilience when the world is fast
[00:26.00]In the sweet embrace of solitude that will last
[00:35.00]Every breath a sanctuary, calm and bright
[00:44.00]Walking in the soft glow of twilight`,
    tlyricText: `[00:00.00]宁静与独处 - Aether Bloom
[00:04.00]在清晨静谧的微光中，温柔的时光悄然绽放
[00:10.00]转瞬即逝的美丽在室中轻柔低语
[00:18.00]在纷扰喧嚣的世界里，找寻内心的韧性与坚定
[00:26.00]沉浸于这份持久而甘甜的静谧独处
[00:35.00]每一次呼吸都是一座澄澈宁静的避风港
[00:44.00]漫步在薄暮温柔的微光之中`
  },
  {
    id: 'song-urban-twilight',
    title: 'Urban Twilight Glow',
    artist: 'Lumina Drift',
    duration: 168,
    albumArtUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    audioUrl: 'https://cdn.freesound.org/previews/515/515617_6142149-lq.mp3',
    palette: ['#5B7B88', '#BCA07D', '#8C9A9E'],
    keyVocab: ['ubiquitous', 'meticulous', 'serendipity'],
    lrcText: `[00:00.00]Urban Twilight Glow - Lumina Drift
[00:05.00]Meticulous steps across the ancient stone
[00:12.00]Ubiquitous echoes in the city unknown
[00:20.00]A touch of serendipity guides our way
[00:28.00]As golden embers gently close the day
[00:37.00]Harmony and radiance in the velvet sky
[00:46.00]Watching all the fleeting dreams drift on by`,
    tlyricText: `[00:00.00]都市暮光 - Lumina Drift
[00:05.00]谨小慎微地漫步过古老的石阶
[00:12.00]在未知的城市中回荡着无处不在的回响
[00:20.00]一丝不期而遇的机缘指引着前行的方向
[00:28.00]金色余晖温柔地为这一天拉下帷幕
[00:37.00]天鹅绒般的天空中洋溢着和谐与光华
[00:46.00]静静注视着漫天流光与梦想缓缓飘过`
  },
  {
    id: 'song-echoes-dawn',
    title: 'Echoes of Dawn',
    artist: 'Echoes of Dawn',
    duration: 195,
    albumArtUrl: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80',
    audioUrl: 'https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3',
    palette: ['#8C7A6B', '#D4B896', '#6E8B7B'],
    keyVocab: ['catalyst', 'coexist', 'luminous', 'tranquility'],
    lrcText: `[00:00.00]Echoes of Dawn - Echoes of Dawn
[00:06.00]A luminous spark across the morning tide
[00:14.00]Learning how diverse spirits peacefully coexist and guide
[00:22.00]A catalyst for transformation deep within the soul
[00:31.00]Finding tranquility to make the broken whole
[00:40.00]Gentle breezes carry the acoustic melody
[00:50.00]Embracing every moment of our shared reality`,
    tlyricText: `[00:00.00]黎明之响 - Echoes of Dawn
[00:06.00]晨潮之上跃动着一缕明亮的光华
[00:14.00]领悟多元灵魂如何和平共存与指引
[00:22.00]在心灵深处成为蜕变与升华的催化剂
[00:31.00]寻觅内心的宁静，抚平所有的残缺与过往
[00:40.00]微风轻轻载着悠扬的原声旋律
[00:50.00]拥抱我们共同经历的每一个真切瞬间`
  }
];

export const SEED_PASSAGE = {
  title: 'The Secret Life of Urban Flora',
  subtitle: 'CAMBRIDGE 18 · PASSAGE 2 · ACADEMIC READING',
  timeAllowedMins: 20,
  text: `In the cracks of concrete sidewalks and the forgotten margins of industrial zones, a quiet botanical revolution is underway. While city planners obsess over meticulously curated parks, the true ecological pioneers of the urban landscape are the ephemeral weeds that seize any available micro-habitat. These resilient opportunists defy the harsh conditions of pollution, compacted soil, and extreme temperature fluctuations created by the urban heat island effect.

Recent longitudinal studies by the Institute of Urban Ecology suggest that this resilience is not merely a matter of survival, but of rapid evolutionary adaptation. For instance, researchers have observed a marked divergence in seed dispersal mechanisms between rural and urban dandelion populations within a surprisingly short timeframe. In the city, where seeds risk falling onto impermeable asphalt rather than fertile ground, heavy-seeded variants that drop immediately next to the parent plant are becoming statistically dominant over their lighter, wind-borne cousins.

Furthermore, the composition of these spontaneous urban ecosystems provides a living record of human activity and historical trade routes. The ubiquitous presence of specific non-native flora along railway lines, for example, maps almost perfectly onto 19th-century grain transportation networks. As cities continue to expand and traditional natural habitats contract, understanding the complex dynamics of these accidental ecosystems becomes crucial for developing sustainable, biodiverse urban futures that integrate rather than eradicate spontaneous nature.`,
  questions: [
    {
      id: 1,
      type: 'TFNG' as const,
      prompt: 'Urban flora can adapt to harsh pavement temperatures within two seasons.',
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctAnswer: 'NOT GIVEN',
      explanation: 'The passage mentions rapid evolutionary adaptation and defiance of harsh conditions, but does not specify a timeframe of "within two seasons".',
      targetVocab: 'resilience'
    },
    {
      id: 2,
      type: 'TFNG' as const,
      prompt: 'Heavy-seeded variants of dandelions are more likely to thrive in urban settings compared to wind-dispersed ones.',
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctAnswer: 'TRUE',
      explanation: 'The text states that heavy-seeded variants that drop immediately next to the parent plant are becoming statistically dominant over lighter wind-borne cousins.',
      targetVocab: 'ephemeral'
    },
    {
      id: 3,
      type: 'TFNG' as const,
      prompt: 'The presence of non-native plant species along railway lines was intentionally planned by 19th-century botanists.',
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctAnswer: 'FALSE',
      explanation: 'The text notes these are spontaneous/accidental ecosystems that mapped onto grain transportation networks, not intentionally planned by botanists.',
      targetVocab: 'ubiquitous'
    },
    {
      id: 4,
      type: 'TFNG' as const,
      prompt: 'City planners historically prioritized wild spontaneous weeds over curated public parks.',
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctAnswer: 'FALSE',
      explanation: 'The text states that "city planners obsess over meticulously curated parks", contrasting with spontaneous weeds.',
      targetVocab: 'meticulous'
    }
  ]
};

export const SEED_IELTS_TESTS: IELTSTestRecord[] = [
  {
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 1.5, // 1.5 days ago
    bandScore: 8.5,
    correctCount: 4,
    totalQuestions: 4,
    timeSpentSec: 864, // 14m 24s
    standardTimeSec: 1200,
    extensionCount: 0,
    totalAddedSeconds: 0,
    isOvertime: false,
    passageTitle: 'The Secret Life of Urban Flora',
    passageSubtitle: 'CAMBRIDGE 18 · PASSAGE 2 · ACADEMIC READING',
    passageText: SEED_PASSAGE.text,
    questions: SEED_PASSAGE.questions,
    answers: { 1: 'NOT GIVEN', 2: 'TRUE', 3: 'FALSE', 4: 'FALSE' },
    conqueredWords: ['ephemeral', 'resilience', 'ubiquitous', 'meticulous']
  },
  {
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 4, // 4 days ago
    bandScore: 7.5,
    correctCount: 3,
    totalQuestions: 4,
    timeSpentSec: 1040, // 17m 20s
    standardTimeSec: 1200,
    extensionCount: 0,
    totalAddedSeconds: 0,
    isOvertime: false,
    passageTitle: 'Acoustic Ecology & Melodic Memory in Cognitive Science',
    passageSubtitle: 'AI SYNTHESIS · PASSAGE 1 · NEUROSCIENCE',
    passageText: `Recent developments in acoustic ecology have revealed unexpected parallels between harmonic complexity and long-term linguistic retention. When language learners are exposed to targeted vocabulary embedded in melodically coherent soundscapes, neural synchronization in the auditory cortex undergoes substantial enhancement.\n\nEmpirical investigations indicate that auditory anchors act as a cognitive catalyst, facilitating the transition of newly acquired lexemes from working memory to permanent mental lexicons. Furthermore, rhythmically synchronized syllables generate heightened dopamine responses, reinforcing neural synaptic plasticity across multilingual cohorts.`,
    questions: [
      {
        id: 1,
        type: 'TFNG',
        prompt: 'Auditory cortex neural synchronization increases when words are set in harmonic melodies.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'Paragraph 1 states neural synchronization in the auditory cortex undergoes substantial enhancement.',
        targetVocab: 'catalyst'
      },
      {
        id: 2,
        type: 'TFNG',
        prompt: 'Rhythmically synchronized syllables reduce dopamine secretion in language learners.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph 2 affirms that rhythmically synchronized syllables generate heightened dopamine responses, not reduce them.',
        targetVocab: 'serendipity'
      },
      {
        id: 3,
        type: 'TFNG',
        prompt: 'Working memory transitions occur predominantly during deep sleep cycles.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'NOT GIVEN',
        explanation: 'The passage discusses cognitive catalysts facilitating the transition to permanent mental lexicons, but does not state it happens predominantly in sleep.',
        targetVocab: 'retention'
      },
      {
        id: 4,
        type: 'TFNG',
        prompt: 'Auditory anchors hinder the formation of long-term lexical memory.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Auditory anchors act as a cognitive catalyst facilitating transition to permanent mental lexicons.',
        targetVocab: 'coherent'
      }
    ],
    answers: { 1: 'TRUE', 2: 'FALSE', 3: 'TRUE', 4: 'FALSE' }, // Question 3 was answered wrong (TRUE instead of NOT GIVEN)
    conqueredWords: ['catalyst', 'serendipity', 'solitude']
  }
];
