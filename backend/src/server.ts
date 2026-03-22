import "reflect-metadata";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import multer from "multer";
import { AppDataSource } from "./data-source";
import { Document, DocumentStatus } from "./entities/Document";
import { GoogleDriveService } from "./services/googleDriveService";

dotenv.config();

const PORT = Number(process.env.PORT ?? 3000);

/** Thư mục lưu file tạm từ Multer — tạo tự động nếu chưa có (Ngày 3). */
function ensureUploadDir(): string {
  const uploadDir = path.join(process.cwd(), "tmp", "idras-uploads");
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
}

const uploadDir = ensureUploadDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^\w.\-]/g, "_")}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB ?? 50) * 1024 * 1024 },
});

const app = express();
app.use(cors());
app.use(express.json());

const driveService = new GoogleDriveService();

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "idras-backend" });
});

/**
 * POST /upload — multipart field name: "file"
 * Luồng: lưu tạm → tạo bản ghi PENDING → upload Drive → cập nhật UPLOADED + googleDriveId → xóa file tạm.
 */
app.post(
  "/upload",
  (req, res, next) => {
    upload.single("file")(req, res, (err: unknown) => {
      if (err) {
        const message =
          err instanceof Error ? err.message : "Upload middleware error";
        return res.status(400).json({ error: message });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Missing file (use field name "file")' });
    }

    const docRepo = AppDataSource.getRepository(Document);
    let doc = docRepo.create({
      name: file.originalname,
      googleDriveId: null,
      status: DocumentStatus.PENDING,
    });

    try {
      await docRepo.save(doc);
    } catch (e) {
      try {
        unlinkSync(file.path);
      } catch {
        /* ignore */
      }
      const message = e instanceof Error ? e.message : "Database error";
      return res.status(500).json({ error: message });
    }

    try {
      const googleDriveId = await driveService.uploadFile(
        file.path,
        file.mimetype
      );
      doc.googleDriveId = googleDriveId;
      doc.status = DocumentStatus.UPLOADED;
      await docRepo.save(doc);
    } catch (e) {
      doc.status = DocumentStatus.FAILED;
      try {
        await docRepo.save(doc);
      } catch {
        /* ignore secondary DB error */
      }
      try {
        unlinkSync(file.path);
      } catch {
        /* ignore */
      }
      const message = e instanceof Error ? e.message : "Google Drive upload failed";
      return res.status(502).json({ error: message, documentId: doc.id });
    }

    try {
      unlinkSync(file.path);
    } catch {
      /* TODO: log cleanup failure — file left on disk */
    }

    return res.status(201).json({
      id: doc.id,
      name: doc.name,
      googleDriveId: doc.googleDriveId,
      status: doc.status,
    });
  }
);

async function bootstrap(): Promise<void> {
  try {
    await AppDataSource.initialize();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Database connection failed:", message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});
