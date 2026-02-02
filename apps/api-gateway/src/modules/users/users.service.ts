/**
 * Users Service
 * User management with password hashing and authentication
 */
import { Injectable, NotFoundException, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { Project, ProjectDocument } from '../../database/schemas/project.schema';
import { CreateUserDto, UpdateUserDto, LoginDto } from './dto';
import { PaginatedResult, LIMITS, JwtPayload, ROLES } from '@assureqai/common';
import { Response } from 'express';

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private jwtService: JwtService,
  ) { }

  /**
   * Create a new user
   */
  async create(dto: CreateUserDto): Promise<User> {
    // Check for existing user
    const existing = await this.userModel.findOne({
      $or: [{ username: dto.username }, { email: dto.email }],
    });

    if (existing) {
      throw new ConflictException(
        existing.username === dto.username
          ? 'Username already exists'
          : 'Email already exists',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = new this.userModel({
      ...dto,
      password: hashedPassword,
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : undefined,
    });

    const saved = await user.save();

    // Remove password from response
    const result = saved.toObject();
    delete (result as any).password;
    return result as User;
  }

  /**
   * Login user and return JWT token
   */
  async login(dto: LoginDto, res: Response): Promise<{ user: Partial<User>; accessToken: string }> {
    const user = await this.userModel.findOne({ username: dto.username });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Fix legacy role if present (Self-healing)
    if ((user.role as any) === 'Administrator') {
      user.role = ROLES.SUPER_ADMIN;
      this.logger.warn(`Migrated legacy user ${user.username} from Administrator to super_admin`);
    }

    // Auto-create default project if user doesn't have one
    if (!user.projectId) {
      const project = await this.ensureUserHasProject(user);
      user.projectId = project._id;
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT payload
    const payload: JwtPayload = {
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      projectId: user.projectId?.toString(),
    };

    const accessToken = this.jwtService.sign(payload);

    // Set HttpOnly cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return user without password
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    return {
      user: userResponse,
      accessToken,
    };
  }

  /**
   * Logout - clear cookie
   */
  logout(res: Response): void {
    res.clearCookie('access_token');
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Find users with pagination
   */
  async findAll(
    projectId?: string,
    page = 1,
    limit = LIMITS.DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResult<User>> {
    const query: Record<string, any> = {};
    if (projectId) {
      query.projectId = new Types.ObjectId(projectId);
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user
   */
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const updateData: Record<string, any> = { ...dto };

    // Hash new password if provided
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    if (dto.projectId) {
      updateData.projectId = new Types.ObjectId(dto.projectId);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();
  }

  /**
   * Ensure user has a project - use existing or create if missing
   */
  private async ensureUserHasProject(user: UserDocument): Promise<ProjectDocument> {
    // First, check if there's already a project in the database we can use
    // This handles the case where parameters/data were created before multi-project support
    const existingProject = await this.projectModel.findOne({ isActive: true }).sort({ createdAt: 1 }).exec();

    if (existingProject) {
      this.logger.log(`Assigned existing project ${existingProject._id} (${existingProject.name}) to user ${user.username}`);
      return existingProject;
    }

    // No existing project found, create a new one
    const project = new this.projectModel({
      name: `${user.username}'s Project`,
      description: `Default project for ${user.fullName || user.username}`,
      isActive: true,
      settings: {
        language: 'en',
        timezone: 'UTC',
      },
    });

    const savedProject = await project.save();
    this.logger.log(`Auto-created default project ${savedProject._id} for user ${user.username}`);

    return savedProject;
  }
}
