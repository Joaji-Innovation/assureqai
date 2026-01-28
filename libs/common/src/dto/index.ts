/**
 * Common DTOs (Data Transfer Objects)
 */

export interface LoginDto {
  username: string;
  password: string;
  totpCode?: string;
}

export interface PaginationDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeDto {
  startDate?: Date;
  endDate?: Date;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
  projectId?: string;
}

export interface UpdateUserDto {
  email?: string;
  fullName?: string;
  role?: string;
  projectId?: string;
  isActive?: boolean;
}
