import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { promises as fs, createReadStream } from 'fs';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import { Readable } from 'stream';

export interface UploadedObject {
  key: string;
  size: number;
}

export interface DownloadStream {
  stream: Readable;
  contentType?: string;
  contentLength?: number;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3?: S3Client;
  private bucketName?: string;
  private localDir!: string;
  private useS3 = false;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const endpoint = this.config.get<string>('BUCKET_ENDPOINT');
    const accessKeyId = this.config.get<string>('BUCKET_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('BUCKET_SECRET_ACCESS_KEY');
    const bucketName = this.config.get<string>('BUCKET_NAME');
    const region = this.config.get<string>('BUCKET_REGION') || 'us-east-1';

    if (endpoint && accessKeyId && secretAccessKey && bucketName) {
      this.s3 = new S3Client({
        endpoint,
        region,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
      });
      this.bucketName = bucketName;
      this.useS3 = true;
      this.logger.log(`Storage: S3 bucket "${bucketName}" via ${endpoint}`);
    } else {
      this.localDir = join(process.cwd(), 'uploads');
      await fs.mkdir(this.localDir, { recursive: true });
      this.logger.log(`Storage: local disk at ${this.localDir}`);
    }
  }

  async upload(file: Express.Multer.File): Promise<UploadedObject> {
    const key = `${uuid()}${extname(file.originalname)}`;

    if (this.useS3 && this.s3 && this.bucketName) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentLength: file.size,
        }),
      );
    } else {
      const filePath = join(this.localDir, key);
      await fs.writeFile(filePath, file.buffer);
    }

    return { key, size: file.size };
  }

  async download(key: string): Promise<DownloadStream> {
    if (this.useS3 && this.s3 && this.bucketName) {
      const res = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucketName, Key: key }),
      );
      if (!res.Body) throw new NotFoundException('File not found');
      return {
        stream: res.Body as Readable,
        contentType: res.ContentType,
        contentLength: res.ContentLength,
      };
    }

    const filePath = join(this.localDir, key);
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException('File not found');
    }
    return { stream: createReadStream(filePath) };
  }

  async remove(key: string): Promise<void> {
    if (this.useS3 && this.s3 && this.bucketName) {
      await this.s3
        .send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }))
        .catch(() => {});
      return;
    }
    const filePath = join(this.localDir, key);
    await fs.unlink(filePath).catch(() => {});
  }
}
