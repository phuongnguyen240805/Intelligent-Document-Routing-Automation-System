import type { Request, Response } from "express";
import fs from "fs/promises";
import { ILike } from "typeorm";

import { AppDataSource } from "../data-source";
import { FileEntity } from "../entities/File";
import { uploadFileToInbox } from "../services/googleDriveService";
import { Document } from "../entities/Document";

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

export async function uploadFile(req: Request, res: Response): Promise<any> {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Use form field name: file" });
  }

  const tempPath: string = req.file.path;

  try {
    const driveResult = await uploadFileToInbox(tempPath, req.file.originalname);

    const repo = AppDataSource.getRepository(FileEntity);
    const record = repo.create({
      name: driveResult.name ?? req.file.originalname,
      originalName: req.file.originalname,
      size: String(req.file.size),
      fileId: driveResult.fileId,
      driveLink: driveResult.driveLink,
    });
    await repo.save(record);

    return res.status(200).json({
      message: "File uploaded to Google Drive INBOX",
      id: record.id,
      originalName: record.originalName,
      size: Number(req.file.size),
      fileId: record.fileId,
      driveLink: record.driveLink,
      name: record.name,
      createdAt: record.createdAt,
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
}

export async function getAllFiles(_req: Request, res: Response): Promise<any> {
  const repo = AppDataSource.getRepository(Document);
  const rows = await repo.find({ order: { processedAt: "DESC" } });
  return res.status(200).json(rows);
}

export async function getFileById(req: Request, res: Response): Promise<any> {
  const { id } = req.params;
  const repo = AppDataSource.getRepository(Document);
  const row = await repo.findOne({ where: { id } });
  if (!row) {
    return res.status(404).json({ error: "Not found" });
  }
  return res.status(200).json(row);
}

export async function searchDocuments(req: Request, res: Response): Promise<any> {
  const repo = AppDataSource.getRepository(Document);

  // 1. Lấy và chuẩn hóa query params
  const fileName = typeof req.query.fileName === "string" ? req.query.fileName.trim() : "";
  const googleDriveId = typeof req.query.googleDriveId === "string" ? req.query.googleDriveId.trim() : "";
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
  
  // Phân trang
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // 2. Kiểm tra điều kiện tối thiểu (Tùy chọn: có thể cho phép search trống để lấy tất cả)
  // if (!fileName && !googleDriveId && !status) { ... }

  // 3. Xây dựng điều kiện WHERE (Sử dụng mảng [] cho toán tử OR, hoặc Object {} cho toán tử AND)
  // Ở đây tôi sử dụng mảng để giữ logic OR như code cũ của bạn nhưng làm sạch hơn
  const where: any[] = [];

  if (fileName) {
    where.push({ fileName: ILike(`%${fileName}%`) });
  }
  if (googleDriveId) {
    where.push({ googleDriveId: ILike(`%${googleDriveId}%`) });
  }
  if (status) {
    where.push({ status: status }); // Status thường tìm chính xác, không dùng ILike
  }

  try {
    // 4. Thực thi truy vấn với FindAndCount để hỗ trợ frontend làm pagination
    const [rows, total] = await repo.findAndCount({
      where: where.length > 0 ? where : {},
      order: { processedAt: "DESC" }, // Sắp xếp theo thời gian xử lý mới nhất
      take: limit,
      skip: skip,
    });

    return res.status(200).json({
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Search Documents Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// export async function searchFiles(req: Request, res: Response): Promise<any> {
//   const repo = AppDataSource.getRepository(FileEntity);

//   const name = typeof req.query.name === "string" ? req.query.name.trim() : "";
//   const originalName =
//     typeof req.query.originalName === "string" ? req.query.originalName.trim() : "";
//   const fileId = typeof req.query.fileId === "string" ? req.query.fileId.trim() : "";

//   if (!name && !originalName && !fileId) {
//     return res.status(400).json({
//       error: "Provide at least one query param: name, originalName, fileId",
//     });
//   }

//   const where: Array<Partial<FileEntity>> = [];

//   if (name) {
//     where.push({ name: ILike(`%${name}%`) } as any);
//   }
//   if (originalName) {
//     where.push({ originalName: ILike(`%${originalName}%`) } as any);
//   }
//   if (fileId) {
//     where.push({ fileId: ILike(`%${fileId}%`) } as any);
//   }

//   const rows = await repo.find({
//     where: where as any,
//     order: { createdAt: "DESC" },
//   });

//   return res.status(200).json(rows);
// }

