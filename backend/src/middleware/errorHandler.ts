import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  // Zod validation errors
  if (err instanceof ZodError || err?.name === 'ZodError') {
    const firstMessage = err.errors?.[0]?.message || 'Validation error';
    return res.status(400).json({
      success: false,
      message: firstMessage,
      errors: err.errors ? err.errors.map((e: any) => ({
        path: e.path?.join('.'),
        message: e.message,
      })) : [{ message: err.message }],
    });
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  // Prisma unique constraint violation (e.g. duplicate key)
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `A record with this ${err.meta?.target || 'field'} already exists.`,
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Requested record was not found.',
    });
  }

  const statusCode = err.statusCode || (typeof err.status === 'number' ? err.status : 500);
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
  });
}
