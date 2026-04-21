/**
 * services/api.js
 * Tất cả hàm gọi API backend Express (port 3002)
 * Matching thật với Document.ts và File.ts entity
 */

const BASE = "http://localhost:3002/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

/* ─────────────────────────────────────────────
   FILES — bảng `files` (FileEntity)
   Upload đã dùng axios trực tiếp trong Upload.jsx
───────────────────────────────────────────── */

/** GET /api/files — lấy tất cả files (bảng files) */
export const getAllUploadedFiles = () => request("/files");

/** GET /api/files/:id */
export const getFileById = (id) => request(`/files/${id}`);

/** GET /api/files/search?name=...&originalName=...&fileId=... */
export const searchFiles = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/files/search?${q}`);
};

/* ─────────────────────────────────────────────
   DOCUMENTS — bảng `documents` (Document entity)
   Đây là data sau khi n8n xử lý OCR + phân loại
   Trả về: { id, fileName, fileType, category, confidence,
             reason, processedAt, source, status, googleDriveId }
───────────────────────────────────────────── */

/** GET /api/files — trong file_controller getAllFiles() dùng Document repo */
export const getAllDocuments = () => request("/files");

/** GET /api/files/:id — getFileById dùng FileEntity repo */
export const getDocument = (id) => request(`/files/${id}`);

/* ─────────────────────────────────────────────
   UPLOAD — dùng axios trực tiếp trong Upload.jsx
   POST /api/upload  (port 3002)
───────────────────────────────────────────── */
export const UPLOAD_URL = "http://localhost:3002/api/upload";