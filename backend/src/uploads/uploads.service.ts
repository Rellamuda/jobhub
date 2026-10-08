import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';

@Injectable()
export class UploadsService {
  private readonly uploadPath = join(process.cwd(), 'public', 'uploads');
  private readonly fallbackPath = join(process.cwd(), '..', 'public', 'uploads');

  async uploadFile(file: Express.Multer.File, folder: string = 'profiles'): Promise<string> {
    try {
      const extension = extname(file.originalname);
      const filename = `${uuidv4()}${extension}`;
      
      const folderPath = join(this.uploadPath, folder);
      await fs.mkdir(folderPath, { recursive: true });
      await fs.writeFile(join(folderPath, filename), file.buffer);

      try {
        const fallbackFolderPath = join(this.fallbackPath, folder);
        await fs.mkdir(fallbackFolderPath, { recursive: true });
        await fs.writeFile(join(fallbackFolderPath, filename), file.buffer);
      } catch (e) {}

      // Return the public URL
      return `/uploads/${folder}/${filename}`;
    } catch (error) {
      console.error('Error saving file locally:', error);
      throw new InternalServerErrorException('Could not save file');
    }
  }
}
