import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AdminRole, hasPermission } from '@matina/shared';

export interface AdminJwtPayload {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminJwtPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-matina-jwt-secret-change-me';

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const token =
    req.cookies?.matina_admin_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminJwtPayload;
    req.admin = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!hasPermission(req.admin.role, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}
