'use client';

import React, { useState } from 'react';
import { formatNPR } from '@matina/shared';
import { apiFetch } from '@/lib/api';

interface TrackedOrder {
  orderNumber: string;
  status: string;
  statusLabel: string;
  paymentMethod: string;
  totalNpr: number;
  district: string;
  province: string;
  createdAt: string;
  items: Array<{
    productNameSnapshot: string;
    colourSnapshot: string;
    sizeSnapshot: string;
    quantity: number;
    lineTotalNpr: number;
  }>;
  timeline: Array<{
    status: string;
    statusLabel: string;
    note: string | null;
    createdAt: string;
  }>;
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await apiFetch<TrackedOrder>('/orders/track', {
        method: 'POST',
        body: JSON.stringify({ orderNumber, phone }),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to find order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl font-medium text-charcoal">Track Your Order</h1>
      <p className="mt-2 text-sm text-charcoal/70">
        Enter both your Order Number and the Mobile Number used at checkout to view live delivery progress.
      </p>

      <form onSubmit={handleTrack} className="mt-8 grid gap-4 border border-cream bg-stone/40 p-6 sm:grid-cols-3">
        <input
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Order Number (e.g. MTN-2026-...)"
          className="border border-cream bg-ivory px-3.5 py-2.5 text-sm"
        />
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Mobile Number (98XXXXXXXX)"
          className="border border-cream bg-ivory px-3.5 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-terracotta px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-ivory hover:bg-maroon"
        >
          {loading ? 'Checking...' : 'Track Order'}
        </button>
      </form>

      {error && (
        <div className="mt-6 border border-red-700/30 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6 border border-cream bg-ivory p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cream pb-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-charcoal/60">Order</p>
              <p className="font-serif text-2xl font-semibold">{result.orderNumber}</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-terracotta px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ivory">
                {result.statusLabel}
              </span>
              <p className="mt-1 text-xs text-charcoal/60">
                {result.district}, {result.province} &bull; {formatNPR(result.totalNpr)} ({result.paymentMethod})
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">
              Status Timeline
            </h2>
            <ol className="mt-4 space-y-4 border-l-2 border-terracotta/40 pl-5">
              {result.timeline.map((step, idx) => (
                <li key={idx} className="relative">
                  <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-terracotta" />
                  <p className="text-sm font-semibold text-charcoal">{step.statusLabel}</p>
                  {step.note && <p className="text-xs text-charcoal/70">{step.note}</p>}
                  <p className="text-[11px] text-charcoal/50">
                    {new Date(step.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="border-t border-cream pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">
              Items
            </h2>
            <ul className="mt-2 divide-y divide-cream text-sm">
              {result.items.map((it, idx) => (
                <li key={idx} className="flex justify-between py-2">
                  <span>
                    {it.productNameSnapshot} ({it.colourSnapshot} / {it.sizeSnapshot}) &times; {it.quantity}
                  </span>
                  <span className="font-medium">{formatNPR(it.lineTotalNpr)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
