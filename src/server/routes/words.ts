import { Router, type Response } from 'express';
import { prisma, sanitizeBigInt } from '../prisma';
import { type AuthenticatedRequest, authenticate } from '../auth';

const router = Router();
router.use(authenticate);

// GET /api/words - Fetch all vocabulary words for the authenticated user
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const words = await prisma.word.findMany({
      where: { userId },
      orderBy: { addedTimestamp: 'desc' },
    });

    const parsed = words.map((w) => ({
      ...sanitizeBigInt(w),
      examples: w.examples ? JSON.parse(w.examples) : [],
      categories: w.categories ? JSON.parse(w.categories) : [],
      aiTags: w.aiTags ? JSON.parse(w.aiTags) : [],
      subWords: w.subWords ? JSON.parse(w.subWords) : [],
    }));

    res.json({ success: true, count: parsed.length, data: parsed });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/words - Upsert a single word
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      word,
      phoneticUk,
      phoneticUs,
      partOfSpeech,
      definition,
      definitionCn,
      examples,
      sourceContext,
      dateKey,
      isStarred,
      masteryLevel,
      addedTimestamp,
      lastReviewedTimestamp,
      reviewCount,
      categories,
      aiTags,
      isPhrase,
      parentPhrase,
      subWords,
      arObjectLabel,
    } = req.body;

    if (!word || typeof word !== 'string') {
      return res.status(400).json({ success: false, error: 'Word string is required' });
    }

    const normalizedWord = word.trim().toLowerCase();
    const now = Date.now();

    const upserted = await prisma.word.upsert({
      where: {
        userId_word: {
          userId,
          word: normalizedWord,
        },
      },
      update: {
        phoneticUk: phoneticUk || undefined,
        phoneticUs: phoneticUs || undefined,
        partOfSpeech: partOfSpeech || undefined,
        definition: definition || undefined,
        definitionCn: definitionCn || undefined,
        examples: examples ? JSON.stringify(examples) : undefined,
        sourceContext: sourceContext || undefined,
        dateKey: dateKey || undefined,
        isStarred: typeof isStarred === 'boolean' ? isStarred : undefined,
        masteryLevel: typeof masteryLevel === 'number' ? masteryLevel : undefined,
        lastReviewedTimestamp: lastReviewedTimestamp ? BigInt(lastReviewedTimestamp) : undefined,
        reviewCount: typeof reviewCount === 'number' ? reviewCount : undefined,
        categories: categories ? JSON.stringify(categories) : undefined,
        aiTags: aiTags ? JSON.stringify(aiTags) : undefined,
        isPhrase: typeof isPhrase === 'boolean' ? isPhrase : undefined,
        parentPhrase: parentPhrase || undefined,
        subWords: subWords ? JSON.stringify(subWords) : undefined,
        arObjectLabel: arObjectLabel || undefined,
      },
      create: {
        userId,
        word: normalizedWord,
        phoneticUk: phoneticUk || `/${normalizedWord}/`,
        phoneticUs: phoneticUs || `/${normalizedWord}/`,
        partOfSpeech: partOfSpeech || 'VOCAB',
        definition: definition || 'Contextually acquired vocabulary.',
        definitionCn: definitionCn || '词汇',
        examples: examples ? JSON.stringify(examples) : '[]',
        sourceContext: sourceContext || 'User Collect',
        dateKey: dateKey || new Date().toISOString().split('T')[0],
        isStarred: typeof isStarred === 'boolean' ? isStarred : true,
        masteryLevel: typeof masteryLevel === 'number' ? masteryLevel : 0,
        addedTimestamp: addedTimestamp ? BigInt(addedTimestamp) : BigInt(now),
        lastReviewedTimestamp: lastReviewedTimestamp ? BigInt(lastReviewedTimestamp) : null,
        reviewCount: typeof reviewCount === 'number' ? reviewCount : 0,
        categories: categories ? JSON.stringify(categories) : '["Collected"]',
        aiTags: aiTags ? JSON.stringify(aiTags) : '["Recent"]',
        isPhrase: Boolean(isPhrase),
        parentPhrase: parentPhrase || null,
        subWords: subWords ? JSON.stringify(subWords) : null,
        arObjectLabel: arObjectLabel || null,
      },
    });

    const parsed = {
      ...sanitizeBigInt(upserted),
      examples: upserted.examples ? JSON.parse(upserted.examples) : [],
      categories: upserted.categories ? JSON.parse(upserted.categories) : [],
      aiTags: upserted.aiTags ? JSON.parse(upserted.aiTags) : [],
      subWords: upserted.subWords ? JSON.parse(upserted.subWords) : [],
    };

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/words/:id - Update word details
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid word id' });
    }

    const {
      isStarred,
      masteryLevel,
      lastReviewedTimestamp,
      reviewCount,
      examples,
      categories,
      aiTags,
    } = req.body;

    const updated = await prisma.word.update({
      where: { id, userId },
      data: {
        isStarred: typeof isStarred === 'boolean' ? isStarred : undefined,
        masteryLevel: typeof masteryLevel === 'number' ? masteryLevel : undefined,
        lastReviewedTimestamp: lastReviewedTimestamp ? BigInt(lastReviewedTimestamp) : undefined,
        reviewCount: typeof reviewCount === 'number' ? reviewCount : undefined,
        examples: examples ? JSON.stringify(examples) : undefined,
        categories: categories ? JSON.stringify(categories) : undefined,
        aiTags: aiTags ? JSON.stringify(aiTags) : undefined,
      },
    });

    const parsed = {
      ...sanitizeBigInt(updated),
      examples: updated.examples ? JSON.parse(updated.examples) : [],
      categories: updated.categories ? JSON.parse(updated.categories) : [],
      aiTags: updated.aiTags ? JSON.parse(updated.aiTags) : [],
      subWords: updated.subWords ? JSON.parse(updated.subWords) : [],
    };

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/words/:id - Delete a word
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid word id' });
    }

    await prisma.word.delete({
      where: { id, userId },
    });

    res.json({ success: true, message: 'Word removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Safe BigInt parser to prevent unhandled TypeError on invalid client timestamps
function parseSafeBigInt(val: any, fallback: bigint = 0n): bigint {
  if (typeof val === 'bigint') return val;
  if (typeof val === 'number' && !isNaN(val)) return BigInt(Math.floor(val));
  if (typeof val === 'string' && /^-?\d+$/.test(val.trim())) {
    try {
      return BigInt(val.trim());
    } catch {}
  }
  return fallback;
}

// POST /api/words/batch-sync - High-performance chunked delta sync with tombstone support
router.post('/batch-sync', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { localWords = [], deletedWords = [], clientLastSync = 0 } = req.body;
    const serverNow = Date.now();

    // 1. Process deletions if client requested tombstones
    if (Array.isArray(deletedWords) && deletedWords.length > 0) {
      const cleanDeleted = deletedWords.map((w: string) => String(w).trim().toLowerCase());
      await prisma.word.deleteMany({
        where: {
          userId,
          word: { in: cleanDeleted },
        },
      });
    }

    // 2. Fetch existing words summary to compare timestamps (Last-Write-Wins)
    const existingWords = await prisma.word.findMany({
      where: { userId },
      select: { id: true, word: true, updatedAt: true, lastReviewedTimestamp: true },
    });
    const existingMap = new Map(existingWords.map((w) => [w.word, w]));

    // 3. Batch atomic chunked upserts using prisma.$transaction
    if (Array.isArray(localWords) && localWords.length > 0) {
      // Deduplicate client localWords in-place by word key to prevent Prisma P2002 unique constraint failure
      const dedupedLocalWordsMap = new Map<string, any>();
      for (const item of localWords) {
        if (!item || !item.word) continue;
        const norm = String(item.word).trim().toLowerCase();
        dedupedLocalWordsMap.set(norm, item);
      }
      const dedupedLocalWords = Array.from(dedupedLocalWordsMap.values());

      const operations: any[] = [];

      for (const item of dedupedLocalWords) {
        if (!item || !item.word) continue;
        const normalized = String(item.word).trim().toLowerCase();
        const existing = existingMap.get(normalized);

        if (existing) {
          // Last-Write-Wins: update if client review is newer or lastSync is 0
          const clientTime = item.lastReviewedTimestamp ? Number(item.lastReviewedTimestamp) : 0;
          const serverTime = existing.updatedAt.getTime();

          if (clientTime >= serverTime || !clientLastSync) {
            operations.push(
              prisma.word.update({
                where: { id: existing.id },
                data: {
                  isStarred: typeof item.isStarred === 'boolean' ? item.isStarred : undefined,
                  masteryLevel: typeof item.masteryLevel === 'number' ? item.masteryLevel : undefined,
                  reviewCount: typeof item.reviewCount === 'number' ? item.reviewCount : undefined,
                  lastReviewedTimestamp: item.lastReviewedTimestamp ? parseSafeBigInt(item.lastReviewedTimestamp) : undefined,
                  examples: item.examples ? JSON.stringify(item.examples) : undefined,
                },
              })
            );
          }
        } else {
          operations.push(
            prisma.word.create({
              data: {
                userId,
                word: normalized,
                phoneticUk: item.phoneticUk || `/${normalized}/`,
                phoneticUs: item.phoneticUs || `/${normalized}/`,
                partOfSpeech: item.partOfSpeech || 'VOCAB',
                definition: item.definition || 'Contextually acquired vocabulary.',
                definitionCn: item.definitionCn || '词汇',
                examples: item.examples ? JSON.stringify(item.examples) : '[]',
                sourceContext: item.sourceContext || 'Client Sync',
                dateKey: item.dateKey || new Date().toISOString().split('T')[0],
                isStarred: typeof item.isStarred === 'boolean' ? item.isStarred : true,
                masteryLevel: typeof item.masteryLevel === 'number' ? item.masteryLevel : 0,
                addedTimestamp: parseSafeBigInt(item.addedTimestamp, BigInt(serverNow)),
                lastReviewedTimestamp: item.lastReviewedTimestamp ? parseSafeBigInt(item.lastReviewedTimestamp) : null,
                reviewCount: typeof item.reviewCount === 'number' ? item.reviewCount : 0,
                categories: item.categories ? JSON.stringify(item.categories) : '["Collected"]',
                aiTags: item.aiTags ? JSON.stringify(item.aiTags) : '["Recent"]',
                isPhrase: Boolean(item.isPhrase),
                parentPhrase: item.parentPhrase || null,
                subWords: item.subWords ? JSON.stringify(item.subWords) : null,
                arObjectLabel: item.arObjectLabel || null,
              },
            })
          );
        }
      }

      // Execute in transactions of 100 to prevent SQLite lock starvation
      const CHUNK_SIZE = 100;
      for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
        await prisma.$transaction(operations.slice(i, i + CHUNK_SIZE));
      }
    }

    // 4. Return words (delta query if clientLastSync > 0, full otherwise)
    const deltaWords = await prisma.word.findMany({
      where: {
        userId,
        ...(clientLastSync > 0 ? { updatedAt: { gte: new Date(clientLastSync) } } : {}),
      },
      orderBy: { addedTimestamp: 'desc' },
    });

    const parsed = deltaWords.map((w) => ({
      ...sanitizeBigInt(w),
      examples: w.examples ? JSON.parse(w.examples) : [],
      categories: w.categories ? JSON.parse(w.categories) : [],
      aiTags: w.aiTags ? JSON.parse(w.aiTags) : [],
      subWords: w.subWords ? JSON.parse(w.subWords) : [],
    }));

    res.json({
      success: true,
      serverTimestamp: serverNow,
      words: parsed,
      count: parsed.length,
      isDelta: clientLastSync > 0,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
