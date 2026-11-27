import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import {
  checkoutSchema,
  trackOrderSchema,
  ORDER_STATUS_LABELS,
  OrderStatus,
} from '@matina/shared';
import { prisma } from '../lib/prisma';
import {
  calculateDeliveryFee,
  resolveProductPrice,
  validateAndComputeCoupon,
} from '../lib/pricing';

export const cartCheckoutRouter = Router();

const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many tracking attempts. Please try again later.' },
});

function getOrCreateSessionToken(req: Request, res: Response): string {
  const existing =
    req.cookies?.matina_cart_sid ||
    (req.headers['x-cart-session'] as string | undefined);
  if (existing && existing.length >= 16) {
    return existing;
  }
  const token = crypto.randomBytes(24).toString('hex');
  res.cookie('matina_cart_sid', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return token;
}

async function buildCartResponse(sessionToken: string) {
  const cart = await prisma.cart.findUnique({
    where: { sessionToken },
    include: {
      items: {
        include: {
          variant: {
            include: {
              inventory: true,
              product: {
                include: {
                  images: { orderBy: { displayOrder: 'asc' }, take: 1 },
                  offers: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return { sessionToken, items: [], subtotalNpr: 0, itemCount: 0, hasOfferItems: false };
  }

  let subtotalNpr = 0;
  let itemCount = 0;
  let hasOfferItems = false;

  const items = cart.items.map((item) => {
    const v = item.variant;
    const p = v.product;
    const pricing = resolveProductPrice(
      p.basePriceNpr,
      v.priceOverrideNpr,
      p.offers,
      v.id
    );
    const availableQty = v.inventory?.availableQty ?? 0;
    const lineTotalNpr = pricing.effectivePriceNpr * item.quantity;

    subtotalNpr += lineTotalNpr;
    itemCount += item.quantity;
    if (pricing.hasActiveOffer) hasOfferItems = true;

    return {
      id: item.id,
      variantId: v.id,
      productId: p.id,
      productName: p.name,
      productSlug: p.slug,
      imageUrl: p.images[0]?.url ?? null,
      colourName: v.colourName,
      colourHex: v.colourHex,
      size: v.size,
      sku: v.sku,
      quantity: item.quantity,
      availableQty,
      inStock: availableQty >= item.quantity,
      ...pricing,
      lineTotalNpr,
    };
  });

  return { sessionToken, items, subtotalNpr, itemCount, hasOfferItems };
}

cartCheckoutRouter.get('/cart', async (req, res, next) => {
  try {
    const token = getOrCreateSessionToken(req, res);
    const cart = await buildCartResponse(token);
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

cartCheckoutRouter.post('/cart/items', async (req, res, next) => {
  try {
    const token = getOrCreateSessionToken(req, res);
    const { variantId, quantity = 1 } = req.body as {
      variantId?: string;
      quantity?: number;
    };

    if (!variantId || quantity < 1) {
      return res.status(400).json({ error: 'Valid variantId and quantity required' });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true, product: true },
    });

    if (!variant || !variant.isActive || variant.product.status !== 'published') {
      return res.status(404).json({ error: 'Product variant not available' });
    }

    const available = variant.inventory?.availableQty ?? 0;
    const cart = await prisma.cart.upsert({
      where: { sessionToken: token },
      update: {},
      create: { sessionToken: token },
    });

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });

    const targetQty = (existingItem?.quantity ?? 0) + quantity;
    if (targetQty > available) {
      return res.status(400).json({
        error: `Only ${available} unit(s) available in stock for ${variant.colourName} / ${variant.size}`,
      });
    }

    await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      update: { quantity: targetQty },
      create: { cartId: cart.id, variantId, quantity },
    });

    const updated = await buildCartResponse(token);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

cartCheckoutRouter.patch('/cart/items/:id', async (req, res, next) => {
  try {
    const token = getOrCreateSessionToken(req, res);
    const { quantity } = req.body as { quantity?: number };
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const item = await prisma.cartItem.findUnique({
      where: { id: req.params.id },
      include: { cart: true, variant: { include: { inventory: true } } },
    });

    if (!item || item.cart.sessionToken !== token) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      const available = item.variant.inventory?.availableQty ?? 0;
      if (quantity > available) {
        return res.status(400).json({
          error: `Only ${available} unit(s) available in stock`,
        });
      }
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity },
      });
    }

    const updated = await buildCartResponse(token);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

cartCheckoutRouter.delete('/cart/items/:id', async (req, res, next) => {
  try {
    const token = getOrCreateSessionToken(req, res);
    const item = await prisma.cartItem.findUnique({
      where: { id: req.params.id },
      include: { cart: true },
    });
    if (item && item.cart.sessionToken === token) {
      await prisma.cartItem.delete({ where: { id: item.id } });
    }
    const updated = await buildCartResponse(token);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

cartCheckoutRouter.post('/checkout/validate-coupon', async (req, res, next) => {
  try {
    const token = getOrCreateSessionToken(req, res);
    const { code } = req.body as { code?: string };
    const cart = await buildCartResponse(token);
    if (cart.items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }
    const result = await validateAndComputeCoupon(
      code ?? '',
      cart.subtotalNpr,
      cart.hasOfferItems
    );
    if (!result.valid) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

cartCheckoutRouter.post('/checkout/delivery-fee', async (req, res, next) => {
  try {
    const token = getOrCreateSessionToken(req, res);
    const { province = '', district = '' } = req.body as {
      province?: string;
      district?: string;
    };
    const cart = await buildCartResponse(token);
    const deliveryFeeNpr = await calculateDeliveryFee(
      province,
      district,
      cart.subtotalNpr
    );
    res.json({ deliveryFeeNpr });
  } catch (err) {
    next(err);
  }
});

cartCheckoutRouter.post('/orders', async (req, res, next) => {
  try {
    const token = getOrCreateSessionToken(req, res);
    const input = checkoutSchema.parse(req.body);

    // Idempotency check to prevent duplicate order on repeated clicks
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { items: true, history: true },
    });
    if (existingOrder) {
      return res.status(200).json(existingOrder);
    }

    const cart = await prisma.cart.findUnique({
      where: { sessionToken: token },
      include: { items: true },
    });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Your shopping cart is empty' });
    }

    const createdOrder = await prisma.$transaction(async (tx) => {
      let subtotalNpr = 0;
      let hasOfferItems = false;

      const orderItemsData: Array<{
        productId: string;
        variantId: string;
        productNameSnapshot: string;
        colourSnapshot: string;
        sizeSnapshot: string;
        skuSnapshot: string;
        regularPriceSnapshot: number;
        unitPriceSnapshot: number;
        quantity: number;
        lineTotalNpr: number;
      }> = [];

      // Lock inventory rows in deterministic order to avoid deadlocks
      const sortedCartItems = [...cart.items].sort((a, b) =>
        a.variantId.localeCompare(b.variantId)
      );

      for (const cartItem of sortedCartItems) {
        const lockedRows = await tx.$queryRaw<
          Array<{ variant_id: string; available_qty: number }>
        >`SELECT variant_id, available_qty FROM inventory WHERE variant_id = ${cartItem.variantId} FOR UPDATE`;

        const inv = lockedRows[0];
        if (!inv || inv.available_qty < cartItem.quantity) {
          throw Object.assign(
            new Error('Insufficient stock for one or more items in your cart. Please review your cart.'),
            { status: 409 }
          );
        }

        const variant = await tx.productVariant.findUniqueOrThrow({
          where: { id: cartItem.variantId },
          include: {
            product: { include: { offers: true } },
          },
        });

        const pricing = resolveProductPrice(
          variant.product.basePriceNpr,
          variant.priceOverrideNpr,
          variant.product.offers,
          variant.id
        );

        if (pricing.hasActiveOffer) hasOfferItems = true;
        const lineTotalNpr = pricing.effectivePriceNpr * cartItem.quantity;
        subtotalNpr += lineTotalNpr;

        await tx.inventory.update({
          where: { variantId: variant.id },
          data: { availableQty: { decrement: cartItem.quantity } },
        });

        await tx.product.update({
          where: { id: variant.productId },
          data: { salesCount: { increment: cartItem.quantity } },
        });

        orderItemsData.push({
          productId: variant.productId,
          variantId: variant.id,
          productNameSnapshot: variant.product.name,
          colourSnapshot: variant.colourName,
          sizeSnapshot: variant.size,
          skuSnapshot: variant.sku,
          regularPriceSnapshot: pricing.regularPriceNpr,
          unitPriceSnapshot: pricing.effectivePriceNpr,
          quantity: cartItem.quantity,
          lineTotalNpr,
        });
      }

      // Coupon validation & discount
      let discountNpr = 0;
      let appliedCouponCode: string | null = null;
      if (input.couponCode) {
        const couponRes = await validateAndComputeCoupon(
          input.couponCode,
          subtotalNpr,
          hasOfferItems
        );
        if (!couponRes.valid) {
          throw Object.assign(new Error(couponRes.message), { status: 400 });
        }
        discountNpr = couponRes.discountNpr;
        appliedCouponCode = couponRes.code;

        await tx.coupon.update({
          where: { code: appliedCouponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      const deliveryFeeNpr = await calculateDeliveryFee(
        input.province,
        input.district,
        subtotalNpr - discountNpr
      );
      const totalNpr = Math.max(0, subtotalNpr - discountNpr + deliveryFeeNpr);

      const orderNumber = `MTN-${new Date().getFullYear()}-${Math.floor(
        100000 + Math.random() * 900000
      )}`;

      // Upsert customer record by phone
      const customer = await tx.customer.upsert({
        where: { phone: input.phone },
        update: {
          fullName: input.customerName,
          ...(input.email ? { email: input.email } : {}),
        },
        create: {
          fullName: input.customerName,
          phone: input.phone,
          email: input.email || null,
        },
      });

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          customerName: input.customerName,
          phone: input.phone,
          email: input.email || null,
          province: input.province,
          district: input.district,
          municipality: input.municipality,
          wardNo: input.wardNo,
          streetTole: input.streetTole,
          deliveryNotes: input.deliveryNotes || null,
          subtotalNpr,
          discountNpr,
          couponCode: appliedCouponCode,
          deliveryFeeNpr,
          totalNpr,
          paymentMethod: 'COD',
          status: 'confirmed',
          idempotencyKey: input.idempotencyKey,
          items: { create: orderItemsData },
          history: {
            create: {
              status: 'confirmed',
              note: 'Order placed via Cash on Delivery',
            },
          },
        },
        include: { items: true, history: true },
      });

      // Log inventory movements
      for (const item of orderItemsData) {
        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            delta: -item.quantity,
            reason: 'order_placed',
            note: `Order ${order.orderNumber}`,
            orderId: order.id,
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });

    res.status(201).json(createdOrder);
  } catch (err) {
    next(err);
  }
});

cartCheckoutRouter.post('/orders/track', trackLimiter, async (req, res, next) => {
  try {
    const { orderNumber, phone } = trackOrderSchema.parse(req.body);

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: { equals: orderNumber.trim(), mode: 'insensitive' },
        phone,
      },
      include: {
        items: {
          select: {
            productNameSnapshot: true,
            colourSnapshot: true,
            sizeSnapshot: true,
            quantity: true,
            lineTotalNpr: true,
          },
        },
        history: {
          orderBy: { createdAt: 'asc' },
          select: {
            status: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        error: 'No order found matching that Order Number and Phone Number',
      });
    }

    // Do not expose private street address or internal notes
    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: ORDER_STATUS_LABELS[order.status as OrderStatus],
      paymentMethod: order.paymentMethod,
      totalNpr: order.totalNpr,
      district: order.district,
      province: order.province,
      createdAt: order.createdAt,
      items: order.items,
      timeline: order.history.map((h) => ({
        status: h.status,
        statusLabel: ORDER_STATUS_LABELS[h.status as OrderStatus],
        note: h.note,
        createdAt: h.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});
