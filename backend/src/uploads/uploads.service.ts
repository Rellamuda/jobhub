import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadPath = join(process.cwd(), 'public', 'uploads');
  private readonly fallbackPath = join(process.cwd(), '..', 'public', 'uploads');

  private s3Client: S3Client | null = null;
  private bucketName: string = '';
  private region: string = 'eu-north-1';
  private publicUrl: string = '';
  private endpoint: string = '';
  private isCloud: boolean = false;

  constructor() {
    this.initStorageProvider();
  }

  private initStorageProvider() {
    const bucket = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.R2_BUCKET_NAME;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
    const region = process.env.S3_REGION || process.env.AWS_REGION || 'eu-north-1';
    const endpoint = process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT || process.env.R2_ENDPOINT;
    const publicUrl = process.env.S3_PUBLIC_URL || process.env.CDN_URL || process.env.R2_PUBLIC_URL;
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';

    if (bucket && accessKeyId && secretAccessKey) {
      this.bucketName = bucket;
      this.region = region;
      this.endpoint = endpoint || '';
      this.publicUrl = publicUrl ? publicUrl.replace(/\/$/, '') : '';

      try {
        this.s3Client = new S3Client({
          region: this.region,
          ...(this.endpoint ? { endpoint: this.endpoint } : {}),
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
          forcePathStyle,
        });
        this.isCloud = true;
        this.logger.log(
          `☁️ Cloud Storage (S3/R2) initialized successfully. Bucket: "${this.bucketName}", Region: "${this.region}"${this.endpoint ? `, Endpoint: "${this.endpoint}"` : ''}`,
        );
      } catch (err: any) {
        this.logger.error(`Failed to initialize S3Client, falling back to local disk: ${err?.message || err}`);
        this.isCloud = false;
        this.s3Client = null;
      }
    } else {
      this.logger.log('📁 Cloud storage credentials not found. Using persistent local disk storage fallback.');
      this.isCloud = false;
    }
  }

  /**
   * Upload an Express Multer File to Cloud Storage or Local Disk
   */
  async uploadFile(file: Express.Multer.File, folder: string = 'profiles'): Promise<string> {
    const extension = extname(file.originalname) || '';
    const filename = `${uuidv4()}${extension}`;
    return this.saveBuffer(file.buffer, filename, folder, file.mimetype);
  }

  /**
   * Upload raw buffer to Cloud Storage or Local Disk
   */
  async uploadBuffer(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string = 'application/octet-stream',
    folder: string = 'documents',
  ): Promise<string> {
    const extension = extname(originalFilename) || '';
    const filename = `${uuidv4()}${extension}`;
    return this.saveBuffer(buffer, filename, folder, mimeType);
  }

  private async saveBuffer(
    buffer: Buffer,
    filename: string,
    folder: string,
    mimeType: string,
  ): Promise<string> {
    const key = `${folder}/${filename}`;

    // Cloud upload path (AWS S3 / Cloudflare R2 / S3-compatible)
    if (this.isCloud && this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
          }),
        );

        if (this.publicUrl) {
          return `${this.publicUrl}/${key}`;
        }

        if (this.endpoint && this.endpoint.includes('r2.cloudflarestorage.com')) {
          // If no custom public URL was set for R2, construct endpoint URL
          return `${this.endpoint.replace(/\/$/, '')}/${this.bucketName}/${key}`;
        }

        // Standard AWS S3 URL
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      } catch (error: any) {
        this.logger.error(`Cloud upload failed for key "${key}": ${error?.message || error}. Falling back to local disk.`, error?.stack);
        // Fall back to local disk so user operation doesn't fail
      }
    }

    // Local disk storage fallback
    try {
      const folderPath = join(this.uploadPath, folder);
      await fs.mkdir(folderPath, { recursive: true });
      await fs.writeFile(join(folderPath, filename), buffer);

      try {
        const fallbackFolderPath = join(this.fallbackPath, folder);
        await fs.mkdir(fallbackFolderPath, { recursive: true });
        await fs.writeFile(join(fallbackFolderPath, filename), buffer);
      } catch (e) {}

      return `/uploads/${folder}/${filename}`;
    } catch (error) {
      this.logger.error('Error saving file locally:', error);
      throw new InternalServerErrorException('Could not save file to disk');
    }
  }

  /**
   * Delete a file from Cloud Storage or Local Disk
   */
  async deleteFile(fileUrlOrKey: string): Promise<boolean> {
    if (!fileUrlOrKey) return false;

    // Check if cloud URL
    if (this.isCloud && this.s3Client) {
      try {
        let key = fileUrlOrKey;
        if (fileUrlOrKey.startsWith('http://') || fileUrlOrKey.startsWith('https://')) {
          const urlObj = new URL(fileUrlOrKey);
          key = urlObj.pathname.replace(/^\//, '');
          // If key starts with bucket name (path-style), strip it
          if (key.startsWith(`${this.bucketName}/`)) {
            key = key.substring(this.bucketName.length + 1);
          }
        } else if (fileUrlOrKey.startsWith('/uploads/')) {
          key = fileUrlOrKey.replace(/^\/uploads\//, '');
        }

        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          }),
        );
        return true;
      } catch (e: any) {
        this.logger.warn(`Failed to delete object from S3: ${e?.message || e}`);
      }
    }

    // Local disk deletion fallback
    try {
      const cleanPath = fileUrlOrKey.replace(/^\/uploads\//, '');
      const localFilePath = join(this.uploadPath, cleanPath);
      await fs.unlink(localFilePath).catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  isUsingCloud(): boolean {
    return this.isCloud;
  }
}
