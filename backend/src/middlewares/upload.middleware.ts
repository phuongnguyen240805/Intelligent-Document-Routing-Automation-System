import path from "path";
import multer from "multer";
import fs from "fs/promises";
import type { Request } from "express";

const uploadDir: string = path.join(__dirname, "..", "..", "tmp", "idras-uploads");

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, uploadDir);
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

export const upload = multer({ storage });

