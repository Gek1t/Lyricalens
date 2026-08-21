# ContextEng — 数据模型与 IndexedDB Schema 规范 (Data Schema)

> 本文档定义了 ContextEng 应用内部的核心数据结构、TypeScript 接口与 IndexedDB 存储规范。

---

## 1. 词汇记录数据模型 (Word Record Schema)

```typescript
export interface WordRecord {
  id: string;                 // 唯一标识 (UUID 或 word 小写)
  word: string;               // 英文单词，例如 "monstera"
  phoneticUk?: string;        // 英音音标，例如 "/ˌmɒn.stə.rə/"
  phoneticUs?: string;        // 美音音标，例如 "/ˌmɑːn.stə.rə/"
  audioUkUrl?: string;        // 英音发音音频 URL
  audioUsUrl?: string;        // 美音发音音频 URL
  translations: {
    pos: string;              // 词性: n., v., adj., adv., prep.
    meaning: string;          // 中文释义: "龟背竹 (一种观叶植物)"
  }[];
  
  // 来源分布
  source: {
    type: 'camera' | 'song' | 'ielts' | 'manual';
    sourceName?: string;      // 例如 "Ed Sheeran - Shape of You" 或 "Camera Vision"
    contextSentence?: string; // 首次遇到的原声/原情境例句
  };

  // 分类与标签
  categories: string[];       // 场景/语义分类: ['Plant', 'Daily Life', 'Nature']
  aiTags?: string[];          // AI 动态标注标签: ['Botany', 'IELTS Academic C1']
  
  // 词组与关联外键
  isPhrase?: boolean;         // 是否为多词短语/词组 (例如 "in shades of")
  subWords?: string[];        // 短语构成的子单词列表
  parentPhraseId?: string;    // 若下钻收录单单词，记录所属母词组外键引用
  
  // 熟练度与复习状态
  masteryLevel: 0 | 1 | 2 | 3; // 4阶场景驱动掌握度: 0(新学) | 1(熟悉中) | 2(雅思通关) | 3(已掌握)
  isStarred: boolean;         // 是否已收藏
  addedTimestamp: number;     // 添加时的毫秒级时间戳 (用于切分 Today/Yesterday/Earlier)
  dateKey: string;            // 'YYYY-MM-DD' 格式索引字段
  lastReviewedTimestamp?: number; // 上次复习时间
  reviewCount: number;        // 累计复习/查看次数
  ieltsTestedCount?: number;  // 雅思真题做对次数

  // 雅思相关元数据
  ieltsLevel?: 'Band 6.0' | 'Band 7.0' | 'Band 8.0+'; // 雅思目标分级
  ieltsFrequency?: number;    // 剑雅真题出现频次
}
```

---

## 2. 歌单与歌词数据模型 (Playlist & Song Schema)

```typescript
export interface LyricSegment {
  startTime: number;          // 起始时间 (秒)
  duration: number;           // 持续时长 (秒)
  text: string;               // 歌词单行文本
  words?: {                   // 逐字高亮时间轴
    word: string;
    startTime: number;
    duration: number;
  }[];
}

export interface SongRecord {
  id: string;
  title: string;
  artist: string;
  albumCover?: string;
  audioUrl: string;
  lrcRaw: string;             // 原始 LRC 格式文本
  lyricsParsed: LyricSegment[]; // 解析后的结构化时间轴
  targetVocab: string[];      // 本歌曲包含的核心雅思/重点词汇 ID
}

export interface PlaylistRecord {
  id: string;
  title: string;              // 例如 "雅思听力高频英文歌单"
  description?: string;
  coverUrl?: string;
  sourceType: 'preset' | 'netease' | 'spotify' | 'custom_json' | 'local_folder';
  sourceUrlOrId?: string;     // 关联的外部歌单 URL 或 ID
  songs: SongRecord[];        // 歌单内包含的歌曲列表
  lastSyncedTimestamp: number;
}
```

---

## 3. 雅思语料数据模型 (IELTS Corpus Schema)

```typescript
export interface IeltsCorpusRecord {
  id: string;
  module: 'listening' | 'reading' | 'writing';
  title: string;              // 例如 "Test 4 Passage 1: Plant Intelligence"
  topicCategory: string;      // 话题分类，如 "Nature & Environment"
  
  // 具体内容
  content: {
    listeningDialogue?: {
      speakerA: string;
      speakerB: string;
      fullText: string;
    }[];
    readingPassage?: string;  // 学术阅读段落全文
    writingEssay?: {
      taskType: 'Task 1' | 'Task 2';
      prompt: string;
      highScoreSample: string; // 8分范文段落
      collocations: string[]; // 核心搭配
    };
  };

  containedWords: string[];   // 本语料所包含的已收录单词列表
}

export interface IeltsTestResultRecord {
  id: string;
  corpusId: string;
  passageTitle: string;
  score: number;              // 正确题数 / 总题数
  totalQuestions: number;
  estimatedBand: number;      // 预估 Band 分数 (e.g. 7.5)
  standardDurationSeconds: number; // 标准官方时长 (例如 1200 秒 / 20 分钟)
  actualDurationSeconds: number;   // 实际总耗时
  extensionCount: number;     // 加时次数 (例如 1)
  extensionMinutesTotal: number; // 累计加时分钟数
  completedTimestamp: number;
  testedWordsSummary: {
    wordId: string;
    isCorrect: boolean;
  }[];
}

export interface UserSettingsRecord {
  key: string;                // e.g. 'general_settings' | 'ielts_preferences'
  theme?: 'dark' | 'light' | 'paper';
  pronunciationPreference?: 'uk' | 'us';
  lastExtensionMinutes?: number; // 上次雅思做题加时分钟数 (如 5)
  extensionUsageStats?: { minutes: number; count: number }[]; // 历史加时档位使用频次
  ieltsTimePerPassageMinutes?: number; // 默认每篇时长 (默认 20)
}
```

---

## 4. IndexedDB 本地数据库索引 (Dexie.js Spec)

```javascript
// 数据库版本: v2
const dbSchema = {
  words: 'id, &word, dateKey, isStarred, addedTimestamp, *categories, *aiTags',
  playlists: 'id, title, sourceType',
  songs: 'id, title, artist',
  ieltsCorpus: 'id, module, topicCategory, *containedWords',
  ieltsTestResults: 'id, corpusId, completedTimestamp',
  userSettings: 'key' // 存储主题、发音偏好、加时习惯 (lastExtensionMinutes)、PWA 配置等
};
```
