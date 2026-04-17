import type { NextFunction, Request, Response } from "express";
import multer from "multer";

export function multerErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): any {
  if (err instanceof multer.MulterError) {
    console.error("[multer] MulterError:", err.code, err.message);
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
  next(err);
}

