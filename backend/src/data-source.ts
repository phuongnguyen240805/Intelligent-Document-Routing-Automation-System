import "reflect-metadata";
import { DataSource } from "typeorm";
import { Document } from "./entities/Document";
import { FileEntity } from "./entities/File";

const host = process.env.POSTGRES_HOST ?? "localhost";
const port = parseInt(process.env.POSTGRES_PORT ?? "5432", 10);
const username = process.env.POSTGRES_USER ?? "idras";
const password = process.env.POSTGRES_PASSWORD ?? "idras_secret";
const database = process.env.POSTGRES_DB ?? "idras";

export const AppDataSource = new DataSource({
  type: "postgres",
  host,
  port,
  username,
  password,
  database,
  entities: [Document, FileEntity],
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV === "development",
});
