import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAdminAuth, requirePermission } from '../middleware/auth';

export const adminCatalogueRouter = Router();
adminCatalogueRouter.use(requireAdminAuth);

// Dashboard KPIs
adminCatalogueRouter.get(
  '/dashboard',
  requirePermission('dashboard:read'),
  async (req, res, next) => {
    try {
      const range = (req.query.range as string) || 'month';
      const now = new Date();
      let since = new Date(now.getFullYear(), now.getMonth(), 1);
      if (range === 'today') {
        since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (range === 'week') {
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (range === 'all') {
        since = new Date(0);
      }

      const [
        totalOrders,
        pendingOrders,
        revenueAgg,
        recentOrders,
        bestsellers,
        inventoryRows,
      ] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: since } } }),
        prisma.order.count({
          where: { status: { in: ['confirmed', 'processing', 'packed'] } },
        }),
        prisma.order.aggregate({
          where: {
            createdAt: { gte: since },
            status: { notIn: ['cancelled', 'returned'] },
          },
          _sum: { totalNpr: true },
        }),
        prisma.order.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            phone: true,
            totalNpr: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.product.findMany({
          where: { status: 'published' },
          orderBy: { salesCount: 'desc' },
          take: 5,
          select: { id: true, name: true, slug: true, salesCount: true, basePriceNpr: true },
        }),
        prisma.inventory.findMany({
          include: {
            variant: {
              include: { product: { select: { name: true, slug: true } } },
            },
          },
        }),
      ]);

      const outOfStock = inventoryRows.filter((r) => r.availableQty <= 0);
      const lowStock = inventoryRows.filter(
        (r) => r.availableQty > 0 && r.availableQty <= r.lowStockThreshold
      );

      res.json({
        totalOrders,
        pendingOrders,
        totalRevenueNpr: revenueAgg._sum.totalNpr ?? 0,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        lowStockVariants: lowStock.slice(0, 10),
        outOfStockVariants: outOfStock.slice(0, 10),
        bestsellers,
        recentOrders,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Categories CRUD
adminCatalogueRouter.get(
  '/categories',
  requirePermission('categories:read'),
  async (_req, res, next) => {
    try {
      const items = await prisma.category.findMany({
        orderBy: { displayOrder: 'asc' },
        include: { _count: { select: { products: true } } },
      });
      res.json(items);
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.post(
  '/categories',
  requirePermission('categories:write'),
  async (req, res, next) => {
    try {
      const item = await prisma.category.create({ data: req.body });
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.patch(
  '/categories/:id',
  requirePermission('categories:write'),
  async (req, res, next) => {
    try {
      const item = await prisma.category.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json(item);
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.delete(
  '/categories/:id',
  requirePermission('categories:write'),
  async (req, res, next) => {
    try {
      await prisma.category.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// Collections CRUD
adminCatalogueRouter.get(
  '/collections',
  requirePermission('collections:read'),
  async (_req, res, next) => {
    try {
      const items = await prisma.collection.findMany({
        orderBy: { displayOrder: 'asc' },
        include: { _count: { select: { products: true } } },
      });
      res.json(items);
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.post(
  '/collections',
  requirePermission('collections:write'),
  async (req, res, next) => {
    try {
      const item = await prisma.collection.create({ data: req.body });
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.patch(
  '/collections/:id',
  requirePermission('collections:write'),
  async (req, res, next) => {
    try {
      const item = await prisma.collection.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json(item);
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.delete(
  '/collections/:id',
  requirePermission('collections:write'),
  async (req, res, next) => {
    try {
      await prisma.collection.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// Products CRUD
adminCatalogueRouter.get(
  '/products',
  requirePermission('products:read'),
  async (req, res, next) => {
    try {
      const q = (req.query.q as string) || '';
      const items = await prisma.product.findMany({
        where: q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { skuPrefix: { contains: q, mode: 'insensitive' } },
              ],
            }
          : undefined,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          category: { select: { id: true, name: true } },
          collections: { include: { collection: { select: { id: true, name: true } } } },
          images: { orderBy: { displayOrder: 'asc' } },
          variants: { include: { inventory: true } },
          offers: true,
        },
      });
      res.json(items);
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.post(
  '/products',
  requirePermission('products:write'),
  async (req, res, next) => {
    try {
      const {
        collectionIds = [],
        images = [],
        variants = [],
        ...productData
      } = req.body;

      const created = await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            ...productData,
            collections: {
              create: (collectionIds as string[]).map((cid) => ({
                collectionId: cid,
              })),
            },
            images: {
              create: images,
            },
          },
        });

        for (const v of variants) {
          const { initialQty = 0, lowStockThreshold = 5, ...variantData } = v;
          const variant = await tx.productVariant.create({
            data: { ...variantData, productId: product.id },
          });
          await tx.inventory.create({
            data: {
              variantId: variant.id,
              availableQty: initialQty,
              lowStockThreshold,
            },
          });
          await tx.inventoryMovement.create({
            data: {
              variantId: variant.id,
              delta: initialQty,
              reason: 'opening_stock',
              note: 'Product created',
              adminUserId: req.admin?.sub,
            },
          });
        }

        return product;
      });

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.patch(
  '/products/:id',
  requirePermission('products:write'),
  async (req, res, next) => {
    try {
      const { collectionIds, images, ...productData } = req.body;
      const updated = await prisma.$transaction(async (tx) => {
        if (Array.isArray(collectionIds)) {
          await tx.productCollection.deleteMany({
            where: { productId: req.params.id },
          });
          await tx.productCollection.createMany({
            data: collectionIds.map((cid: string) => ({
              productId: req.params.id,
              collectionId: cid,
            })),
          });
        }
        if (Array.isArray(images)) {
          await tx.productImage.deleteMany({
            where: { productId: req.params.id },
          });
          if (images.length > 0) {
            await tx.productImage.createMany({
              data: images.map((img: any, idx: number) => ({
                productId: req.params.id,
                url: img.url,
                altText: img.altText || productData.name || '',
                imageType: img.imageType || (idx === 0 ? 'front' : 'lifestyle'),
                displayOrder: idx,
              })),
            });
          }
        }
        return tx.product.update({
          where: { id: req.params.id },
          data: productData,
        });
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.delete(
  '/products/:id',
  requirePermission('products:write'),
  async (req, res, next) => {
    try {
      await prisma.product.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.post(
  '/products/:id/variants',
  requirePermission('products:write'),
  async (req, res, next) => {
    try {
      const { initialQty = 0, lowStockThreshold = 5, ...variantData } = req.body;
      const created = await prisma.$transaction(async (tx) => {
        const variant = await tx.productVariant.create({
          data: { ...variantData, productId: req.params.id },
        });
        await tx.inventory.create({
          data: { variantId: variant.id, availableQty: initialQty, lowStockThreshold },
        });
        await tx.inventoryMovement.create({
          data: {
            variantId: variant.id,
            delta: initialQty,
            reason: 'opening_stock',
            adminUserId: req.admin?.sub,
          },
        });
        return variant;
      });
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.post(
  '/products/:id/images',
  requirePermission('products:write'),
  async (req, res, next) => {
    try {
      const image = await prisma.productImage.create({
        data: { ...req.body, productId: req.params.id },
      });
      res.status(201).json(image);
    } catch (err) {
      next(err);
    }
  }
);

// Inventory & Stock Management
adminCatalogueRouter.get(
  '/inventory',
  requirePermission('inventory:read'),
  async (req, res, next) => {
    try {
      const filter = req.query.filter as string | undefined;
      const rows = await prisma.inventory.findMany({
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true, slug: true, status: true } },
            },
          },
        },
        orderBy: { availableQty: 'asc' },
      });

      const filtered =
        filter === 'low'
          ? rows.filter((r) => r.availableQty > 0 && r.availableQty <= r.lowStockThreshold)
          : filter === 'out'
          ? rows.filter((r) => r.availableQty <= 0)
          : rows;

      res.json(filtered);
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.post(
  '/inventory/adjust',
  requirePermission('inventory:write'),
  async (req, res, next) => {
    try {
      const { variantId, delta, reason = 'manual_adjustment', note = '' } = req.body as {
        variantId: string;
        delta: number;
        reason?: 'restock' | 'manual_adjustment' | 'opening_stock';
        note?: string;
      };

      const result = await prisma.$transaction(async (tx) => {
        const inv = await tx.inventory.findUniqueOrThrow({ where: { variantId } });
        const nextQty = inv.availableQty + delta;
        if (nextQty < 0) {
          throw Object.assign(new Error('Stock cannot be negative'), { status: 400 });
        }
        const updated = await tx.inventory.update({
          where: { variantId },
          data: { availableQty: nextQty },
        });
        await tx.inventoryMovement.create({
          data: {
            variantId,
            delta,
            reason,
            note,
            adminUserId: req.admin?.sub,
          },
        });
        return updated;
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.get(
  '/inventory/movements',
  requirePermission('inventory:read'),
  async (_req, res, next) => {
    try {
      const movements = await prisma.inventoryMovement.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          variant: {
            include: { product: { select: { name: true } } },
          },
          adminUser: { select: { name: true, email: true } },
        },
      });
      res.json(movements);
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.get(
  '/inventory/export',
  requirePermission('inventory:read'),
  async (_req, res, next) => {
    try {
      const rows = await prisma.inventory.findMany({
        include: { variant: { include: { product: true } } },
      });
      const header = 'SKU,Product,Colour,Size,AvailableQty,LowStockThreshold\n';
      const csv =
        header +
        rows
          .map(
            (r) =>
              `"${r.variant.sku}","${r.variant.product.name.replace(/"/g, '""')}","${r.variant.colourName}","${r.variant.size}",${r.availableQty},${r.lowStockThreshold}`
          )
          .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="matina-inventory.csv"');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }
);

// Color Presets CRUD
adminCatalogueRouter.get(
  '/color-presets',
  requirePermission('products:read'),
  async (_req, res, next) => {
    try {
      res.json(
        await prisma.colorPreset.findMany({ orderBy: { name: 'asc' } })
      );
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.post(
  '/color-presets',
  requirePermission('products:write'),
  async (req, res, next) => {
    try {
      const { name, hex } = req.body as { name: string; hex: string };
      const created = await prisma.colorPreset.create({
        data: { name: name.trim(), hex },
      });
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.patch(
  '/color-presets/:id',
  requirePermission('products:write'),
  async (req, res, next) => {
    try {
      const { name, hex } = req.body as { name?: string; hex?: string };
      const updated = await prisma.colorPreset.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(hex !== undefined ? { hex } : {}),
        },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogueRouter.delete(
  '/color-presets/:id',
  requirePermission('products:write'),
  async (req, res, next) => {
    try {
      await prisma.colorPreset.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);
