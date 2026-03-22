import "reflect-metadata";
import { DataSource } from "typeorm";
import { Document } from "./entities/Document";

/**
 * Kết nối Postgres (TypeORM) — bản sơ khai: biến môi trường + synchronize cho dev.
 * Production: tắt synchronize, dùng migration.
 */
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  database: process.env.DB_NAME ?? "idras",
  synchronize: process.env.DB_SYNCHRONIZE !== "false",
  logging: process.env.DB_LOGGING === "true",
  entities: [Document],
});
