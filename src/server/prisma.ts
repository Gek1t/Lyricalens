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

// Initialize SQLite WAL mode, foreign keys and 5000ms busy timeout using queryRawUnsafe (Pragma returns values in SQLite)
export async function initSqlitePragmas(): Promise<void> {
  try {
    await prisma.$queryRawUnsafe(`PRAGMA journal_mode = WAL;`);
    await prisma.$queryRawUnsafe(`PRAGMA busy_timeout = 5000;`);
    await prisma.$queryRawUnsafe(`PRAGMA synchronous = NORMAL;`);
    await prisma.$queryRawUnsafe(`PRAGMA foreign_keys = ON;`);
    console.log('[SQLite] WAL mode, busy_timeout=5000ms, and foreign_keys enabled.');
  } catch (err) {
    console.warn('[SQLite] Pragma initialization warning:', err);
  }
}

// Identity sanitizer kept for backward compatibility (BigInt.toJSON handles serialization)
export function sanitizeBigInt<T>(obj: T): T {
  return obj;
}

// Ensure default user exists for immediate zero-friction guest and online use
export async function getOrCreateDefaultUser(username = 'guest'): Promise<number> {
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
