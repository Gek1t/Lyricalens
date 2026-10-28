import { triggerDebouncedCloudSync, recordWordDeletion } from './cloudSync';
import Dexie, { type EntityTable } from 'dexie';
import { WordItem, SongItem, IELTSTestRecord, MasteryLevel } from '../types';
import { CambridgePassage } from '../data/ieltsPassages';
import { IELTSListeningSection } from '../data/ieltsListening';
import { SEED_WORDS, SEED_SONGS, SEED_IELTS_TESTS } from './seedData';

export class LyricalensDatabase extends Dexie {
  words!: EntityTable<WordItem, 'id'>;
  songs!: EntityTable<SongItem, 'id'>;
  ieltsTests!: EntityTable<IELTSTestRecord, 'id'>;
  customPassages!: EntityTable<CambridgePassage, 'id'>;
  customListening!: EntityTable<IELTSListeningSection, 'id'>;

  constructor() {
    super('LyricalensDB');
    this.version(1).stores({
      words: '++id, &word, dateKey, isStarred, masteryLevel, addedTimestamp, *categories, *aiTags',
      songs: 'id, title, artist',
      ieltsTests: '++id, timestamp, bandScore, passageTitle'
    });
    this.version(2).stores({
      words: '++id, &word, dateKey, isStarred, masteryLevel, addedTimestamp, *categories, *aiTags',
      songs: 'id, title, artist',
      ieltsTests: '++id, timestamp, bandScore, passageTitle',
      customPassages: 'id, cambridgeBook, testNum, passageNum, title, addedTimestamp',
      customListening: 'id, cambridgeBook, testNum, sectionNum, title, addedTimestamp'
    });
  }
}

export const db = new LyricalensDatabase();

let dbInitPromise: Promise<void> | null = null;

// Populate initial seeds if tables are empty or migrate missing mastery levels
export function initializeDatabase(): Promise<void> {
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = (async () => {
    try {
      const existingCount = await db.words.count();
      if (existingCount === 0) {
        for (const seed of SEED_WORDS) {
          try {
            const lower = seed.word.toLowerCase().trim();
            await db.words.put({ ...seed, word: lower } as WordItem);
          } catch {}
        }
      } else {
        // 1. Seed or sync initial vocabulary words safely without throwing uniqueness constraint errors
        const existingWords = await db.words.toArray();
        const existingMap = new Map(existingWords.filter(w => w && w.word).map(w => [w.word.toLowerCase().trim(), w]));
        for (const seed of SEED_WORDS) {
          try {
            const lower = seed.word.toLowerCase().trim();
            const existing = existingMap.get(lower);
            if (!existing) {
              await db.words.put({ ...seed, word: lower } as WordItem);
            } else if (existing.id && typeof existing.masteryLevel === 'undefined') {
              await db.words.update(existing.id, { masteryLevel: seed.masteryLevel ?? 1 });
            }
          } catch {}
        }

        // 2. Backfill missing mastery levels on existing data if needed
        try {
          const STOP_WORDS = new Set([
            'the', 'a', 'an', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
            'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
            'and', 'but', 'or', 'nor', 'so', 'yet', 'of', 'off', 'over', 'under',
            'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did',
            'it', 'its', 'this', 'that', 'these', 'those',
            'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'their', 'our',
            'room', 'light', 'gentle', 'morning', 'filters', 'quiet', 'breathing', 'soft', 'notes', 'like', 'blooming', 'flower', 'every', 'whisper', 'holds', 'stillness', 'warm', 'silent', 'space', 'beneath', 'concrete'
          ]);

          const seedWordsSet = new Set(SEED_WORDS.map(s => s.word.toLowerCase()));
          const idsToDelete: number[] = [];

          for (const w of existingWords) {
            if (!w || !w.word) continue;
            const lower = w.word.toLowerCase();
            if (!seedWordsSet.has(lower) && STOP_WORDS.has(lower) && w.sourceContext === 'Daily Collect' && w.id) {
              idsToDelete.push(w.id);
              continue;
            }

            if (w.id && typeof w.masteryLevel === 'undefined') {
              const seedMatch = SEED_WORDS.find(s => s.word.toLowerCase() === lower);
              const level: MasteryLevel = seedMatch?.masteryLevel ?? (w.isStarred ? 1 : 0);
              await db.words.update(w.id, { masteryLevel: level });
            }
          }

          if (idsToDelete.length > 0) {
            await db.words.bulkDelete(idsToDelete);
          }
        } catch {}
      }

      // 3. Clean up demo songs from database if they exist and seed defaults
      try {
        const allDbSongs = await db.songs.toArray();
        const legacyIds = new Set(['song-jasmine-breeze', 'song-urban-solitude', '1', '2']);
        const demoIds = allDbSongs
          .filter(s => s && (legacyIds.has(s.id) || s.title === 'Jasmine Breeze' || s.title === 'Urban Solitude'))
          .map(s => s.id);
        if (demoIds.length > 0) {
          await db.songs.bulkDelete(demoIds);
        }
        const songCount = await db.songs.count();
        if (songCount === 0 && SEED_SONGS.length > 0) {
          await db.songs.bulkPut(SEED_SONGS);
        }
      } catch {}

      // 4. Clean up any fake seed IELTS tests and start fresh from 0
      try {
        if (localStorage.getItem('lyricalens_db_clean_tests_v2') !== 'true') {
          const seedTitles = new Set(SEED_IELTS_TESTS.map(t => t.passageTitle));
          const allTests = await db.ieltsTests.toArray();
          for (const t of allTests) {
            if (t.id && seedTitles.has(t.passageTitle)) {
              await db.ieltsTests.delete(t.id);
            }
          }
          localStorage.setItem('lyricalens_db_clean_tests_v2', 'true');
        }
      } catch {}
    } catch (error) {
      console.warn('Handled initial Dexie synchronization notice:', error);
    }
  })();
  return dbInitPromise;
}

