/**
 * Announcement Controller
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnnouncementService } from './announcement.service';
import { RequirePermissions, CurrentUser, Public } from '@assureqai/auth';
import { PERMISSIONS, JwtPayload } from '@assureqai/common';

@ApiTags('Announcements')
@ApiBearerAuth()
@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Create announcement' })
  async create(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.announcementService.create({
      ...dto,
      createdBy: user.sub,
    });
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get active announcements' })
  async findAll(@Query('all') all?: string) {
    return this.announcementService.findAll(all !== 'true');
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get announcement by ID' })
  async findOne(@Param('id') id: string) {
    return this.announcementService.findById(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Update announcement' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.announcementService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Delete announcement' })
  async delete(@Param('id') id: string) {
    await this.announcementService.delete(id);
    return { success: true };
  }

  @Put(':id/deactivate')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Deactivate announcement' })
  async deactivate(@Param('id') id: string) {
    return this.announcementService.deactivate(id);
  }
}
