import { Router, type Request, type Response } from 'express';
import { prisma, initSqlitePragmas } from '../prisma';
import { hashPassword, comparePassword, generateToken, requireAuth, type AuthenticatedRequest } from '../auth';

const router = Router();

// POST /api/auth/register - Register new account with validation
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({ success: false, error: 'Username must be between 3 and 30 characters' });
    }

    // Reserved usernames protection
    const RESERVED = new Set(['admin', 'root', 'system', 'null', 'undefined', 'api']);
    if (RESERVED.has(cleanUsername)) {
      return res.status(400).json({ success: false, error: 'This username is reserved' });
    }

    if (password.length < 6 || password.length > 72) {
      return res.status(400).json({ success: false, error: 'Password must be between 6 and 72 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Username is already taken' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        passwordHash,
        settings: JSON.stringify({
          theme: 'dark',
          autoPronounce: true,
          accent: 'us',
          audioQuality: 'lossless',
        }),
      },
    });

    const token = generateToken({ userId: user.id, username: user.username });
    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed due to an internal server error' });
  }
});

// POST /api/auth/login - Login existing account
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const token = generateToken({ userId: user.id, username: user.username });
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        settings: user.settings ? JSON.parse(user.settings) : {},
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed due to an internal server error' });
  }
});

// POST /api/auth/guest - Issue an isolated guest session token
router.post('/guest', async (req: Request, res: Response) => {
  const guestUsername = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const guestData = {
    username: guestUsername,
    passwordHash: 'guest_ephemeral',
    settings: JSON.stringify({
      theme: 'dark',
      autoPronounce: true,
      accent: 'us',
      audioQuality: 'lossless',
    }),
  };

  try {
    let guestUser;
    try {
      guestUser = await prisma.user.create({ data: guestData });
    } catch {
      await initSqlitePragmas();
      guestUser = await prisma.user.create({ data: guestData });
    }
    const token = generateToken({ userId: guestUser.id, username: guestUser.username });
    res.json({
      success: true,
      token,
      user: { id: guestUser.id, username: guestUser.username },
    });
  } catch (error: any) {
    // Fallback stateless guest session if SQLite is read-only or unavailable
    const fallbackId = Math.floor(Date.now() / 1000);
    const token = generateToken({ userId: fallbackId, username: guestUsername });
    res.json({
      success: true,
      token,
      user: { id: fallbackId, username: guestUsername },
    });
  }
});

// GET /api/auth/me - Get current user profile and settings
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, settings: true, createdAt: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        settings: user.settings ? JSON.parse(user.settings) : {},
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/auth/settings - Update user preferences
router.put('/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { settings } = req.body;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        settings: typeof settings === 'object' ? JSON.stringify(settings) : String(settings),
      },
      select: { id: true, username: true, settings: true },
    });
    res.json({
      success: true,
      settings: updated.settings ? JSON.parse(updated.settings) : {},
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
