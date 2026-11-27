import { useEffect, useState, useCallback } from 'react';
import { formatNPR } from '@matina/shared';
import { adminFetch } from '../lib/api';

interface CustomOrderRow {
  id: string;
  requestNumber: string;
  garmentType: string;
  colourName: string;
  colourHex: string;
  size: string;
  quantity: number;
  placement: 'front' | 'back';
  designImageUrl: string | null;
  customText: string | null;
  designConfig: { x?: number; y?: number; scale?: number; rotation?: number; textColor?: string };
  customerName: string;
  phone: string;
  email: string | null;
  deliveryAddress: string;
  notes: string | null;
  estimatedPriceNpr: number;
  status: string;
  internalNotes: string | null;
  createdAt: string;
  template: { name: string; garmentType: string };
}

const CUSTOM_STATUSES = [
  'pending_review',
  'approved',
  'in_production',
  'shipped',
  'delivered',
  'cancelled',
];

export function CustomOrdersPage() {
  const [rows, setRows] = useState<CustomOrderRow[]>([]);
  const [selected, setSelected] = useState<CustomOrderRow | null>(null);
  const [nextStatus, setNextStatus] = useState('pending_review');
  const [internalNotes, setInternalNotes] = useState('');

  const load = useCallback(async () => {
    const data = await adminFetch<CustomOrderRow[]>('/admin/custom-orders');
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const openDetail = (r: CustomOrderRow) => {
    setSelected(r);
    setNextStatus(r.status);
    setInternalNotes(r.internalNotes || '');
  };

  const handleSave = async () => {
    if (!selected) return;
    await adminFetch(`/admin/custom-orders/${selected.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus, internalNotes }),
    });
    setSelected(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Custom Wear Designs</h1>
        <p className="text-xs text-gray-500">
          Review customer-submitted garment mockups, uploaded artwork, and production status.
        </p>
      </div>

      <div className="overflow-x-auto border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <th className="p-3">Request #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Garment &amp; Colour</th>
              <th className="p-3">Artwork</th>
              <th className="p-3">Est. Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{r.requestNumber}</td>
                <td className="p-3">
                  {r.customerName}
                  <br />
                  <span className="text-xs text-gray-500">{r.phone}</span>
                </td>
                <td className="p-3">
                  <p className="font-medium">{r.template.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-600">
                    <span
                      className="inline-block h-3 w-3 rounded-full border"
                      style={{ backgroundColor: r.colourHex }}
                    />
                    {r.colourName} &bull; {r.size} &times; {r.quantity} ({r.placement})
                  </div>
                </td>
                <td className="p-3">
                  {r.designImageUrl ? (
                    <img src={r.designImageUrl} alt="Design" className="h-10 w-10 object-contain bg-stone" />
                  ) : (
                    <span className="text-xs text-gray-500">{r.customText || 'Text only'}</span>
                  )}
                </td>
                <td className="p-3 font-medium">{formatNPR(r.estimatedPriceNpr)}</td>
                <td className="p-3 text-xs font-semibold uppercase">{r.status.replace('_', ' ')}</td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => openDetail(r)}
                    className="text-xs font-semibold text-terracotta hover:underline"
                  >
                    Inspect Design
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-semibold">Custom Request {selected.requestNumber}</h2>
              <button type="button" onClick={() => setSelected(null)} className="text-xs">Close</button>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              {/* Visual Preview */}
              <div className="border bg-stone/30 p-4 text-center">
                <div
                  className="mx-auto flex h-64 w-56 flex-col items-center justify-center border p-4 shadow-inner"
                  style={{ backgroundColor: selected.colourHex }}
                >
                  {selected.designImageUrl && (
                    <img
                      src={selected.designImageUrl}
                      alt="Customer artwork"
                      className="max-h-36 max-w-36 object-contain"
                      style={{
                        transform: `translate(${selected.designConfig?.x ?? 0}px, ${selected.designConfig?.y ?? 0}px) scale(${selected.designConfig?.scale ?? 1}) rotate(${selected.designConfig?.rotation ?? 0}deg)`,
                      }}
                    />
                  )}
                  {selected.customText && (
                    <p
                      className="mt-2 font-serif text-sm font-semibold tracking-wider"
                      style={{ color: selected.designConfig?.textColor || '#FAF7F2' }}
                    >
                      {selected.customText}
                    </p>
                  )}
                </div>
                {selected.designImageUrl && (
                  <a
                    href={selected.designImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block bg-charcoal px-4 py-1.5 text-xs font-semibold uppercase text-ivory"
                  >
                    Download Original Artwork
                  </a>
                )}
              </div>

              {/* Details & Status */}
              <div className="space-y-3 text-sm">
                <p><strong>Customer:</strong> {selected.customerName} ({selected.phone})</p>
                <p><strong>Address:</strong> {selected.deliveryAddress}</p>
                <p>
                  <strong>Garment:</strong> {selected.template.name} ({selected.colourName} {selected.colourHex})
                </p>
                <p>
                  <strong>Spec:</strong> Size {selected.size} &times; {selected.quantity} ({selected.placement} print)
                </p>
                {selected.notes && <p><strong>Customer Notes:</strong> {selected.notes}</p>}

                <div className="space-y-2 border-t pt-3">
                  <label className="block text-xs font-semibold uppercase">Status</label>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="w-full border px-3 py-2 text-sm"
                  >
                    {CUSTOM_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>

                  <label className="block text-xs font-semibold uppercase">Internal Notes</label>
                  <textarea
                    rows={2}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full border px-3 py-2 text-sm"
                  />

                  <button
                    type="button"
                    onClick={handleSave}
                    className="w-full bg-terracotta py-2.5 text-xs font-semibold uppercase text-ivory"
                  >
                    Save Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
