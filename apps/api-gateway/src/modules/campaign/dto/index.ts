/**
 * Campaign DTOs
 */
import { IsString, IsOptional, IsArray, IsBoolean, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CampaignJobDto {
  @ApiProperty({ description: 'URL to the audio file' })
  @IsString()
  @IsNotEmpty()
  audioUrl: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  agentName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  callId?: string;
}

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ description: 'QA Parameter Set ID to use for auditing' })
  @IsString()
  @IsNotEmpty()
  qaParameterSetId: string;

  @ApiPropertyOptional({ description: 'Call language (e.g., Hindi, English)' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ description: 'Additional transcription language for translation' })
  @IsString()
  @IsOptional()
  transcriptionLanguage?: string;

  @ApiProperty({ type: [CampaignJobDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignJobDto)
  jobs: CampaignJobDto[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  applyRateLimit?: boolean;
}

export class UpdateCampaignDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
