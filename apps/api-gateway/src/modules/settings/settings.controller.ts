import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard, RolesGuard, Roles } from '@assureqai/auth';

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
