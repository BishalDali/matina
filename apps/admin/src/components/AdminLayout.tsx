import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Layers,
  Boxes,
  Tag,
  Ticket,
  Image,
  LayoutTemplate,
  Instagram,
  Users,
  Truck,
  FileText,
  Shield,
  Settings,
  LogOut,
  Palette,
} from 'lucide-react';
import { useAuth } from './AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, perm: 'dashboard:read' },
  { to: '/orders', label: 'Orders', icon: ShoppingBag, perm: 'orders:read' },
  { to: '/custom-orders', label: 'Custom Designs', icon: Palette, perm: 'orders:read' },
  { to: '/products', label: 'Products', icon: Package, perm: 'products:read' },
  { to: '/categories', label: 'Categories', icon: FolderTree, perm: 'categories:read' },
  { to: '/collections', label: 'Collections', icon: Layers, perm: 'collections:read' },
  { to: '/inventory', label: 'Inventory / Stock', icon: Boxes, perm: 'inventory:read' },
  { to: '/offers', label: 'Prices & Offers', icon: Tag, perm: 'offers:read' },
  { to: '/coupons', label: 'Coupons', icon: Ticket, perm: 'coupons:read' },
  { to: '/banners', label: 'Banners & Sliders', icon: Image, perm: 'banners:read' },
  { to: '/sections', label: 'Homepage Sections', icon: LayoutTemplate, perm: 'sections:read' },
  { to: '/instagram', label: 'Instagram Feed', icon: Instagram, perm: 'instagram:read' },
  { to: '/customers', label: 'Customers', icon: Users, perm: 'customers:read' },
  { to: '/shipping', label: 'Shipping Rules', icon: Truck, perm: '*' },
  { to: '/pages', label: 'Website Content', icon: FileText, perm: 'pages:read' },
  { to: '/users', label: 'Admin Users', icon: Shield, perm: '*' },
  { to: '/settings', label: 'Settings', icon: Settings, perm: '*' },
];

export function AdminLayout() {
  const { user, logout, can } = useAuth();

  return (
    <div className="flex min-h-screen bg-stone/30">
      <aside className="flex w-64 shrink-0 flex-col border-r border-stone bg-charcoal text-ivory">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-lg font-semibold tracking-[0.25em]">MATINA</p>
          <p className="mt-0.5 text-xs text-ivory/60">Admin Dashboard</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.filter((item) => can(item.perm)).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-terracotta font-medium text-ivory'
                      : 'text-ivory/75 hover:bg-white/10 hover:text-ivory'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <p className="text-xs font-medium">{user?.name}</p>
          <p className="text-[11px] uppercase tracking-wider text-ivory/50">{user?.role}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center gap-2 rounded bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
