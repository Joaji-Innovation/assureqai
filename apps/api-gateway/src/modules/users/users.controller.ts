/**
 * Users Controller
 * Authentication and user management endpoints
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
  Res,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  LoginDto,
  ChangePasswordDto,
  UpdateProfileDto,
  RegisterDto,
} from './dto';
import {
  Public,
  Roles,
  RequirePermissions,
  CurrentUser,
} from '@assureqai/auth';
import { ROLES, PERMISSIONS, JwtPayload, LIMITS } from '@assureqai/common';
import { ConfigService } from '@nestjs/config';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Login endpoint - public
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.usersService.login(dto, res);
  }

  /**
   * Logout endpoint
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and clear session' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  logout(@Res({ passthrough: true }) res: Response) {
    this.usersService.logout(res);
    return { success: true, message: 'Logged out' };
  }

  /**
   * Self-service registration - public (Mode B: shared multi-tenant)
   */
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new organization and admin user' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Only enabled on Mode B (shared multi-tenant) deployments
    if (this.configService.get('ENABLE_REGISTRATION') !== 'true') {
      throw new ForbiddenException(
        'Registration is disabled on this instance. Contact your administrator.',
      );
    }
    return this.usersService.register(dto, res);
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.findById(user.sub);
  }

  /**
   * Update own profile (fullName, email)
   */
  @Put('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.update(user.sub, dto);
  }

  /**
   * Change password
   */
  @Put('me/password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.usersService.changePassword(
      user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
    return { success: true, message: 'Password changed' };
  }

  /**
   * Create user - admin only
   */
  @Post()
  @ApiBearerAuth()
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    return this.usersService.create({
      ...dto,
      projectId: dto.projectId || user.projectId,
    });
  }

  /**
   * Get all users - paginated
   */
  @Get()
  @ApiBearerAuth()
  @RequirePermissions(PERMISSIONS.VIEW_USERS)
  @ApiOperation({ summary: 'Get paginated list of users' })
  @ApiResponse({ status: 200, description: 'Users retrieved' })
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = LIMITS.DEFAULT_PAGE_SIZE,
    @CurrentUser() user?: JwtPayload,
  ) {
    // Scope to project if not super admin
    const scopedProjectId =
      user?.role === ROLES.SUPER_ADMIN ? projectId : user?.projectId;

    return this.usersService.findAll(scopedProjectId, page, limit);
  }

  /**
   * Get user by ID
   */
  @Get(':id')
  @ApiBearerAuth()
  @RequirePermissions(PERMISSIONS.VIEW_USERS)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * Update user
   */
  @Put(':id')
  @ApiBearerAuth()
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  /**
   * Delete user
   */
  @Delete(':id')
  @ApiBearerAuth()
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  async delete(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { success: true, message: 'User deleted' };
  }
}
