import { createReadStream } from "fs";
import { basename } from "path";
import { google } from "googleapis";

/**
 * Google Drive — upload file bằng Service Account (JSON qua GOOGLE_APPLICATION_CREDENTIALS).
 * TODO: xử lý chi tiết quota, retry, refresh token nếu chuyển sang OAuth2 user flow.
 */
export class GoogleDriveService {
  private drive: ReturnType<typeof google.drive> | null = null;

  async authenticate(): Promise<void> {
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!keyFile) {
      throw new Error(
        "GOOGLE_APPLICATION_CREDENTIALS is not set (path to service account JSON)"
      );
    }

    const auth = new google.auth.GoogleAuth({
      keyFile,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    // Truyền GoogleAuth trực tiếp — tránh mismatch kiểu giữa getClient() và drive v3.
    this.drive = google.drive({ version: "v3", auth });
  }

  /**
   * Upload file local lên Drive; trả về file id trên Drive.
   * TODO: map thêm lỗi từ API (403, 404 folder) sang message rõ ràng hơn.
   */
  async uploadFile(localPath: string, mimeType?: string): Promise<string> {
    if (!this.drive) {
      await this.authenticate();
    }
    if (!this.drive) {
      throw new Error("Drive client not initialized after authenticate()");
    }

    const fileName = basename(localPath);
    const parents = process.env.DRIVE_FOLDER_ID
      ? [process.env.DRIVE_FOLDER_ID]
      : undefined;

    const res = await this.drive.files.create({
      requestBody: {
        name: fileName,
        parents,
      },
      media: {
        mimeType: mimeType ?? "application/octet-stream",
        body: createReadStream(localPath),
      },
      fields: "id",
    });

    const id = res.data.id;
    if (!id) {
      throw new Error("Drive API returned no file id");
    }
    return id;
  }
}
