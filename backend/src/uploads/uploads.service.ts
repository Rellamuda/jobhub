import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';

@Injectable()
export class UploadsService {
  private readonly uploadPath = join(process.cwd(), '..', 'public', 'uploads');

  async uploadFile(file: Express.Multer.File, folder: string = 'profiles'): Promise<string> {
    try {
      const extension = extname(file.originalname);
      const filename = `${uuidv4()}${extension}`;
      const folderPath = join(this.uploadPath, folder);
      
      // Ensure directory exists
      await fs.mkdir(folderPath, { recursive: true });
      
      const filePath = join(folderPath, filename);
      await fs.writeFile(filePath, file.buffer);

      // Return the public URL
      return `/uploads/${folder}/${filename}`;
    } catch (error) {
      console.error('Error saving file locally:', error);
      throw new InternalServerErrorException('Could not save file');
    }
  }
}
