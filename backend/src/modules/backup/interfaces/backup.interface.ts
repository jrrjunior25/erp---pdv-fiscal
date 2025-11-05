export interface BackupJob {
  id: string;
  type: 'FULL' | 'INCREMENTAL';
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  fileName: string;
  fileSize?: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface BackupOptions {
  type: 'FULL' | 'INCREMENTAL';
  compress?: boolean;
  includeFiles?: boolean;
}

export interface RestoreOptions {
  backupId: string;
  overwrite?: boolean;
}