// Helper: Toggle star status with fast execution
export async function toggleWordStar(wordStr: string): Promise<boolean> {
  const normalized = wordStr.trim().toLowerCase();
  const existing = await db.words.where('word').equalsIgnoreCase(normalized).first();
  if (existing && existing.id) {
    const nextVal = !existing.isStarred;
    await db.words.update(existing.id, { isStarred: nextVal });
    triggerDebouncedCloudSync();
    return nextVal;
  }
  return false;
}

// Helper: Set specific mastery level (0: 未收录, 1: 已加入单词集, 2: 熟悉/学习中, 3: 已掌握)
export async function setWordMastery(wordStr: string, level: MasteryLevel): Promise<MasteryLevel> {
  const normalized = wordStr.trim().toLowerCase();
  const existing = await db.words.where('word').equalsIgnoreCase(normalized).first();
  if (existing && existing.id) {
    const safeLevel = Math.max(0, Math.min(3, level)) as MasteryLevel;
    await db.words.update(existing.id, { masteryLevel: safeLevel, isStarred: safeLevel > 0 });
    triggerDebouncedCloudSync();
    return safeLevel;
  }
  return level;
}

// Helper: Fast cycle across 4 states: 0 (未收录) -> 1 (已加入单词集) -> 2 (熟悉/学习中) -> 3 (已掌握) -> 0
export async function cycleWordMastery(wordStr: string, itemData?: Partial<WordItem>): Promise<MasteryLevel> {
  const normalized = wordStr.trim().toLowerCase();
  const existing = await db.words.where('word').equalsIgnoreCase(normalized).first();
  if (existing && existing.id) {
    const current = (existing.masteryLevel ?? 0) as number;
    // Rotate 0 -> 1 -> 2 -> 3 -> 0
    const nextLevel: MasteryLevel = ((current + 1) % 4) as MasteryLevel;
    await db.words.update(existing.id, { 
      masteryLevel: nextLevel,
      isStarred: nextLevel > 0
    });
    triggerDebouncedCloudSync();
    return nextLevel;
  } else {
    // Word not yet in DB: explicitly tapping it transitions from 0 (未收录) to 1 (已加入单词集)
    await collectWord({
      word: normalized,
      masteryLevel: 1,
      isStarred: true,
      ...(itemData || {})
    });
    return 1;
  }
}

// Helper: Bulk update mastery level for multiple words
export async function bulkUpdateMastery(words: string[], level: MasteryLevel): Promise<void> {
  const normalizedList = words.map(w => w.trim().toLowerCase());
  const items = await db.words.where('word').anyOfIgnoreCase(normalizedList).toArray();
  for (const item of items) {
    if (item.id) {
      await db.words.update(item.id, { masteryLevel: level });
    }
  }
}

// Helper: Bulk add tags/categories to multiple words
export async function bulkAddTags(words: string[], newTags: string[]): Promise<void> {
  const normalizedList = words.map(w => w.trim().toLowerCase());
  const items = await db.words.where('word').anyOfIgnoreCase(normalizedList).toArray();
  for (const item of items) {
    if (item.id) {
      const currentCats = item.categories || [];
      const updatedCats = Array.from(new Set([...currentCats, ...newTags]));
      await db.words.update(item.id, { categories: updatedCats });
    }
  }
}

// Helper: Bulk delete words
export async function bulkDeleteWords(words: string[]): Promise<void> {
  const normalizedList = words.map(w => w.trim().toLowerCase());
  normalizedList.forEach(w => recordWordDeletion(w));
  const items = await db.words.where('word').anyOfIgnoreCase(normalizedList).toArray();
  const idsToDelete = items.map(item => item.id).filter((id): id is number => typeof id === 'number');
  if (idsToDelete.length > 0) {
    await db.words.bulkDelete(idsToDelete);
  }
}

