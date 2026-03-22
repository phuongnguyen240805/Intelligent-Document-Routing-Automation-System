# Cấu trúc backend (IDRAS)

```
backend/
├── Dockerfile
├── package.json
├── package-lock.json
├── tsconfig.json
├── src/
│   ├── data-source.ts      # TypeORM + Postgres
│   ├── server.ts           # Express, POST /upload
│   ├── entities/
│   │   └── Document.ts
│   └── services/
│       └── googleDriveService.ts
└── tmp/
    └── idras-uploads/      # Multer + tạo thư mục runtime nếu thiếu
```
