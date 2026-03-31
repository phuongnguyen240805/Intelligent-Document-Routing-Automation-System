import path from "path";
import * as dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs/promises";

import { AppDataSource } from "./data-source"; 
import { uploadFileToInbox } from "./services/googleDriveService";

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

const uploadDir: string = path.join(__dirname, "..", "tmp", "idras-uploads");

async function ensureUploadDir(): Promise<void> {
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

const upload = multer({ storage });

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

function uploadErrorStatus(message: string): number {
  if (message.startsWith("Missing GOOGLE_APPLICATION_CREDENTIALS")) {
    return 500;
  }
  if (
    message.includes("Google Drive") ||
    message.includes("Google Drive API") ||
    message.includes("ENOTFOUND") ||
    message.includes("invalid_grant")
  ) {
    return 502;
  }
  return 500;
}

app.get("/api/health", (_req: Request, res: Response): any => {
  res.status(200).json({ status: "ok" });
});

app.post("/api/upload", upload.single("file"), async (req: Request, res: Response): Promise<any> => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Use form field name: file" });
  }

  const tempPath: string = req.file.path;

  try {
    const driveResult = await uploadFileToInbox(tempPath, req.file.originalname);
    return res.status(200).json({
      message: "File uploaded to Google Drive INBOX",
      originalName: req.file.originalname,
      size: req.file.size,
      fileId: driveResult.fileId,
      driveLink: driveResult.driveLink,
      name: driveResult.name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return res.status(uploadErrorStatus(message)).json({ error: message });
  } finally {
    try {
      await fs.unlink(tempPath);
    } catch {
      // ignore missing file
    }
  }
});

app.use((err: any, _req: Request, res: Response, next: NextFunction): any => {
  if (err instanceof multer.MulterError) {
    console.error("[multer] MulterError:", err.code, err.message);
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

const PORT: number = parseInt(process.env.PORT ?? "3001", 10);

async function bootstrap(): Promise<void> {
  await ensureUploadDir();
  await AppDataSource.initialize();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend listening on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err: unknown) => {
  console.error("[bootstrap] failed:");
  console.error(err);
  if (err instanceof Error) {
    console.error("[bootstrap] stack:\n", err.stack);
  }
  process.exit(1);
});