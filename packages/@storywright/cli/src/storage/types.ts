export interface StorageAdapter {
	download(options: DownloadOptions): Promise<void>;
	upload(options: UploadOptions): Promise<void>;
	exists(branch: string): Promise<boolean>;
}

export interface DownloadOptions {
	branch: string;
	destDir: string;
}

export interface UploadOptions {
	branch: string;
	sourceDir: string;
	compression?: 'zstd' | 'gzip' | 'none';
}
