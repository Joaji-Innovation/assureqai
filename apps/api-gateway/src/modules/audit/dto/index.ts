/**
 * Audit DTOs
 */
import { IsString, IsOptional, IsEnum, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditDto {
  @ApiProperty()
  @IsString()
  callId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  agentName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  agentUserId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  campaignId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  campaignName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ enum: ['ai', 'manual'] })
  @IsEnum(['ai', 'manual'])
  auditType: 'ai' | 'manual';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  transcript?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  englishTranslation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  callSummary?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  audioHash?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  auditResults?: any[];

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  overallScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  sentiment?: {
    overall: 'positive' | 'neutral' | 'negative';
    customerScore: number;
    agentScore: number;
  };

  @ApiPropertyOptional()
  @IsOptional()
  metrics?: {
    talkToListenRatio: number;
    silencePercentage: number;
  };

  @ApiPropertyOptional()
  @IsOptional()
  compliance?: {
    keywordsDetected: string[];
    violations: any[];
    complianceScore: number;
  };

  @ApiPropertyOptional()
  @IsOptional()
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  auditDurationMs?: number;
}

export class UpdateAuditDto {
  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  auditResults?: any[];

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  overallScore?: number;

  @ApiPropertyOptional({ enum: ['none', 'pending', 'approved', 'rejected'] })
  @IsEnum(['none', 'pending', 'approved', 'rejected'])
  @IsOptional()
  disputeStatus?: 'none' | 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  disputeReason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  disputeResolution?: string;
}

export class AuditFiltersDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  agentUserId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  campaignId?: string;

  @ApiPropertyOptional({ enum: ['ai', 'manual'] })
  @IsEnum(['ai', 'manual'])
  @IsOptional()
  auditType?: 'ai' | 'manual';

  @ApiPropertyOptional()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  minScore?: number;

  @ApiPropertyOptional({ enum: ['none', 'pending', 'approved', 'rejected'] })
  @IsEnum(['none', 'pending', 'approved', 'rejected'])
  @IsOptional()
  disputeStatus?: 'none' | 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
