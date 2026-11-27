import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  if (err instanceof Error) {
    const status = (err as Error & { status?: number }).status ?? 500;
    if (status >= 500) {
      console.error('[API Error]', err);
    }
    return res.status(status).json({
      error: status >= 500 ? 'Internal server error' : err.message,
    });
  }

  return res.status(500).json({ error: 'Internal server error' });
}
