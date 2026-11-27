import { useEffect, useState } from 'react';
import { formatNPR, ORDER_STATUS_LABELS, OrderStatus } from '@matina/shared';
import { adminFetch } from '../lib/api';

interface DashboardData {
  totalOrders: number;
  pendingOrders: number;
  totalRevenueNpr: number;
  lowStockCount: number;
  outOfStockCount: number;
  bestsellers: Array<{ id: string; name: string; salesCount: number; basePriceNpr: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    phone: string;
    totalNpr: number;
    status: OrderStatus;
    createdAt: string;
  }>;
}

export function DashboardPage() {
  const [range, setRange] = useState('month');
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    adminFetch<DashboardData>(`/admin/dashboard?range=${range}`)
      .then(setData)
      .catch(() => {});
  }, [range]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-charcoal">Dashboard Overview</h1>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="border border-gray-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="border bg-white p-4">
              <p className="text-xs uppercase text-gray-500">Total Orders</p>
              <p className="mt-1 text-2xl font-semibold">{data.totalOrders}</p>
            </div>
            <div className="border bg-white p-4">
              <p className="text-xs uppercase text-gray-500">Orders to Process</p>
              <p className="mt-1 text-2xl font-semibold text-terracotta">{data.pendingOrders}</p>
            </div>
            <div className="border bg-white p-4">
              <p className="text-xs uppercase text-gray-500">Revenue</p>
              <p className="mt-1 text-2xl font-semibold">{formatNPR(data.totalRevenueNpr)}</p>
            </div>
            <div className="border bg-white p-4">
              <p className="text-xs uppercase text-gray-500">Low Stock Variants</p>
              <p className="mt-1 text-2xl font-semibold text-amber-700">{data.lowStockCount}</p>
            </div>
            <div className="border bg-white p-4">
              <p className="text-xs uppercase text-gray-500">Out of Stock</p>
              <p className="mt-1 text-2xl font-semibold text-red-700">{data.outOfStockCount}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="border bg-white p-5 lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-600">
                Recent Orders
              </h2>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-gray-500">
                    <th className="py-2">Order #</th>
                    <th className="py-2">Customer</th>
                    <th className="py-2">Total</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-2.5 font-medium">{o.orderNumber}</td>
                      <td className="py-2.5">{o.customerName} ({o.phone})</td>
                      <td className="py-2.5">{formatNPR(o.totalNpr)}</td>
                      <td className="py-2.5 text-xs font-medium">
                        {ORDER_STATUS_LABELS[o.status]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-600">
                Bestsellers
              </h2>
              <ul className="space-y-3 text-sm">
                {data.bestsellers.map((p) => (
                  <li key={p.id} className="flex justify-between border-b pb-2 last:border-0">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-gray-500">{p.salesCount} sold</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
