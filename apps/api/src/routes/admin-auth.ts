import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { adminLoginSchema, adminUserCreateSchema } from '@matina/shared';
import { prisma } from '../lib/prisma';
import {
  requireAdminAuth,
  requirePermission,
  signAdminToken,
} from '../middleware/auth';

export const adminAuthRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please wait and try again.' },
});

adminAuthRouter.post('/auth/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = adminLoginSchema.parse(req.body);
    const user = await prisma.adminUser.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signAdminToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.cookie('matina_admin_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

adminAuthRouter.post('/auth/logout', (_req, res) => {
  res.clearCookie('matina_admin_token');
  res.json({ ok: true });
});

adminAuthRouter.get('/auth/me', requireAdminAuth, (req, res) => {
  res.json({ user: req.admin });
});

adminAuthRouter.get(
  '/users',
  requireAdminAuth,
  requirePermission('*'),
  async (_req, res, next) => {
    try {
      const users = await prisma.adminUser.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
);

adminAuthRouter.post(
  '/users',
  requireAdminAuth,
  requirePermission('*'),
  async (req, res, next) => {
    try {
      const input = adminUserCreateSchema.parse(req.body);
      const passwordHash = await bcrypt.hash(input.password, 12);
      const user = await prisma.adminUser.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
);

adminAuthRouter.patch(
  '/users/:id',
  requireAdminAuth,
  requirePermission('*'),
  async (req, res, next) => {
    try {
      const { role, isActive } = req.body as {
        role?: 'super_admin' | 'manager' | 'order_staff' | 'content_staff';
        isActive?: boolean;
      };
      const updated = await prisma.adminUser.update({
        where: { id: req.params.id },
        data: {
          ...(role !== undefined ? { role } : {}),
          ...(isActive !== undefined ? { isActive } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);
