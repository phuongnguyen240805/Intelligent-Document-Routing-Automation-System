/**
 * services/api.js
 * Tất cả các hàm gọi API xuống backend Express
 * Base URL đọc từ biến môi trường Vite
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

/* ── Dashboard ── */
export const getDashboardStats = () => request("/dashboard/stats");
export const getRecentDocuments = (limit = 10) => request(`/documents/recent?limit=${limit}`);
export const getCategoryStats = () => request("/documents/categories");

/* ── Documents ── */
export const getDocuments = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/documents?${q}`);
};
export const getDocument = (id) => request(`/documents/${id}`);

/* ── Upload ── */
export const uploadFile = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/upload`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
};

/* ── Pending / Review ── */
export const getPendingDocuments = () => request("/documents/pending");
export const approveDocument = (id, category) =>
  request(`/documents/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ category }),
  });
export const rejectDocument = (id) =>
  request(`/documents/${id}/reject`, { method: "POST" });
