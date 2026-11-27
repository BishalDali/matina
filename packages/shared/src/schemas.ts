import { z } from 'zod';
import { ADMIN_ROLES, ORDER_STATUSES } from './constants';

export const nepalPhoneSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/[\s-]/g, '').replace(/^\+977/, ''))
  .refine((val) => /^(97|98)\d{8}$/.test(val), {
    message: 'Enter a valid 10-digit Nepal mobile number (97/98XXXXXXXX)',
  });

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, 'Full name is required').max(120),
  phone: nepalPhoneSchema,
  email: z.string().trim().email('Invalid email').optional().or(z.literal('')),
  province: z.string().trim().min(2, 'Province is required'),
  district: z.string().trim().min(2, 'District is required'),
  municipality: z.string().trim().min(2, 'Municipality / Rural Municipality is required'),
  wardNo: z.string().trim().min(1, 'Ward number is required').max(10),
  streetTole: z.string().trim().min(2, 'Street / Tole is required').max(200),
  deliveryNotes: z.string().trim().max(500).optional().default(''),
  couponCode: z.string().trim().max(50).optional().default(''),
  idempotencyKey: z.string().trim().min(8).max(128),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const trackOrderSchema = z.object({
  orderNumber: z.string().trim().min(4, 'Order number is required').max(40),
  phone: nepalPhoneSchema,
});

export type TrackOrderInput = z.infer<typeof trackOrderSchema>;

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional().default(''),
});

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: z.enum(ADMIN_ROLES),
});
