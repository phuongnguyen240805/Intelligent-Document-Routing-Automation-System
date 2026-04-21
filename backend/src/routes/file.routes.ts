import { Router } from "express";

import {
  getAllFiles,
  getFileById,
  searchDocuments,
  // searchFiles,
  uploadFile,
} from "../controllers/file.controller";
import { upload } from "../middlewares/upload.middleware";

export const fileRouter = Router();

fileRouter.post("/upload", upload.single("file"), uploadFile);

fileRouter.get("/files", getAllFiles);
fileRouter.get("/files/search", searchDocuments);
fileRouter.get("/files/:id", getFileById);

