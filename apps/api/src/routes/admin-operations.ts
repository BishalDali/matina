import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import sharp from 'sharp';
import { orderStatusUpdateSchema } from '@matina/shared';
import { prisma } from '../lib/prisma';
import { requireAdminAuth, requirePermission } from '../middleware/auth';

export const adminOperationsRouter = Router();
adminOperationsRouter.use(requireAdminAuth);

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(
        file.mimetype
      )
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and SVG images are allowed'));
    }
  },
});

adminOperationsRouter.post(
  '/uploads',
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }
      const baseUrl = process.env.API_PUBLIC_URL || 'http://localhost:4000';

      if (req.file.mimetype === 'image/svg+xml') {
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.svg`;
        const outPath = path.join(uploadDir, filename);
        fs.writeFileSync(outPath, req.file.buffer);
        return res.status(201).json({ url: `${baseUrl}/uploads/${filename}` });
      }

      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      const outPath = path.join(uploadDir, filename);

      await sharp(req.file.buffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outPath);

      res.status(201).json({ url: `${baseUrl}/uploads/${filename}` });
    } catch (err) {
      next(err);
    }
  }
);

// Orders Management
adminOperationsRouter.get(
  '/orders',
  requirePermission('orders:read'),
  async (req, res, next) => {
    try {
      const { q, status } = req.query as { q?: string; status?: string };
      const orders = await prisma.order.findMany({
        where: {
          ...(status ? { status: status as any } : {}),
          ...(q
            ? {
                OR: [
                  { orderNumber: { contains: q, mode: 'insensitive' } },
                  { customerName: { contains: q, mode: 'insensitive' } },
                  { phone: { contains: q } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      });
      res.json(orders);
    } catch (err) {
      next(err);
    }
  }
);

adminOperationsRouter.get(
  '/orders/:id',
  requirePermission('orders:read'),
  async (req, res, next) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          items: true,
          history: {
            orderBy: { createdAt: 'asc' },
            include: { changedByAdmin: { select: { name: true, email: true } } },
          },
        },
      });
      if (!order) return res.status(404).json({ error: 'Order not found' });
      res.json(order);
    } catch (err) {
      next(err);
    }
  }
);

adminOperationsRouter.patch(
  '/orders/:id/status',
  requirePermission('orders:write'),
  async (req, res, next) => {
    try {
      const { status, note } = orderStatusUpdateSchema.parse(req.body);

      const updated = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUniqueOrThrow({
          where: { id: req.params.id },
          include: { items: true },
        });

        const isRestockTransition =
          ['cancelled', 'returned'].includes(status) &&
          !['cancelled', 'returned'].includes(order.status);

        if (isRestockTransition) {
          for (const item of order.items) {
            if (!item.variantId) continue;
            await tx.inventory.update({
              where: { variantId: item.variantId },
              data: { availableQty: { increment: item.quantity } },
            });
            await tx.inventoryMovement.create({
              data: {
                variantId: item.variantId,
                delta: item.quantity,
                reason: status === 'cancelled' ? 'order_cancelled' : 'delivery_failed',
                note: `Order ${order.orderNumber}: ${note || status}`,
                orderId: order.id,
                adminUserId: req.admin?.sub,
              },
            });
          }
        }

        const nextOrder = await tx.order.update({
          where: { id: order.id },
          data: { status },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status,
            note: note || null,
            changedByAdminId: req.admin?.sub,
          },
        });

        return nextOrder;
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

adminOperationsRouter.patch(
  '/orders/:id/notes',
  requirePermission('orders:write'),
  async (req, res, next) => {
    try {
      const { internalNotes } = req.body as { internalNotes: string };
      const order = await prisma.order.update({
        where: { id: req.params.id },
        data: { internalNotes },
      });
      res.json(order);
    } catch (err) {
      next(err);
    }
  }
);

// Offers & Coupons
adminOperationsRouter.get('/offers', requirePermission('offers:read'), async (_req, res, next) => {
  try {
    const offers = await prisma.productOffer.findMany({
      include: { product: { select: { name: true, basePriceNpr: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(offers);
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.post('/offers', requirePermission('offers:write'), async (req, res, next) => {
  try {
    const offer = await prisma.productOffer.create({ data: req.body });
    res.status(201).json(offer);
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.delete('/offers/:id', requirePermission('offers:write'), async (req, res, next) => {
  try {
    await prisma.productOffer.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.get('/coupons', requirePermission('coupons:read'), async (_req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(coupons);
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.post('/coupons', requirePermission('coupons:write'), async (req, res, next) => {
  try {
    const coupon = await prisma.coupon.create({
      data: { ...req.body, code: String(req.body.code).trim().toUpperCase() },
    });
    res.status(201).json(coupon);
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.patch('/coupons/:id', requirePermission('coupons:write'), async (req, res, next) => {
  try {
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(coupon);
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.delete('/coupons/:id', requirePermission('coupons:write'), async (req, res, next) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Banners & Homepage Sections
adminOperationsRouter.get('/banners', requirePermission('banners:read'), async (_req, res, next) => {
  try {
    const banners = await prisma.banner.findMany({ orderBy: { displayOrder: 'asc' } });
    res.json(banners);
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.post('/banners', requirePermission('banners:write'), async (req, res, next) => {
  try {
    const banner = await prisma.banner.create({ data: req.body });
    res.status(201).json(banner);
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.patch('/banners/:id', requirePermission('banners:write'), async (req, res, next) => {
  try {
    const banner = await prisma.banner.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(banner);
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.delete('/banners/:id', requirePermission('banners:write'), async (req, res, next) => {
  try {
    await prisma.banner.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.get('/sections', requirePermission('sections:read'), async (_req, res, next) => {
  try {
    const sections = await prisma.homepageSection.findMany({ orderBy: { displayOrder: 'asc' } });
    res.json(sections);
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.patch('/sections/:id', requirePermission('sections:write'), async (req, res, next) => {
  try {
    const section = await prisma.homepageSection.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(section);
  } catch (err) {
    next(err);
  }
});

// Instagram, Shipping, Customers, Pages, Settings
adminOperationsRouter.get('/instagram', requirePermission('instagram:read'), async (_req, res, next) => {
  try {
    res.json(await prisma.instagramPost.findMany({ orderBy: { displayOrder: 'asc' } }));
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.post('/instagram', requirePermission('instagram:write'), async (req, res, next) => {
  try {
    res.status(201).json(await prisma.instagramPost.create({ data: req.body }));
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.delete('/instagram/:id', requirePermission('instagram:write'), async (req, res, next) => {
  try {
    await prisma.instagramPost.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.get('/customers', requirePermission('customers:read'), async (_req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { orders: true } } },
    });
    res.json(customers);
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.get('/shipping-rules', requirePermission('*'), async (_req, res, next) => {
  try {
    res.json(await prisma.shippingRule.findMany());
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.post('/shipping-rules', requirePermission('*'), async (req, res, next) => {
  try {
    res.status(201).json(await prisma.shippingRule.create({ data: req.body }));
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.get('/pages', requirePermission('pages:read'), async (_req, res, next) => {
  try {
    res.json(await prisma.contentPage.findMany({ orderBy: { updatedAt: 'desc' } }));
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.post('/pages', requirePermission('pages:write'), async (req, res, next) => {
  try {
    res.status(201).json(await prisma.contentPage.create({ data: req.body }));
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.patch('/pages/:id', requirePermission('pages:write'), async (req, res, next) => {
  try {
    res.json(
      await prisma.contentPage.update({
        where: { id: req.params.id },
        data: req.body,
      })
    );
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.get('/settings', requirePermission('*'), async (_req, res, next) => {
  try {
    res.json(await prisma.siteSetting.findMany());
  } catch (err) {
    next(err);
  }
});

adminOperationsRouter.put('/settings/:key', requirePermission('*'), async (req, res, next) => {
  try {
    const setting = await prisma.siteSetting.upsert({
      where: { key: req.params.key },
      update: { valueJson: req.body.valueJson },
      create: { key: req.params.key, valueJson: req.body.valueJson },
    });
    res.json(setting);
  } catch (err) {
    next(err);
  }
});
