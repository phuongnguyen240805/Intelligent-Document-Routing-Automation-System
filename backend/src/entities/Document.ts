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

  @Column({ type: "varchar", length: 512 })
  name!: string;

  @Column({ name: "google_drive_id", type: "varchar", length: 256, nullable: true })
  googleDriveId!: string | null;

  /**
   * Kết quả phân loại từ AI (lưu theo raw string để dễ thay đổi taxonomy theo thời gian).
   * Ví dụ: "Hóa đơn" | "Hợp đồng" | "CV / Resume" | ...
   */
  @Column({ type: "varchar", length: 128, nullable: true })
  category!: string | null;

  /**
   * Độ tự tin (0..1). Lưu dạng numeric để không bị mất precision như float.
   */
  @Column({ type: "numeric", precision: 4, scale: 3, nullable: true })
  confidence!: string | null;

  /** Lý do ngắn gọn do AI trả về. */
  @Column({ type: "text", nullable: true })
  reason!: string | null;

  /** MIME type của file (nếu lấy được từ Drive). */
  @Column({ name: "mime_type", type: "varchar", length: 255, nullable: true })
  mimeType!: string | null;

  /** Nguồn xử lý (vd: n8n_system / manual / api). */
  @Column({ type: "varchar", length: 64, nullable: true })
  source!: string | null;

  /** Thời điểm phân loại/ghi nhận (timestamptz). */
  @Column({ name: "classified_at", type: "timestamptz", nullable: true })
  classifiedAt!: Date | null;
  // ****************************

  @Column({
    type: "varchar",
    length: 32,
    default: DocumentStatus.PENDING,
  })
  status!: DocumentStatus;
}
