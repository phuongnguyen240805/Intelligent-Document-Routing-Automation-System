import { useCallback, useRef, useState } from "react";
import axios from "axios";

const UPLOAD_URL = "http://localhost:3001/api/upload";

export default function App() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const pickFiles = useCallback((list) => {
    const next = list?.[0];
    if (next) {
      setFile(next);
      setResult(null);
      setError(null);
    }
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      pickFiles(e.dataTransfer.files);
    },
    [pickFiles]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axios.post(UPLOAD_URL, formData, {
        timeout: 120_000,
      });
      setResult(data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      const msg =
        err.response?.data?.error ??
        err.message ??
        "Không thể tải file lên. Vui lòng thử lại.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950">
      <div className="mx-auto max-w-xl px-4 py-16">
        <header className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/90">
            IDRAS
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Tải tài liệu lên Drive
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Kéo thả file vào vùng bên dưới hoặc chọn từ máy. File được gửi tới{" "}
            <span className="font-mono text-indigo-200">/api/upload</span> với field{" "}
            <span className="font-mono text-indigo-200">file</span>.
          </p>
        </header>

        <form onSubmit={onSubmit} className="space-y-6">
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={[
              "group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all duration-300",
              dragActive
                ? "border-indigo-400 bg-indigo-500/15 shadow-drop ring-2 ring-indigo-400/40"
                : "border-slate-600/80 bg-slate-900/50 hover:border-indigo-400/60 hover:bg-slate-900/80",
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative mx-auto flex max-w-sm flex-col items-center gap-3">
              <div
                className={[
                  "flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-2xl transition-transform duration-300",
                  dragActive ? "scale-110" : "group-hover:scale-105",
                ].join(" ")}
                aria-hidden
              >
                📄
              </div>
              <p className="text-base font-medium text-slate-100">
                {file ? file.name : "Kéo thả tài liệu vào đây"}
              </p>
              <p className="text-sm text-slate-400">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB — bấm Gửi để upload`
                  : "hoặc bấm để chọn file (PDF, ảnh, Office…)"}
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => pickFiles(e.target.files)}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setResult(null);
                setError(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded-xl border border-slate-600/80 bg-transparent px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800/60"
            >
              Xóa lựa chọn
            </button>
            <button
              type="submit"
              disabled={!file || loading}
              aria-busy={loading}
              className="inline-flex min-h-[2.5rem] min-w-[10rem] items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition enabled:hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {/* Luôn render cùng một cấu trúc DOM (2 span) để tránh lỗi insertBefore khi loading đổi */}
              <span
                className="inline-flex h-4 w-4 shrink-0 items-center justify-center"
                aria-hidden
              >
                <span
                  className={
                    loading
                      ? "block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                      : "block h-4 w-4"
                  }
                />
              </span>
              <span>{loading ? "Đang tải lên…" : "Gửi lên server"}</span>
            </button>
          </div>
        </form>

        {loading && (
          <p className="mt-8 text-center text-sm text-indigo-200/90">
            Đang xử lý — vui lòng không đóng trang…
          </p>
        )}

        {error && (
          <div
            className="mt-8 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-100"
            role="alert"
          >
            <p className="font-semibold text-red-200">Lỗi</p>
            <p className="mt-1 whitespace-pre-wrap text-red-100/90">{error}</p>
          </div>
        )}

        {result && !loading && (
          <div className="mt-8 rounded-xl border border-emerald-500/35 bg-emerald-950/40 px-4 py-4 text-sm text-emerald-50">
            <p className="font-semibold text-emerald-200">Thành công</p>
            <p className="mt-2 text-emerald-100/95">{result.message}</p>
            <dl className="mt-3 space-y-1.5 text-xs text-emerald-100/85">
              <div className="flex gap-2">
                <dt className="shrink-0 text-emerald-300/90">Tên gốc</dt>
                <dd className="font-mono">{result.originalName}</dd>
              </div>
              {result.driveLink && (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <dt className="shrink-0 text-emerald-300/90">Link Drive</dt>
                  <dd>
                    <a
                      href={result.driveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-indigo-300 underline decoration-indigo-400/50 underline-offset-2 hover:text-indigo-200"
                    >
                      {result.driveLink}
                    </a>
                  </dd>
                </div>
              )}
              {result.fileId && (
                <div className="flex gap-2">
                  <dt className="shrink-0 text-emerald-300/90">File ID</dt>
                  <dd className="font-mono">{result.fileId}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
