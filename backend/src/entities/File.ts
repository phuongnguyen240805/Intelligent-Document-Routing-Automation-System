import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("files")
export class FileEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * Display name of the file (e.g. Google Drive name).
   */
  @Column({ name: "name", type: "varchar", length: 512 })
  name!: string;

  /**
   * Original name from the upload (multer).
   */
  @Column({ name: "original_name", type: "varchar", length: 512 })
  originalName!: string;

  @Column({ name: "size", type: "bigint" })
  size!: string;

  @Column({ name: "drive_link", type: "text", nullable: true })
  driveLink!: string | null;

  /**
   * External provider file id (e.g. Google Drive file id).
   */
  @Column({ name: "file_id", type: "varchar", length: 255, nullable: true })
  fileId!: string | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;
}

