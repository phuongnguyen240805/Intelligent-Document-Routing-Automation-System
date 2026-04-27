/**
 * services/api.js — port 3002
 *
 * Routes thật (file.routes.ts):
 *   POST /api/upload        → uploadFile
 *   GET  /api/files         → getAllFiles → trả Document[]
 *   GET  /api/files/search  → searchFiles
 *   GET  /api/files/:id     → getFileById → trả FileEntity
 */

export const BASE_URL   = "http://localhost:3002/api";
export const UPLOAD_URL = `${BASE_URL}/upload`;

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// GET /api/files → Document[] (bảng documents, data sau n8n)
export const getAllDocuments = () => request("/files");

// GET /api/files/:id → FileEntity
export const getFileById = (id) => request(`/files/${id}`);

// GET /api/files/search?name=...
export const searchFiles = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/files/search?${q}`);
};