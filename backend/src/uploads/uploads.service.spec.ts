import { UploadsService } from './uploads.service';
import * as fs from 'fs/promises';

describe('UploadsService', () => {
  let service: UploadsService;

  beforeEach(() => {
    delete process.env.S3_BUCKET_NAME;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
    delete process.env.S3_ENDPOINT;
    delete process.env.S3_PUBLIC_URL;
    service = new UploadsService();
  });

  it('should default to local disk storage fallback when no cloud credentials provided', () => {
    expect(service.isUsingCloud()).toBe(false);
  });

  it('should upload a file to local disk and return relative /uploads path', async () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'avatar.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('mock image data'),
      size: 15,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    const url = await service.uploadFile(mockFile, 'profiles');
    expect(url).toMatch(/^\/uploads\/profiles\/[a-f0-9-]+\.png$/);

    // Clean up created file
    await service.deleteFile(url);
  });

  it('should initialize cloud storage when credentials are set', () => {
    process.env.S3_BUCKET_NAME = 'my-bucket';
    process.env.S3_ACCESS_KEY_ID = 'test-key-id';
    process.env.S3_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.S3_REGION = 'eu-north-1';

    const cloudService = new UploadsService();
    expect(cloudService.isUsingCloud()).toBe(true);
  });
});
