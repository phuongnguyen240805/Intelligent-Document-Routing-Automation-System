import { createReadStream, existsSync } from "fs";
import path from "path";
import { OAuth2Client } from "google-auth-library";
import { google, type drive_v3 } from "googleapis";

export type UploadToInboxResult = {
  fileId: string;
  driveLink: string;
  name: string;
};

/**
 * Chế độ xác thực Drive:
 * - oauth / oauth_user: OAuth2 người dùng (refresh token) — phù hợp tài khoản Google cá nhân, không dính quota rỗng của Service Account.
 * - service_account: file JSON Service Account (workspace / Shared Drive hoặc khi chấp nhận hạn chế quota).
 *
 * Mặc định: nếu có GOOGLE_OAUTH_REFRESH_TOKEN thì dùng oauth; ngược lại nếu có GOOGLE_APPLICATION_CREDENTIALS thì dùng service_account.
 */
function resolveAuthMode(): "oauth" | "service_account" {
  const explicit = (process.env.GOOGLE_DRIVE_AUTH_MODE || "").trim().toLowerCase();
  if (explicit === "oauth" || explicit === "oauth_user") {
    return "oauth";
  }
  if (explicit === "service_account" || explicit === "sa") {
    return "service_account";
  }
  if ((process.env.GOOGLE_OAUTH_REFRESH_TOKEN || "").trim() !== "") {
    return "oauth";
  }
  return "service_account";
}

/**
 * Resolve đường dẫn JSON credentials: ưu tiên cwd, sau đó thư mục gốc package backend (cạnh dist/).
 */
function resolveCredentialPath(keyFile: string): string {
  const t = keyFile.trim();
  if (path.isAbsolute(t)) {
    return t;
  }
  const rel = t.replace(/^\.\//, "");
  const fromCwd = path.resolve(process.cwd(), rel);
  const fromPackageRoot = path.join(__dirname, "..", "..", rel);
  if (existsSync(fromCwd)) {
    return fromCwd;
  }
  if (existsSync(fromPackageRoot)) {
    return fromPackageRoot;
  }
  return fromCwd;
}

/**
 * OAuth 2.0 với refresh token — file được tạo thuộc quota của user (My Drive / folder đích),
 * không bị lỗi "Service Accounts do not have storage quota".
 */
function createOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();
  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() || "http://localhost";

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "OAuth: thiếu GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET hoặc GOOGLE_OAUTH_REFRESH_TOKEN. " +
        "Đặt GOOGLE_DRIVE_AUTH_MODE=oauth và lấy refresh token một lần (OAuth Playground / script)."
    );
  }

  const oauth2 = new OAuth2Client(clientId, clientSecret, redirectUri);
  oauth2.setCredentials({
    refresh_token: refreshToken,
  });

  console.log("[googleDriveService] Auth: OAuth2 user (refresh token)");
  return oauth2;
}

async function getDriveWithOAuth(): Promise<drive_v3.Drive> {
  const oauth2 = createOAuth2Client();
  return google.drive({
    version: "v3",
    auth: oauth2,
  });
}

