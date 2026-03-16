export interface StorageAdapter {
  download(options: DownloadOptions): Promise<void>;
  upload(options: UploadOptions): Promise<void>;
  exists(branch: string): Promise<boolean>;
}

export interface DownloadOptions {
  branch: string;
  destDir: string;
  onProgress?: (message: string) => void;
}

export interface UploadOptions {
  branch: string;
  sourceDir: string;
  shard?: string;
  onProgress?: (message: string) => void;
}
