import { useEffect, useState, useCallback } from 'react';
import { adminFetch, API_URL } from '../lib/api';

interface InventoryRow {
  variantId: string;
  availableQty: number;
  lowStockThreshold: number;
  variant: {
    sku: string;
    colourName: string;
    size: string;
    product: { name: string };
  };
}

export function InventoryPage() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    const query = filter ? `?filter=${filter}` : '';
    const data = await adminFetch<InventoryRow[]>(`/admin/inventory${query}`);
    setRows(data);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const adjust = async (variantId: string, delta: number) => {
    await adminFetch('/admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        variantId,
        delta,
        reason: delta > 0 ? 'restock' : 'manual_adjustment',
        note: 'Quick adjustment from Inventory view',
      }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Inventory / Stock</h1>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">All Variants</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <a
            href={`${API_URL}/admin/inventory/export`}
            target="_blank"
            rel="noreferrer"
            className="border border-charcoal bg-white px-4 py-1.5 text-xs font-semibold uppercase"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="overflow-x-auto border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <th className="p-3">SKU</th>
              <th className="p-3">Product</th>
              <th className="p-3">Variant</th>
              <th className="p-3">Available</th>
              <th className="p-3">Quick Adjust</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.variantId} className="border-b last:border-0">
                <td className="p-3 text-xs text-gray-500">{r.variant.sku}</td>
                <td className="p-3 font-medium">{r.variant.product.name}</td>
                <td className="p-3">{r.variant.colourName} / {r.variant.size}</td>
                <td className="p-3">
                  <span
                    className={`font-semibold ${
                      r.availableQty <= 0
                        ? 'text-red-700'
                        : r.availableQty <= r.lowStockThreshold
                        ? 'text-amber-700'
                        : 'text-emerald-800'
                    }`}
                  >
                    {r.availableQty}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => adjust(r.variantId, 1)}
                    className="border px-2.5 py-0.5 text-xs hover:bg-gray-100"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => adjust(r.variantId, 5)}
                    className="border px-2.5 py-0.5 text-xs hover:bg-gray-100"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    disabled={r.availableQty <= 0}
                    onClick={() => adjust(r.variantId, -1)}
                    className="border px-2.5 py-0.5 text-xs hover:bg-gray-100 disabled:opacity-40"
                  >
                    -1
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
