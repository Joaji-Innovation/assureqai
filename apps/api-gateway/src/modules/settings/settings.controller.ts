import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin') // Only super admin can change global settings
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) { }

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  async updateSettings(@Body() data: any) {
    return this.settingsService.updateSettings(data);
  }
}
