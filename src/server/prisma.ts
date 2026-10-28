import { PrismaClient } from '@prisma/client';

// Global zero-cost BigInt JSON serializer
if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

// Global singleton instance for Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Initialize SQLite WAL mode, foreign keys, busy timeout, and auto-bootstrap schema tables if missing
export async function initSqlitePragmas(): Promise<void> {
  try {
    await prisma.$queryRawUnsafe(`PRAGMA journal_mode = WAL;`);
    await prisma.$queryRawUnsafe(`PRAGMA busy_timeout = 5000;`);
    await prisma.$queryRawUnsafe(`PRAGMA synchronous = NORMAL;`);
    await prisma.$queryRawUnsafe(`PRAGMA foreign_keys = ON;`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "username" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "settings" TEXT
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Word" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER NOT NULL,
        "word" TEXT NOT NULL,
        "phoneticUk" TEXT,
        "phoneticUs" TEXT,
        "partOfSpeech" TEXT,
        "definition" TEXT,
        "definitionCn" TEXT,
        "examples" TEXT,
        "sourceContext" TEXT,
        "dateKey" TEXT,
        "isStarred" BOOLEAN NOT NULL DEFAULT 1,
        "masteryLevel" INTEGER NOT NULL DEFAULT 0,
        "addedTimestamp" BIGINT NOT NULL,
        "lastReviewedTimestamp" BIGINT,
        "reviewCount" INTEGER NOT NULL DEFAULT 0,
        "categories" TEXT,
        "aiTags" TEXT,
        "isPhrase" BOOLEAN NOT NULL DEFAULT 0,
        "parentPhrase" TEXT,
        "subWords" TEXT,
        "arObjectLabel" TEXT,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Word_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Word_userId_word_key" ON "Word"("userId", "word");`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Word_id_userId_key" ON "Word"("id", "userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Word_userId_isStarred_idx" ON "Word"("userId", "isStarred");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Word_userId_masteryLevel_idx" ON "Word"("userId", "masteryLevel");`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Song" (
        "id" TEXT NOT NULL,
        "userId" INTEGER NOT NULL,
        "title" TEXT NOT NULL,
        "artist" TEXT NOT NULL,
        "duration" INTEGER NOT NULL DEFAULT 0,
        "albumArtUrl" TEXT,
        "audioUrl" TEXT,
        "lrcText" TEXT,
        "tlyricText" TEXT,
        "palette" TEXT,
        "keyVocab" TEXT,
        "vocabLevel" TEXT,
        "vocabStats" TEXT,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("userId", "id"),
        CONSTRAINT "Song_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Song_userId_idx" ON "Song"("userId");`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "IELTSTest" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER NOT NULL,
        "timestamp" BIGINT NOT NULL,
        "bandScore" REAL NOT NULL,
        "passageTitle" TEXT NOT NULL,
        "totalQuestions" INTEGER NOT NULL,
        "correctCount" INTEGER NOT NULL,
        "durationSeconds" INTEGER NOT NULL,
        "questionResults" TEXT NOT NULL,
        "rawQuestions" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "IELTSTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "IELTSTest_userId_idx" ON "IELTSTest"("userId");`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CustomPassage" (
        "id" TEXT NOT NULL,
        "userId" INTEGER NOT NULL,
        "cambridgeBook" INTEGER,
        "testNum" INTEGER,
        "passageNum" INTEGER,
        "title" TEXT NOT NULL,
        "subTitle" TEXT,
        "readingPassage" TEXT NOT NULL,
        "questions" TEXT NOT NULL,
        "addedTimestamp" BIGINT NOT NULL,
        "isOnlineAdded" BOOLEAN NOT NULL DEFAULT 1,
        PRIMARY KEY ("userId", "id"),
        CONSTRAINT "CustomPassage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomPassage_userId_idx" ON "CustomPassage"("userId");`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CustomListening" (
        "id" TEXT NOT NULL,
        "userId" INTEGER NOT NULL,
        "cambridgeBook" INTEGER,
        "testNum" INTEGER,
        "sectionNum" INTEGER,
        "title" TEXT NOT NULL,
        "topic" TEXT,
        "audioUrl" TEXT,
        "questions" TEXT NOT NULL,
        "transcript" TEXT,
        "addedTimestamp" BIGINT NOT NULL,
        "isOnlineAdded" BOOLEAN NOT NULL DEFAULT 1,
        PRIMARY KEY ("userId", "id"),
        CONSTRAINT "CustomListening_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomListening_userId_idx" ON "CustomListening"("userId");`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WordDictionaryCache" (
        "word" TEXT NOT NULL PRIMARY KEY,
        "resultJson" TEXT NOT NULL,
        "hitCount" INTEGER NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[SQLite] WAL mode, busy_timeout=5000ms, foreign_keys, and schema tables verified.');
  } catch (err) {
    console.warn('[SQLite] Pragma/schema initialization warning:', err);
  }
}

// Identity sanitizer kept for backward compatibility (BigInt.toJSON handles serialization)
export function sanitizeBigInt<T>(obj: T): T {
  return obj;
}

// Ensure default user exists for immediate zero-friction guest and online use
export async function getOrCreateDefaultUser(username = 'guest'): Promise<number> {
  try {
    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }
    const created = await prisma.user.create({
      data: {
        username,
        passwordHash: 'default_guest_hash',
        settings: JSON.stringify({
          theme: 'dark',
          autoPronounce: true,
          accent: 'us',
          audioQuality: 'lossless',
        }),
      },
      select: { id: true },
    });
    return created.id;
  } catch {
    await initSqlitePragmas();
    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }
    const created = await prisma.user.create({
      data: {
        username,
        passwordHash: 'default_guest_hash',
        settings: JSON.stringify({
          theme: 'dark',
          autoPronounce: true,
          accent: 'us',
          audioQuality: 'lossless',
        }),
      },
      select: { id: true },
    });
    return created.id;
  }
}
