import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma, getOrCreateDefaultUser } from './prisma';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable must be set in production mode.');
}
const JWT_SECRET = rawSecret || 'dev_fallback_secret_only_for_local_debugging_3821';

export interface AuthUser {
  userId: number;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// Generate JWT token
export function generateToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn: '30d' });
}

// Verify JWT token with locked HS256 algorithm
export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as AuthUser;
  } catch {
    return null;
  }
}

// Hash password with salt
export async function hashPassword(password: string): Promise<string> {
  if (password.length > 72) {
    throw new Error('Password exceeds maximum allowed length (72 characters)');
  }
  return await bcrypt.hash(password, 10);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// SSRF Guard: Validate external URL targets and prevent internal network exploitation
export function isSafeExternalUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    // Clean hostname (strip IPv6 brackets)
    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    
    // Disallow localhost and local domain aliases
    if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname === '0.0.0.0') {
      return false;
    }

    // Disallow decimal, hex, or octal IP bypass (e.g. 2130706433, 0x7f000001)
    if (/^(0x[0-9a-f]+|\d+)$/i.test(hostname)) {
      return false;
    }
    if (hostname.split('.').some(part => /^0[0-9a-fx]/i.test(part))) {
      return false;
    }

    // Disallow IPv6 loopback, link-local, unique-local, or IPv4-mapped
    if (hostname.includes(':')) {
      if (
        hostname === '::1' ||
        hostname === '::' ||
        hostname.startsWith('::ffff:') ||
        hostname.startsWith('fe80:') ||
        hostname.startsWith('fc00:') ||
        hostname.startsWith('fd00:')
      ) {
        return false;
      }
    }

    // Disallow loopback (127.0.0.0/8) and current network (0.0.0.0/8)
    if (/^127\./.test(hostname) || /^0\./.test(hostname)) {
      return false;
    }

    // Disallow link-local metadata address (AWS/GCP/Azure: 169.254.0.0/16)
    if (/^169\.254\./.test(hostname)) {
      return false;
    }

    // Disallow private RFC1918 networks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
    if (/^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
      return false;
    }

    // Disallow Carrier-grade NAT (100.64.0.0/10)
    if (/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Strict Authentication middleware: Rejects unauthenticated requests with 401
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing Bearer token' });
  }

  const token = authHeader.substring(7).trim();
  const verified = verifyToken(token);
  if (!verified) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Token expired or invalid' });
  }

  req.user = verified;
  next();
}

// Tenant-Isolated Authentication middleware: Validates JWT token or guides client to guest token
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const verified = verifyToken(token);
    if (verified) {
      req.user = verified;
      return next();
    }
    return res.status(401).json({ success: false, error: 'Unauthorized: Token expired or invalid' });
  }

  // Reject unauthenticated requests to prevent multi-tenant cross-contamination
  return res.status(401).json({
    success: false,
    error: 'Unauthorized: Bearer token required. Please sign in or obtain an isolated guest session via POST /api/auth/guest'
  });
}
