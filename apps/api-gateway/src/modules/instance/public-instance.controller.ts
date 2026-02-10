/**
 * Public Instance Controller - Public endpoints for the running instance
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '@assureqai/auth';

@ApiTags('Instance - Public')
@Controller('instance')
export class PublicInstanceController {
  constructor(private configService: ConfigService) {}

  @Get('status')
  @Public()
  @ApiOperation({ summary: 'Get instance public status (reporting enabled?)' })
  getStatus() {
    const adminPanelUrl = this.configService.get<string>('ADMIN_PANEL_URL');
    const apiKey = this.configService.get<string>('INSTANCE_API_KEY');

    // Do NOT return secrets. Only boolean flags.
    return {
      usageReportingEnabled: !!(adminPanelUrl && apiKey),
      hasAdminUrl: !!adminPanelUrl,
      hasInstanceApiKey: !!apiKey,
    };
  }
}