// Helper: Record a spaced repetition review event for a word
export async function recordWordReview(wordStr: string, promoteMastery = false): Promise<void> {
  const normalized = wordStr.trim().toLowerCase();
  const existing = await db.words.where('word').equalsIgnoreCase(normalized).first();
  if (existing && existing.id) {
    const currentReviews = existing.reviewCount || 0;
    const currentMastery = (existing.masteryLevel ?? 1) as MasteryLevel;
    const nextMastery: MasteryLevel = promoteMastery
      ? (Math.min(3, currentMastery + 1) as MasteryLevel)
      : currentMastery;

    await db.words.update(existing.id, {
      lastReviewedTimestamp: Date.now(),
      reviewCount: currentReviews + 1,
      masteryLevel: nextMastery
    });
  }
}

// Helper: Bulk record review for multiple words
export async function bulkRecordWordReviews(words: string[]): Promise<void> {
  const normalizedList = words.map(w => w.trim().toLowerCase());
  const items = await db.words.where('word').anyOfIgnoreCase(normalizedList).toArray();
  const now = Date.now();
  for (const item of items) {
    if (item.id) {
      await db.words.update(item.id, {
        lastReviewedTimestamp: now,
        reviewCount: (item.reviewCount || 0) + 1
      });
    }
  }
}

// Helper: Quick add/collect word silently in < 100ms
export async function collectWord(item: Partial<WordItem> & { word: string }): Promise<WordItem> {
  const normalized = item.word.trim().toLowerCase();
  try {
    const existing = await db.words.where('word').equalsIgnoreCase(normalized).first();
    
    if (existing && existing.id) {
      // Already exists; ensure it's starred if requested or update timestamp
      await db.words.update(existing.id, {
        isStarred: true,
        addedTimestamp: Date.now(),
        ...(item.sourceContext ? { sourceContext: item.sourceContext } : {})
      });
      return { ...existing, isStarred: true, addedTimestamp: Date.now() };
    }

    // Create new word item (Level 0: 新学 default)
    const newWord: WordItem = {
      word: normalized,
      phoneticUk: item.phoneticUk || `/${normalized}/`,
      phoneticUs: item.phoneticUs || `/${normalized}/`,
      partOfSpeech: item.partOfSpeech || 'VOCAB',
      definition: item.definition || 'Vocabulary item collected from context.',
      definitionCn: item.definitionCn || '已收录单词',
      examples: item.examples || [
        {
          en: `Encountered in ${item.sourceContext || 'context'}.`,
          cn: '于语境中收录。',
          source: item.sourceContext || 'Lyricalens'
        }
      ],
      sourceContext: item.sourceContext || 'Daily Collect',
      dateKey: new Date().toISOString().split('T')[0],
      isStarred: true,
      masteryLevel: item.masteryLevel ?? 0,
      addedTimestamp: Date.now(),
      categories: item.categories || ['Collected'],
      aiTags: item.aiTags || ['Recent']
    };

    const id = await db.words.add(newWord);
    triggerDebouncedCloudSync();
    return { ...newWord, id };
  } catch (err) {
    try {
      const fallback = await db.words.where('word').equalsIgnoreCase(normalized).first();
      if (fallback) return fallback;
    } catch {}
    return { ...item, word: normalized, isStarred: true } as WordItem;
  }
}

// Custom/Online Passages helpers
export async function saveCustomPassage(passage: CambridgePassage): Promise<void> {
  const item: CambridgePassage = {
    ...passage,
    isOnlineAdded: true,
    addedTimestamp: passage.addedTimestamp || Date.now()
  };
  await db.customPassages.put(item);
}

export async function saveCustomPassagesBulk(passages: CambridgePassage[]): Promise<void> {
  const items: CambridgePassage[] = passages.map(p => ({
    ...p,
    isOnlineAdded: true,
    addedTimestamp: p.addedTimestamp || Date.now()
  }));
  await db.customPassages.bulkPut(items);
}

export async function deleteCustomPassage(id: string): Promise<void> {
  await db.customPassages.delete(id);
}

export async function getCustomPassages(): Promise<CambridgePassage[]> {
  return await db.customPassages.toArray();
}

// Custom/Online Listening sections helpers
export async function saveCustomListeningSection(section: IELTSListeningSection): Promise<void> {
  const item: IELTSListeningSection = {
    ...section,
    isOnlineAdded: true,
    addedTimestamp: section.addedTimestamp || Date.now()
  };
  await db.customListening.put(item);
}

export async function saveCustomListeningBulk(sections: IELTSListeningSection[]): Promise<void> {
  const items: IELTSListeningSection[] = sections.map(s => ({
    ...s,
    isOnlineAdded: true,
    addedTimestamp: s.addedTimestamp || Date.now()
  }));
  await db.customListening.bulkPut(items);
}

export async function deleteCustomListeningSection(id: string): Promise<void> {
  await db.customListening.delete(id);
}

export async function getCustomListeningSections(): Promise<IELTSListeningSection[]> {
  return await db.customListening.toArray();
}

