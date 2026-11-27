export const ADMIN_ROLES = [
  'super_admin',
  'manager',
  'order_staff',
  'content_staff',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ORDER_STATUSES = [
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  confirmed: 'Order Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped / Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Failed Delivery / Returned',
};

export const PRODUCT_BADGES = [
  'new',
  'bestseller',
  'limited_drop',
  'sale',
] as const;

export type ProductBadge = (typeof PRODUCT_BADGES)[number];

export const NEPAL_PROVINCES = [
  'Koshi',
  'Madhesh',
  'Bagmati',
  'Gandaki',
  'Lumbini',
  'Karnali',
  'Sudurpashchim',
] as const;

export const NEPAL_DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  Koshi: ['Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Terhathum', 'Udayapur'],
  Madhesh: ['Bara', 'Dhanusha', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'],
  Bagmati: ['Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu', 'Kavrepalanchok', 'Lalitpur', 'Makwanpur', 'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok'],
  Gandaki: ['Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang', 'Myagdi', 'Nawalpur', 'Parbat', 'Syangja', 'Tanahun'],
  Lumbini: ['Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Gulmi', 'Kapilvastu', 'Parasi', 'Palpa', 'Pyuthan', 'Rolpa', 'Rukum East', 'Rupandehi'],
  Karnali: ['Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot', 'Mugu', 'Rukum West', 'Salyan', 'Surkhet'],
  Sudurpashchim: ['Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur'],
};

export function formatNPR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-IN')}`;
}

export function calculateDiscountPercent(regularPrice: number, offerPrice: number): number {
  if (regularPrice <= 0 || offerPrice >= regularPrice) return 0;
  return Math.round(((regularPrice - offerPrice) / regularPrice) * 100);
}

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ['*'],
  manager: [
    'dashboard:read',
    'orders:read',
    'orders:write',
    'products:read',
    'products:write',
    'categories:read',
    'categories:write',
    'collections:read',
    'collections:write',
    'inventory:read',
    'inventory:write',
    'offers:read',
    'offers:write',
    'coupons:read',
    'coupons:write',
    'banners:read',
    'banners:write',
    'sections:read',
    'sections:write',
    'instagram:read',
    'instagram:write',
    'customers:read',
    'reports:read',
    'pages:read',
    'pages:write',
  ],
  order_staff: [
    'dashboard:read',
    'orders:read',
    'orders:write',
    'customers:read',
  ],
  content_staff: [
    'dashboard:read',
    'banners:read',
    'banners:write',
    'sections:read',
    'sections:write',
    'collections:read',
    'collections:write',
    'instagram:read',
    'instagram:write',
    'pages:read',
    'pages:write',
  ],
};

export function hasPermission(role: AdminRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes('*') || perms.includes(permission);
}
