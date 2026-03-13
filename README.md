Intelligent-Document-Routing-Automation-System/
├── frontend/                  # React + Vite
│   ├── public/
│   ├── src/
│   │   ├── components/        # UploadZone, DocumentCard, RoutingStatus
│   │   ├── pages/             # Dashboard.tsx, Upload.tsx, History.tsx
│   │   ├── services/          # api.ts (axios gọi BE)
│   │   ├── types/             # document.types.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   ├── tailwind.config.js     # (tùy chọn)
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                   # NestJS
│   ├── src/
│   │   ├── modules/
│   │   │   ├── document/      # document.module, controller, service
│   │   │   ├── ai-routing/    # ai-routing.service (gọi OpenAI/Grok)
│   │   │   └── routing/       # routing.service (lưu DB + workflow)
│   │   ├── common/            # filters, interceptors
│   │   ├── config/            # env validation
│   │   ├── main.ts
│   │   └── app.module.ts
│   ├── test/
│   ├── nest-cli.json
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                    # (tùy chọn) types & utils chung
│   └── types/
│
├── .gitignore                 # ← file em tạo dưới đây
├── package.json               # root (workspaces + scripts)
├── README.md
├── turbo.json                 # (nếu sau muốn nâng cấp Turborepo)
└── docker-compose.yml         # (tùy chọn cho deployment)