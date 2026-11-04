import { Global, Injectable, Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

/** Cliente S3 genérico: funciona com MinIO (fork pgsty/minio) ou qualquer serviço S3. */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly log = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(cfg: ConfigService) {
    this.bucket = cfg.get('S3_BUCKET', 'dynamix-media');
    this.s3 = new S3Client({
      endpoint: cfg.get('S3_ENDPOINT', 'http://localhost:9000'),
      region: cfg.get('S3_REGION', 'us-east-1'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: cfg.get('S3_ACCESS_KEY', 'dynamix'),
        secretAccessKey: cfg.get('S3_SECRET_KEY', 'dynamix-secret'),
      },
    });
  }

  async onModuleInit() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.log.log(`Bucket "${this.bucket}" criado`);
      } catch (e) {
        this.log.warn(`Storage indisponível (${(e as Error).message}). Uploads falharão até o MinIO arrancar.`);
      }
    }
  }

  async put(key: string, body: Buffer, contentType: string) {
    await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
  }

  async get(key: string) {
    const res = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return { stream: res.Body as Readable, contentType: res.ContentType, length: res.ContentLength };
  }

  async remove(key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

@Global()
@Module({ providers: [StorageService], exports: [StorageService] })
export class StorageModule {}
