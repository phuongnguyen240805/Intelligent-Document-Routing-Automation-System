import path from "path";
import * as dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";

import { AppDataSource } from "./data-source"; 
import { ensureUploadDir } from "./middlewares/upload.middleware";
import { multerErrorHandler } from "./middlewares/multer-error.middleware";
import { fileRouter } from "./routes/file.routes";

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response): any => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", fileRouter);

app.use(multerErrorHandler);

const PORT: number = parseInt(process.env.PORT ?? "3000", 10);

async function bootstrap(): Promise<void> {
  await ensureUploadDir();
  await AppDataSource.initialize();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend listening on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err: unknown) => {
  console.error("[bootstrap] failed:");
  console.error(err);
  if (err instanceof Error) {
    console.error("[bootstrap] stack:\n", err.stack);
  }
  process.exit(1);
});