import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '@assureqai/auth';
import { RequirePermissions, CurrentUser } from '@assureqai/auth';
import { PERMISSIONS, JwtPayload } from '@assureqai/common';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('audit-call')
  @RequirePermissions(PERMISSIONS.PERFORM_AUDIT)
  @ApiOperation({ summary: 'Perform AI audit on call data' })
  @ApiResponse({ status: 200, description: 'Audit completed' })
  async auditCall(@Body() request: any, @CurrentUser() user: JwtPayload) {
    // Ideally use DTO, here relying on service validation
    return this.aiService.auditCall(request);
  }

  @Post('audit-chat')
  @ApiOperation({ summary: 'Chat with AI about an audit' })
  @ApiResponse({ status: 200, description: 'Chat response' })
  async chat(@Body() body: { message: string; context?: any }) {
    const response = await this.aiService.chat(body.message, body.context);
    return { response };
  }

  @Post('explain-concept')
  @ApiOperation({ summary: 'Explain a QA concept' })
  @ApiResponse({ status: 200, description: 'Concept explanation' })
  async explainConcept(@Body() body: { concept: string }) {
    const explanation = await this.aiService.explainConcept(body.concept);
    return { explanation };
  }
}
