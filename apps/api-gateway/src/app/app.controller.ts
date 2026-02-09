import {
  Controller,
  Get,
  Param,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from '@assureqai/auth';
import { Response } from 'express';
import { join, resolve, basename } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Public()
  @Get('uploads/:filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    // Sanitize filename to prevent path traversal
    const safeName = basename(filename);
    const uploadsDir = resolve(process.cwd(), 'uploads');
    const fullPath = resolve(uploadsDir, safeName);

    // Ensure resolved path stays within uploads directory
    if (!fullPath.startsWith(uploadsDir)) {
      throw new BadRequestException('Invalid filename');
    }

    return res.sendFile(fullPath);
  }
}
