import { useEffect, useState, useCallback } from 'react';
import {
  formatNPR,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  OrderStatus,
} from '@matina/shared';
import { adminFetch } from '../lib/api';

interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  province: string;
  district: string;
  municipality: string;
  wardNo: string;
  streetTole: string;
  totalNpr: number;
  status: OrderStatus;
  internalNotes: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    productNameSnapshot: string;
    colourSnapshot: string;
    sizeSnapshot: string;
    quantity: number;
    lineTotalNpr: number;
  }>;
}

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<OrderSummary | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus>('confirmed');
  const [statusNote, setStatusNote] = useState('');

  const loadOrders = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (statusFilter) params.set('status', statusFilter);
    const data = await adminFetch<OrderSummary[]>(`/admin/orders?${params.toString()}`);
    setOrders(data);
  }, [q, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async () => {
    if (!selected) return;
    await adminFetch(`/admin/orders/${selected.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus, note: statusNote }),
    });
    setStatusNote('');
    setSelected(null);
    loadOrders();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order #, name, phone..."
            className="border border-gray-300 bg-white px-3 py-1.5 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <th className="p-3">Order #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Location</th>
              <th className="p-3">Total (COD)</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{o.orderNumber}</td>
                <td className="p-3">{o.customerName}<br /><span className="text-xs text-gray-500">{o.phone}</span></td>
                <td className="p-3 text-xs">{o.district}, {o.province}</td>
                <td className="p-3 font-medium">{formatNPR(o.totalNpr)}</td>
                <td className="p-3 text-xs font-semibold">{ORDER_STATUS_LABELS[o.status]}</td>
                <td className="p-3 text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => { setSelected(o); setNextStatus(o.status); }}
                    className="text-xs font-semibold text-terracotta hover:underline"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-semibold">Order {selected.orderNumber}</h2>
              <div className="flex gap-3">
                <button type="button" onClick={() => window.print()} className="text-xs underline">
                  Print Packing Slip
                </button>
                <button type="button" onClick={() => setSelected(null)} className="text-xs">
                  Close
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <p><strong>Customer:</strong> {selected.customerName} ({selected.phone})</p>
              <p>
                <strong>Address:</strong> {selected.streetTole}, Ward {selected.wardNo},{' '}
                {selected.municipality}, {selected.district}, {selected.province}
              </p>
            </div>

            <div className="mt-4 border-t pt-3">
              <p className="text-xs font-semibold uppercase text-gray-500">Items</p>
              <ul className="mt-2 space-y-1 text-sm">
                {selected.items.map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <span>{it.productNameSnapshot} ({it.colourSnapshot} / {it.sizeSnapshot}) &times; {it.quantity}</span>
                    <span>{formatNPR(it.lineTotalNpr)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 space-y-3 border-t pt-4">
              <label className="block text-xs font-semibold uppercase">Update Status</label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                className="w-full border px-3 py-2 text-sm"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                ))}
              </select>
              <input
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Note or cancellation reason..."
                className="w-full border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleUpdateStatus}
                className="w-full bg-terracotta py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory"
              >
                Save Status Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
