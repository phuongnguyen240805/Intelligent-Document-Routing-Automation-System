import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export enum DocumentStatus {
  PENDING = "pending",
  UPLOADED = "uploaded",
  FAILED = "failed",
}

@Entity("documents")
export class Document {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // 1. Tên File -> fileName
  @Column({ name: "file_name", type: "varchar", length: 512 })
  fileName!: string;

  // 2. Loại File -> fileType
  @Column({ name: "file_type", type: "varchar", length: 100, nullable: true })
  fileType!: string | null;

  // 3. Phân Loại -> category
  @Column({ name: "category", type: "varchar", length: 100, nullable: true })
  category!: string | null;

  // 4. Độ Tự Tin -> confidence
  @Column({ name: "confidence", type: "numeric", precision: 4, scale: 3, nullable: true })
  confidence!: number | null;

  // 5. Lý Do -> reason
  @Column({ name: "reason", type: "text", nullable: true })
  reason!: string | null;

  // 6. Thời Gian -> processedAt
  @Column({ name: "processed_at", type: "timestamptz", nullable: true })
  processedAt!: Date | null;

  // 7. Nguồn -> source
  @Column({ name: "source", type: "varchar", length: 100, nullable: true })
  source!: string | null;

  // 8. Trạng Thái -> status
  @Column({ name: "status", type: "varchar", length: 50, default: "pending" })
  status!: string;

  // 9. ID File gốc (Dành cho Google Drive ID)
  @Column({ name: "google_drive_id", type: "varchar", length: 255, nullable: true })
  googleDriveId!: string | null;
}