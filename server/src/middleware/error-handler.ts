import type { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err.stack);
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message || "Internal server error";

  res.status(status).json({ error: message });
};

export { errorHandler };