async function getDriveWithServiceAccount(): Promise<drive_v3.Drive> {
  const keyFileRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyFileRaw || keyFileRaw.trim() === "") {
    throw new Error(
      "Service Account: thiếu GOOGLE_APPLICATION_CREDENTIALS, hoặc chuyển sang OAuth (GOOGLE_DRIVE_AUTH_MODE=oauth + refresh token)."
    );
  }

  const keyFile = resolveCredentialPath(keyFileRaw);
  console.log("[googleDriveService] GOOGLE_APPLICATION_CREDENTIALS raw:", keyFileRaw);
  console.log("[googleDriveService] Resolved key file path:", keyFile);
  console.log("[googleDriveService] process.cwd():", process.cwd());
  if (!existsSync(keyFile)) {
    console.error(
      "[googleDriveService] Credential file does not exist at resolved path. Check cwd and path in .env."
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const authClient = await auth.getClient();
  console.log("[googleDriveService] Auth: Service Account (JSON)");

  return google.drive({
    version: "v3",
    auth: authClient as Parameters<typeof google.drive>[0]["auth"],
  });
}

async function getDrive(): Promise<drive_v3.Drive> {
  const mode = resolveAuthMode();
  if (mode === "oauth") {
    return getDriveWithOAuth();
  }
  return getDriveWithServiceAccount();
}

async function resolveInboxFolderId(drive: drive_v3.Drive): Promise<string> {
  const explicit = process.env.GOOGLE_DRIVE_INBOX_FOLDER_ID?.trim();
  if (explicit) {
    return explicit;
  }

  const res = await drive.files.list({
    q: "mimeType = 'application/vnd.google-apps.folder' and name = 'INBOX' and trashed = false",
    fields: "files(id, name)",
    pageSize: 5,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const first = res.data.files?.[0];
  if (!first?.id) {
    throw new Error(
      "No INBOX folder found. Create a folder named INBOX in Drive (and share it with the service account), or set GOOGLE_DRIVE_INBOX_FOLDER_ID."
    );
  }

  return first.id;
}

function extractDriveMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { error?: { message?: string } } } })
      .response?.data?.error?.message;
    if (data) {
      return data;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

/**
 * Uploads a local file into the Google Drive folder INBOX (by folder id env, or first folder named INBOX).
 * OAuth: file thuộc quota user. Service Account: cần Shared Drive / delegation nếu không muốn lỗi quota.
 */
export async function uploadFileToInbox(
  localFilePath: string,
  originalFileName: string
): Promise<UploadToInboxResult> {
  console.log("[googleDriveService] uploadFileToInbox local path:", localFilePath);
  console.log("[googleDriveService] originalFileName:", originalFileName);
  console.log("[googleDriveService] auth mode:", resolveAuthMode());
  if (!existsSync(localFilePath)) {
    console.error("[googleDriveService] Local file missing before upload (multer path invalid?)");
  }

  let drive: drive_v3.Drive;
  try {
    drive = await getDrive();
  } catch (e) {
    console.error("[googleDriveService] getDrive() failed — full error:");
    console.error(e);
    if (e instanceof Error) {
      console.error("[googleDriveService] stack:\n", e.stack);
    }
    throw new Error(extractDriveMessage(e));
  }

  let folderId: string;
  try {
    folderId = await resolveInboxFolderId(drive);
    console.log("[googleDriveService] INBOX folder id:", folderId);
  } catch (e) {
    console.error("[googleDriveService] resolveInboxFolderId() failed — full error:");
    console.error(e);
    if (e instanceof Error) {
      console.error("[googleDriveService] stack:\n", e.stack);
    }
    throw new Error(`Google Drive (INBOX): ${extractDriveMessage(e)}`);
  }

  try {
    const created = await drive.files.create({
      requestBody: {
        name: originalFileName,
        parents: [folderId],
      },
      media: {
        body: createReadStream(localFilePath),
      },
      fields: "id, name, webViewLink",
      supportsAllDrives: true,
    });

    const fileId = created.data.id;
    if (!fileId) {
      throw new Error("Google Drive API returned no file id after upload.");
    }

    const driveLink =
      created.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`;

    return {
      fileId,
      driveLink,
      name: created.data.name ?? originalFileName,
    };
  } catch (e) {
    console.error("[googleDriveService] drive.files.create failed — full error:");
    console.error(e);
    if (e instanceof Error) {
      console.error("[googleDriveService] stack:\n", e.stack);
    }
    if (e && typeof e === "object" && "response" in e) {
      console.error("[googleDriveService] API response:", (e as { response?: unknown }).response);
    }
    throw new Error(`Google Drive upload failed: ${extractDriveMessage(e)}`);
  }
}
