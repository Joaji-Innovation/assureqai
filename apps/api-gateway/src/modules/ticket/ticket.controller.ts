/**
 * Ticket Controller
 * API endpoints for support tickets
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TicketService, CreateTicketDto, UpdateTicketDto, AddMessageDto } from './ticket.service';
import { RequirePermissions, CurrentUser, Public } from '@assureqai/auth';
import { PERMISSIONS, JwtPayload, ROLES } from '@assureqai/common';

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) { }

  /**
   * Create a new ticket
   */
  @Post()
  @ApiOperation({ summary: 'Create a new support ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ticketService.create(
      dto,
      user.sub,
      user.username,
      user.role,
      user.projectId,
      user.organizationId,
    );
  }

  /**
   * Get all tickets (filtered by role)
   */
  @Get()
  @ApiOperation({ summary: 'Get all tickets' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
  ) {
    return this.ticketService.findAll(
      user.sub,
      user.role,
      user.projectId,
      { status, priority, assignedTo, search },
      user.organizationId,
    );
  }

  /**
   * Get ticket statistics
   */
  @Get('stats')
  @RequirePermissions(PERMISSIONS.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get ticket statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStats(@CurrentUser() user: JwtPayload) {
    const projectId = user.role === ROLES.SUPER_ADMIN ? undefined : user.projectId;
    return this.ticketService.getStats(projectId, user.organizationId);
  }

  /**
   * Get ticket by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ticketService.findById(id, user.sub, user.role);
  }

  /**
   * Update ticket
   */
  @Put(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  @ApiOperation({ summary: 'Update ticket' })
  @ApiResponse({ status: 200, description: 'Ticket updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketService.update(id, dto);
  }

  /**
   * Add message to ticket
   */
  @Post(':id/messages')
  @ApiOperation({ summary: 'Add message to ticket' })
  @ApiResponse({ status: 201, description: 'Message added' })
  async addMessage(
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ticketService.addMessage(
      id,
      dto,
      user.sub,
      user.username,
      user.role,
    );
  }

  /**
   * Assign ticket to user
   */
  @Put(':id/assign')
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  @ApiOperation({ summary: 'Assign ticket to user' })
  @ApiResponse({ status: 200, description: 'Ticket assigned' })
  async assign(
    @Param('id') id: string,
    @Body() dto: { assignedTo: string; assignedToName: string },
  ) {
    return this.ticketService.assign(id, dto.assignedTo, dto.assignedToName);
  }

  /**
   * Update ticket status
   */
  @Put(':id/status')
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  @ApiOperation({ summary: 'Update ticket status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: string },
  ) {
    return this.ticketService.update(id, { status: dto.status as any });
  }
}
