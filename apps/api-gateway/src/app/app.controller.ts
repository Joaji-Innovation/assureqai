import { Controller, Get, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from '@assureqai/auth';
import { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Public()
  @Get('uploads/:filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'uploads', filename));
  }
}
