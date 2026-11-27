'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  NEPAL_DISTRICTS_BY_PROVINCE,
  NEPAL_PROVINCES,
  formatNPR,
} from '@matina/shared';
import { apiFetch } from '@/lib/api';
import { useCart } from '@/components/CartContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, refreshCart } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState<string>('Bagmati');
  const [district, setDistrict] = useState<string>('Kathmandu');
  const [municipality, setMunicipality] = useState('');
  const [wardNo, setWardNo] = useState('');
  const [streetTole, setStreetTole] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountNpr: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  const [deliveryFeeNpr, setDeliveryFeeNpr] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [idempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    apiFetch<{ deliveryFeeNpr: number }>('/checkout/delivery-fee', {
      method: 'POST',
      body: JSON.stringify({ province, district }),
    })
      .then((res) => setDeliveryFeeNpr(res.deliveryFeeNpr))
      .catch(() => {});
  }, [province, district, cart.subtotalNpr]);

  const handleProvinceChange = (nextProvince: string) => {
    setProvince(nextProvince);
    const districts = NEPAL_DISTRICTS_BY_PROVINCE[nextProvince] || [];
    setDistrict(districts[0] || '');
  };

  const applyCoupon = async () => {
    setCouponError('');
    try {
      const res = await apiFetch<{ valid: boolean; code: string; discountNpr: number }>(
        '/checkout/validate-coupon',
        { method: 'POST', body: JSON.stringify({ code: couponInput }) }
      );
      setAppliedCoupon({ code: res.code, discountNpr: res.discountNpr });
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : 'Invalid coupon');
    }
  };

  const discountNpr = appliedCoupon?.discountNpr ?? 0;
  const totalPayable = Math.max(0, cart.subtotalNpr - discountNpr + deliveryFeeNpr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const order = await apiFetch<{ orderNumber: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName,
          phone,
          email,
          province,
          district,
          municipality,
          wardNo,
          streetTole,
          deliveryNotes,
          couponCode: appliedCoupon?.code || '',
          idempotencyKey,
        }),
      });
      await refreshCart();
      router.push(`/order-confirmation/${order.orderNumber}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not place order');
      setSubmitting(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-serif text-3xl">Your bag is empty</h1>
        <p className="mt-2 text-sm text-charcoal/70">Add items to your bag before checking out.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl font-medium text-charcoal">
        Checkout — Cash on Delivery
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="border border-cream bg-ivory p-6">
            <h2 className="font-serif text-2xl">Contact Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider">Full Name *</label>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1.5 w-full border border-cream bg-ivory px-3.5 py-2.5 text-sm"
                  placeholder="Sita Maharjan"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider">Mobile Number *</label>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 w-full border border-cream bg-ivory px-3.5 py-2.5 text-sm"
                  placeholder="98XXXXXXXX"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full border border-cream bg-ivory px-3.5 py-2.5 text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>
          </div>

          <div className="border border-cream bg-ivory p-6">
            <h2 className="font-serif text-2xl">Delivery Address (Nepal)</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider">Province *</label>
                <select
                  value={province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="mt-1.5 w-full border border-cream bg-ivory px-3.5 py-2.5 text-sm"
                >
                  {NEPAL_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider">District *</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="mt-1.5 w-full border border-cream bg-ivory px-3.5 py-2.5 text-sm"
                >
                  {(NEPAL_DISTRICTS_BY_PROVINCE[province] || []).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider">
                  Municipality / Rural Municipality *
                </label>
                <input
                  required
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  className="mt-1.5 w-full border border-cream bg-ivory px-3.5 py-2.5 text-sm"
                  placeholder="Lalitpur Metropolitan City"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider">Ward Number *</label>
                <input
                  required
                  value={wardNo}
                  onChange={(e) => setWardNo(e.target.value)}
                  className="mt-1.5 w-full border border-cream bg-ivory px-3.5 py-2.5 text-sm"
                  placeholder="16"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider">Street / Tole *</label>
                <input
                  required
                  value={streetTole}
                  onChange={(e) => setStreetTole(e.target.value)}
                  className="mt-1.5 w-full border border-cream bg-ivory px-3.5 py-2.5 text-sm"
                  placeholder="Mangalbazar, near Patan Museum"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider">
                  Delivery Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="mt-1.5 w-full border border-cream bg-ivory px-3.5 py-2 text-sm"
                  placeholder="Call before arriving..."
                />
              </div>
            </div>
          </div>

          <div className="border border-cream bg-stone/60 p-5 text-sm">
            <p className="font-semibold uppercase tracking-wider text-charcoal">
              Payment Method: Cash on Delivery (COD)
            </p>
            <p className="mt-1 text-xs text-charcoal/75">
              Please keep the exact payable amount ready in cash upon delivery. Our courier will call your mobile number prior to arrival.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="h-fit border border-cream bg-stone/50 p-6">
          <h2 className="font-serif text-2xl">Order Summary</h2>
          <div className="mt-4 divide-y divide-cream text-sm">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between py-2.5">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-xs text-charcoal/65">
                    {item.colourName} / {item.size} &times; {item.quantity}
                  </p>
                </div>
                <span>{formatNPR(item.lineTotalNpr)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Coupon code"
              className="flex-1 border border-cream bg-ivory px-3 py-2 text-xs uppercase"
            />
            <button
              type="button"
              onClick={applyCoupon}
              className="border border-charcoal px-4 py-2 text-xs font-semibold uppercase"
            >
              Apply
            </button>
          </div>
          {couponError && <p className="mt-1.5 text-xs text-red-700">{couponError}</p>}
          {appliedCoupon && (
            <p className="mt-1.5 text-xs text-emerald-800">
              Coupon {appliedCoupon.code} applied (-{formatNPR(appliedCoupon.discountNpr)})
            </p>
          )}

          <div className="mt-5 space-y-2 border-t border-cream pt-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatNPR(cart.subtotalNpr)}</span>
            </div>
            {discountNpr > 0 && (
              <div className="flex justify-between text-emerald-800">
                <span>Discount</span>
                <span>-{formatNPR(discountNpr)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>{deliveryFeeNpr === 0 ? 'FREE' : formatNPR(deliveryFeeNpr)}</span>
            </div>
            <div className="flex justify-between border-t border-cream pt-3 text-base font-semibold">
              <span>Total Payable (COD)</span>
              <span>{formatNPR(totalPayable)}</span>
            </div>
          </div>

          {submitError && (
            <div className="mt-4 border border-red-700/30 bg-red-50 p-3 text-xs text-red-900">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full bg-terracotta py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-ivory hover:bg-maroon disabled:opacity-50"
          >
            {submitting ? 'Placing Order...' : 'Place COD Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
