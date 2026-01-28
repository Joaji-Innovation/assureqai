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
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, LoginDto, ChangePasswordDto } from './dto';
import { Public, Roles, RequirePermissions, CurrentUser } from '@assureqai/auth';
import { ROLES, PERMISSIONS, JwtPayload, LIMITS } from '@assureqai/common';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

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
    await this.usersService.changePassword(user.sub, dto.currentPassword, dto.newPassword);
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
      user?.role === ROLES.SUPER_ADMIN
        ? projectId
        : user?.projectId;

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
