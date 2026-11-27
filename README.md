# Matina Clothing

Responsive editorial e-commerce platform for **Matina Clothing** — *Nepal's living culture reimagined through contemporary streetwear.*

## Stack

- **Customer Storefront (`apps/web`)**: Next.js (App Router, TypeScript, Tailwind CSS)
- **Admin Dashboard (`apps/admin`)**: React + Vite + TypeScript + Tailwind CSS
- **Backend API (`apps/api`)**: Node.js + Express + Prisma ORM + Zod + Sharp
- **Database**: PostgreSQL
- **Shared (`packages/shared`)**: TypeScript types, Zod schemas, RBAC permissions, Nepal location data, NPR formatting

## Local Setup

1. Copy `.env.example` to `.env` (and `apps/api/.env`).
2. Start PostgreSQL (`docker compose up -d`).
3. Install dependencies, push schema, and seed initial data:
   ```bash
   pnpm install
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```
4. Start all services:
   ```bash
   pnpm dev
   ```
   - Storefront: `http://localhost:3000`
   - Admin Dashboard: `http://localhost:5173`
   - API: `http://localhost:4000`
