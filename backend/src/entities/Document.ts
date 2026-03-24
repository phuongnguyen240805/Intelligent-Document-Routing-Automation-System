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

  @Column({
    type: "varchar",
    length: 32,
    default: DocumentStatus.PENDING,
  })
  status!: DocumentStatus;
}
