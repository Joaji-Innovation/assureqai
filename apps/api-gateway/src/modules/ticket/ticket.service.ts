/**
 * Ticket Service
 * Business logic for support tickets
 */
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ticket, TicketDocument, TICKET_STATUSES, TicketStatus, TicketPriority } from '../../database/schemas/ticket.schema';
import { ROLES } from '@assureqai/common';
import { IsString, IsOptional, IsArray, IsNotEmpty, IsEnum } from 'class-validator';

// DTOs
export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsOptional()
  @IsArray()
  attachments?: { name: string; url: string; type?: string; size?: number }[];
}

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  status?: TicketStatus;

  @IsString()
  @IsOptional()
  priority?: TicketPriority;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsString()
  @IsOptional()
  assignedToName?: string;
}

export class AddMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  isInternal?: boolean;
}

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
  ) { }

  /**
   * Create a new ticket
   */
  async create(
    dto: CreateTicketDto,
    userId: string,
    userName: string,
    userRole: string,
    projectId?: string,
  ): Promise<Ticket> {
    const ticket = new this.ticketModel({
      subject: dto.subject,
      description: dto.description,
      category: dto.category || 'other',
      priority: dto.priority || 'medium',
      status: TICKET_STATUSES.OPEN,
      createdBy: new Types.ObjectId(userId),
      createdByName: userName,
      projectId: projectId ? new Types.ObjectId(projectId) : undefined,
      attachments: dto.attachments || [],
      messages: [],
    });

    const saved = await ticket.save();
    this.logger.log(`Created ticket ${saved.ticketNumber} by ${userName}`);
    return saved;
  }

  /**
   * Find all tickets with filtering
   */
  async findAll(
    userId: string,
    role: string,
    projectId?: string,
    filters?: {
      status?: string;
      priority?: string;
      assignedTo?: string;
      search?: string;
    },
  ): Promise<Ticket[]> {
    const query: any = {};

    // Role-based access: super_admin sees all, others see their own or assigned
    if (role !== ROLES.SUPER_ADMIN && role !== 'client_admin') {
      query.$or = [
        { createdBy: new Types.ObjectId(userId) },
        { assignedTo: new Types.ObjectId(userId) },
      ];
    }

    // Apply filters
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.priority) {
      query.priority = filters.priority;
    }
    if (filters?.assignedTo) {
      query.assignedTo = new Types.ObjectId(filters.assignedTo);
    }
    if (filters?.search) {
      query.$or = [
        { ticketNumber: { $regex: filters.search, $options: 'i' } },
        { subject: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.ticketModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find ticket by ID
   */
  async findById(id: string, userId: string, role: string): Promise<Ticket> {
    const ticket = await this.ticketModel.findById(id).exec();

    if (!ticket) {
      throw new NotFoundException(`Ticket not found`);
    }

    // Check access: super_admin/client_admin can see all, others only their own or assigned
    if (role !== ROLES.SUPER_ADMIN && role !== 'client_admin') {
      const isOwner = ticket.createdBy.toString() === userId;
      const isAssigned = ticket.assignedTo?.toString() === userId;
      if (!isOwner && !isAssigned) {
        throw new ForbiddenException('You do not have access to this ticket');
      }
    }

    // Filter out internal messages for non-admin users
    if (role !== ROLES.SUPER_ADMIN && role !== 'client_admin') {
      ticket.messages = ticket.messages.filter(m => !m.isInternal);
    }

    return ticket;
  }

  /**
   * Update ticket (admin only)
   */
  async update(id: string, dto: UpdateTicketDto): Promise<Ticket> {
    const updateData: any = { ...dto };

    if (dto.assignedTo) {
      updateData.assignedTo = new Types.ObjectId(dto.assignedTo);
    }

    if (dto.status === TICKET_STATUSES.RESOLVED) {
      updateData.resolvedAt = new Date();
    }
    if (dto.status === TICKET_STATUSES.CLOSED) {
      updateData.closedAt = new Date();
    }

    const ticket = await this.ticketModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!ticket) {
      throw new NotFoundException(`Ticket not found`);
    }

    this.logger.log(`Updated ticket ${ticket.ticketNumber}`);
    return ticket;
  }

  /**
   * Add message to ticket
   */
  async addMessage(
    id: string,
    dto: AddMessageDto,
    userId: string,
    userName: string,
    userRole: string,
  ): Promise<Ticket> {
    const ticket = await this.ticketModel.findById(id).exec();

    if (!ticket) {
      throw new NotFoundException(`Ticket not found`);
    }

    // Check access for non-internal messages
    if (!dto.isInternal && userRole !== ROLES.SUPER_ADMIN && userRole !== 'client_admin') {
      const isOwner = ticket.createdBy.toString() === userId;
      const isAssigned = ticket.assignedTo?.toString() === userId;
      if (!isOwner && !isAssigned) {
        throw new ForbiddenException('You do not have access to this ticket');
      }
    }

    const message = {
      _id: new Types.ObjectId(),
      content: dto.content,
      author: new Types.ObjectId(userId),
      authorName: userName,
      authorRole: userRole,
      isInternal: dto.isInternal || false,
      createdAt: new Date(),
    };

    ticket.messages.push(message);

    // Update status if admin is replying
    if (userRole === ROLES.SUPER_ADMIN || userRole === 'client_admin') {
      if (ticket.status === TICKET_STATUSES.OPEN) {
        ticket.status = TICKET_STATUSES.IN_PROGRESS;
      }
    } else {
      // Customer replied - reopen if pending
      if (ticket.status === TICKET_STATUSES.PENDING_CUSTOMER) {
        ticket.status = TICKET_STATUSES.OPEN;
      }
    }

    const saved = await ticket.save();
    this.logger.log(`Added message to ticket ${ticket.ticketNumber} by ${userName}`);
    return saved;
  }

  /**
   * Assign ticket to user
   */
  async assign(id: string, assignedTo: string, assignedToName: string): Promise<Ticket> {
    const ticket = await this.ticketModel
      .findByIdAndUpdate(
        id,
        {
          assignedTo: new Types.ObjectId(assignedTo),
          assignedToName,
          status: TICKET_STATUSES.IN_PROGRESS,
        },
        { new: true },
      )
      .exec();

    if (!ticket) {
      throw new NotFoundException(`Ticket not found`);
    }

    this.logger.log(`Assigned ticket ${ticket.ticketNumber} to ${assignedToName}`);
    return ticket;
  }

  /**
   * Get ticket statistics
   */
  async getStats(projectId?: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    pendingCustomer: number;
    resolved: number;
    closed: number;
    byPriority: Record<string, number>;
  }> {
    const query: any = {};
    if (projectId) {
      query.projectId = new Types.ObjectId(projectId);
    }

    const [stats, priorityStats] = await Promise.all([
      this.ticketModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      this.ticketModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCounts: Record<string, number> = {};
    stats.forEach(s => {
      statusCounts[s._id] = s.count;
    });

    const priorityCounts: Record<string, number> = {};
    priorityStats.forEach(p => {
      priorityCounts[p._id] = p.count;
    });

    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    return {
      total,
      open: statusCounts[TICKET_STATUSES.OPEN] || 0,
      inProgress: statusCounts[TICKET_STATUSES.IN_PROGRESS] || 0,
      pendingCustomer: statusCounts[TICKET_STATUSES.PENDING_CUSTOMER] || 0,
      resolved: statusCounts[TICKET_STATUSES.RESOLVED] || 0,
      closed: statusCounts[TICKET_STATUSES.CLOSED] || 0,
      byPriority: priorityCounts,
    };
  }
}
