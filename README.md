# 🚀 IDRAS - Intelligent Document Routing Automation System

**IDRAS** (Hệ thống Tự động hóa Phân loại Tài liệu Thông minh) là một giải pháp toàn diện giúp doanh nghiệp tự động hóa hoàn toàn quy trình nhận, đọc hiểu, bóc tách dữ liệu và sắp xếp tài liệu. 

Dự án là sự kết hợp mạnh mẽ giữa giao diện người dùng (React), máy chủ xử lý (Node.js) và luồng tự động hóa thông minh (n8n) tích hợp trí tuệ nhân tạo Google Gemini.

## ✨ Tính năng nổi bật
- **Tự động nhận diện tài liệu:** Phân loại chính xác các loại tài liệu (Hóa đơn, CV, Hợp đồng...) ngay khi được tải lên.
- **Trích xuất dữ liệu bằng AI:** Sử dụng sức mạnh của mô hình ngôn ngữ lớn (Google Gemini) để đọc hiểu văn bản, trích xuất lý do và tính toán độ tự tin (confidence score).
- **Định tuyến tự động (Routing):** Tự động di chuyển file vào các thư mục tương ứng trên Google Drive mà không cần thao tác thủ công.
- **Báo cáo thời gian thực:** Tự động ghi log chi tiết (Tên file, Phân loại, Độ tự tin, Lý do, Đường dẫn file) trực tiếp lên Google Sheets.

## 🛠️ Công nghệ sử dụng
- **Frontend:** React.js, Vite
- **Backend:** Node.js, Express.js
- **Automation:** n8n (Workflow Automation)
- **AI Model:** Google Gemini API
- **Cloud/Database:** Google Drive API, Google Sheets API, MongoDB

## 🗂️ Cấu trúc dự án (Project Structure)
Dự án được xây dựng theo mô hình Monorepo, bao gồm cả Frontend, Backend và Workflow của n8n:

```text
idras-system/
│
├── frontend/                     # 🖥️ Giao diện React + Vite
│   ├── public/                   # Chứa ảnh, favicon...
│   ├── src/
│   │   ├── assets/               # CSS, hình ảnh dùng trong code
│   │   ├── components/           # Các component dùng chung (Nút bấm, Form upload...)
│   │   ├── pages/                # Các trang chính (Dashboard, Lịch sử phân loại...)
│   │   ├── services/             # File chứa các hàm gọi API (gọi xuống backend)
│   │   ├── App.jsx               # File root của React
│   │   └── main.jsx              # File khởi tạo React
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # ⚙️ Máy chủ Node.js + Express
│   ├── src/
│   │   ├── controllers/          # Nơi xử lý logic (nhận file từ FE, gọi n8n...)
│   │   ├── routes/               # Nơi định nghĩa API (ví dụ: POST /api/upload)
│   │   ├── middlewares/          # Xử lý lỗi, check quyền truy cập (nếu có)
│   │   ├── services/             # Code tương tác Google Drive API (nếu cần)
│   │   └── server.js             # File khởi chạy Express server
│   ├── .env                      # Biến môi trường (PORT=3000, N8N_WEBHOOK_URL...)
│   └── package.json
│
├── n8n-workflows/                # 🤖 Nơi lưu trữ logic tự động hóa
│   └── IDRAS - Intelligent Document Router.json  # File cấu hình luồng n8n
│
├── .gitignore                    # Chặn push các file rác/nhạy cảm (node_modules, .env)
└── README.md                     # Tài liệu giới thiệu dự án