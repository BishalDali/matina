import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { storefrontRouter } from './routes/storefront';
import { cartCheckoutRouter } from './routes/cart-checkout';
import { adminAuthRouter } from './routes/admin-auth';
import { adminCatalogueRouter } from './routes/admin-catalogue';
import { adminOperationsRouter } from './routes/admin-operations';
import { errorHandler } from './middleware/error';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

const allowedOrigins = (
  process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173'
)
  .split(',')
  .map((o) => o.trim());

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Static uploaded images
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'matina-api' });
});

app.use('/api/v1/storefront', storefrontRouter);
app.use('/api/v1', cartCheckoutRouter);
app.use('/api/v1/admin', adminAuthRouter);
app.use('/api/v1/admin', adminCatalogueRouter);
app.use('/api/v1/admin', adminOperationsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Matina API running on http://localhost:${PORT}`);
});
