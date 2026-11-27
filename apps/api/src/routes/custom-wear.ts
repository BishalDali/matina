import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { nepalPhoneSchema } from '@matina/shared';
import { prisma } from '../lib/prisma';
import { requireAdminAuth, requirePermission } from '../middleware/auth';

export const customWearRouter = Router();

const customUploadDir = path.resolve(
  process.cwd(),
  process.env.UPLOAD_DIR || 'uploads',
  'custom-designs'
);
fs.mkdirSync(customUploadDir, { recursive: true });

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { error: 'Too many design uploads. Please try again later.' },
});

const designUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, customUploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(
        file.mimetype
      )
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG, WebP, or SVG files are allowed'));
    }
  },
});

const customRequestSchema = z.object({
  templateId: z.string().min(1),
  colourName: z.string().trim().min(1).max(60),
  colourHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  size: z.string().trim().min(1).max(20),
  quantity: z.number().int().min(1).max(100).default(1),
  placement: z.enum(['front', 'back']).default('front'),
  designImageUrl: z.string().trim().optional().nullable(),
  customText: z.string().trim().max(120).optional().nullable(),
  designConfig: z
    .object({
      x: z.number().optional(),
      y: z.number().optional(),
      scale: z.number().optional(),
      rotation: z.number().optional(),
      textColor: z.string().optional(),
    })
    .passthrough()
    .optional()
    .default({}),
  customerName: z.string().trim().min(2).max(120),
  phone: nepalPhoneSchema,
  email: z.string().trim().email().optional().or(z.literal('')),
  deliveryAddress: z.string().trim().min(5).max(300),
  notes: z.string().trim().max(500).optional().default(''),
});

// Public: list active customizable garment templates
customWearRouter.get('/custom-wear/templates', async (_req, res, next) => {
  try {
    const templates = await prisma.customWearTemplate.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    res.json(templates);
  } catch (err) {
    next(err);
  }
});

// Public: upload customer artwork
customWearRouter.post(
  '/custom-wear/upload',
  uploadLimiter,
  designUpload.single('file'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No design file provided' });
    }
    const baseUrl = process.env.API_PUBLIC_URL || 'http://localhost:4000';
    res.status(201).json({
      url: `${baseUrl}/uploads/custom-designs/${req.file.filename}`,
    });
  }
);

// Public: submit custom wear request
customWearRouter.post('/custom-wear/requests', async (req, res, next) => {
  try {
    const input = customRequestSchema.parse(req.body);
    if (!input.designImageUrl && !input.customText) {
      return res.status(400).json({
        error: 'Please upload a design image or add custom text.',
      });
    }

    const template = await prisma.customWearTemplate.findUnique({
      where: { id: input.templateId },
    });
    if (!template || !template.isActive) {
      return res.status(404).json({ error: 'Selected garment mockup not found' });
    }

    const requestNumber = `MTN-C-${new Date().getFullYear()}-${Math.floor(
      10000 + Math.random() * 90000
    )}`;

    const created = await prisma.customOrderRequest.create({
      data: {
        requestNumber,
        templateId: template.id,
        garmentType: template.garmentType,
        colourName: input.colourName,
        colourHex: input.colourHex,
        size: input.size,
        quantity: input.quantity,
        placement: input.placement,
        designImageUrl: input.designImageUrl || null,
        customText: input.customText || null,
        designConfig: input.designConfig as any,
        customerName: input.customerName,
        phone: input.phone,
        email: input.email || null,
        deliveryAddress: input.deliveryAddress,
        notes: input.notes || null,
        estimatedPriceNpr: template.basePriceNpr * input.quantity,
        status: 'pending_review',
      },
      include: { template: true },
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Admin: list & manage custom design requests
customWearRouter.get(
  '/admin/custom-orders',
  requireAdminAuth,
  requirePermission('orders:read'),
  async (req, res, next) => {
    try {
      const status = req.query.status as string | undefined;
      const items = await prisma.customOrderRequest.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        include: { template: { select: { name: true, garmentType: true } } },
      });
      res.json(items);
    } catch (err) {
      next(err);
    }
  }
);

customWearRouter.patch(
  '/admin/custom-orders/:id',
  requireAdminAuth,
  requirePermission('orders:write'),
  async (req, res, next) => {
    try {
      const { status, internalNotes } = req.body as {
        status?: string;
        internalNotes?: string;
      };
      const updated = await prisma.customOrderRequest.update({
        where: { id: req.params.id },
        data: {
          ...(status !== undefined ? { status } : {}),
          ...(internalNotes !== undefined ? { internalNotes } : {}),
        },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// Admin: manage customizable garment templates
customWearRouter.get(
  '/admin/custom-templates',
  requireAdminAuth,
  requirePermission('products:read'),
  async (_req, res, next) => {
    try {
      res.json(
        await prisma.customWearTemplate.findMany({
          orderBy: { displayOrder: 'asc' },
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

customWearRouter.post(
  '/admin/custom-templates',
  requireAdminAuth,
  requirePermission('products:write'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await prisma.customWearTemplate.create({ data: req.body })
      );
    } catch (err) {
      next(err);
    }
  }
);

customWearRouter.patch(
  '/admin/custom-templates/:id',
  requireAdminAuth,
  requirePermission('products:write'),
  async (req, res, next) => {
    try {
      res.json(
        await prisma.customWearTemplate.update({
          where: { id: req.params.id },
          data: req.body,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);
