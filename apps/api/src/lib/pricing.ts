import { calculateDiscountPercent } from '@matina/shared';
import { prisma } from './prisma';

export interface ResolvedPrice {
  regularPriceNpr: number;
  effectivePriceNpr: number;
  offerPriceNpr: number | null;
  discountPercent: number;
  hasActiveOffer: boolean;
}

export function resolveProductPrice(
  basePriceNpr: number,
  priceOverrideNpr: number | null | undefined,
  offers: Array<{
    variantId: string | null;
    offerPriceNpr: number;
    startsAt: Date;
    endsAt: Date | null;
    isActive: boolean;
  }>,
  variantId?: string
): ResolvedPrice {
  const regularPriceNpr = priceOverrideNpr ?? basePriceNpr;
  const now = new Date();

  const activeOffers = offers.filter(
    (o) =>
      o.isActive &&
      o.startsAt <= now &&
      (o.endsAt === null || o.endsAt >= now) &&
      (o.variantId === null || o.variantId === variantId)
  );

  // Prefer variant-specific offer, otherwise lowest active offer
  const variantOffer = variantId
    ? activeOffers.find((o) => o.variantId === variantId)
    : undefined;
  const chosenOffer =
    variantOffer ??
    activeOffers.sort((a, b) => a.offerPriceNpr - b.offerPriceNpr)[0];

  if (chosenOffer && chosenOffer.offerPriceNpr < regularPriceNpr) {
    return {
      regularPriceNpr,
      effectivePriceNpr: chosenOffer.offerPriceNpr,
      offerPriceNpr: chosenOffer.offerPriceNpr,
      discountPercent: calculateDiscountPercent(
        regularPriceNpr,
        chosenOffer.offerPriceNpr
      ),
      hasActiveOffer: true,
    };
  }

  return {
    regularPriceNpr,
    effectivePriceNpr: regularPriceNpr,
    offerPriceNpr: null,
    discountPercent: 0,
    hasActiveOffer: false,
  };
}

export async function calculateDeliveryFee(
  province: string,
  district: string,
  subtotalNpr: number
): Promise<number> {
  const rules = await prisma.shippingRule.findMany({
    where: { isActive: true },
  });

  // Precedence: district -> province -> flat
  const districtRule = rules.find(
    (r) =>
      r.ruleType === 'district' &&
      r.district?.toLowerCase() === district.toLowerCase()
  );
  const provinceRule = rules.find(
    (r) =>
      r.ruleType === 'province' &&
      r.province?.toLowerCase() === province.toLowerCase()
  );
  const flatRule = rules.find((r) => r.ruleType === 'flat');

  const rule = districtRule ?? provinceRule ?? flatRule;
  if (!rule) return 0;

  if (
    rule.freeShippingThresholdNpr !== null &&
    subtotalNpr >= rule.freeShippingThresholdNpr
  ) {
    return 0;
  }

  return rule.feeNpr;
}

export async function validateAndComputeCoupon(
  code: string,
  subtotalNpr: number,
  hasOfferItems: boolean
): Promise<{ valid: true; discountNpr: number; code: string } | { valid: false; message: string }> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { valid: false, message: 'Coupon code is required' };

  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  const now = new Date();

  if (!coupon || !coupon.isActive) {
    return { valid: false, message: 'Invalid or inactive coupon code' };
  }
  if (coupon.startsAt > now) {
    return { valid: false, message: 'This coupon is not active yet' };
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return { valid: false, message: 'This coupon has expired' };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: 'This coupon has reached its usage limit' };
  }
  if (subtotalNpr < coupon.minOrderNpr) {
    return {
      valid: false,
      message: `Minimum order of Rs. ${coupon.minOrderNpr.toLocaleString('en-IN')} required`,
    };
  }
  if (!coupon.combinableWithOffer && hasOfferItems) {
    return {
      valid: false,
      message: 'This coupon cannot be combined with items already on offer',
    };
  }

  let discountNpr = 0;
  if (coupon.discountType === 'percentage') {
    discountNpr = Math.round((subtotalNpr * coupon.discountValue) / 100);
  } else {
    discountNpr = coupon.discountValue;
  }

  discountNpr = Math.max(0, Math.min(discountNpr, subtotalNpr));
  return { valid: true, discountNpr, code: coupon.code };
}
