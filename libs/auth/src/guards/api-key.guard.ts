/**
 * API Key Authentication Guard
 * Validates X-API-Key header for instance-level authentication
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Instance interface for API key validation
interface InstanceDocument {
  _id: string;
  clientId: string;
  apiKey: string;
  status: string;
  database?: {
    type: 'shared' | 'isolated_db' | 'isolated_server';
    mongoUri?: string;
    dbName?: string;
  };
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private configService: ConfigService,
    @InjectModel('Instance') private instanceModel: Model<InstanceDocument>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    try {
      // Validate API key format (should be prefixed with 'aq_')
      if (!apiKey.startsWith('aq_')) {
        throw new UnauthorizedException('Invalid API key format');
      }

      // Check master key for admin access
      const masterKey = this.configService.get<string>('MASTER_API_KEY');
      if (masterKey && apiKey === masterKey) {
        request.apiKeyContext = {
          type: 'master',
          permissions: ['*'],
        };
        return true;
      }

      // Query database for Instance with matching API key
      const instance = await this.instanceModel.findOne({
        apiKey: apiKey,
        status: { $in: ['active', 'running'] }
      });

      if (!instance) {
        throw new UnauthorizedException('Invalid API key');
      }

      // Attach instance context to request
      request.apiKeyContext = {
        type: 'instance',
        instanceId: instance._id.toString(),
        clientId: instance.clientId,
        database: instance.database,
      };

      // Also attach instanceId for easy access
      request.instanceId = instance._id.toString();
      request.clientId = instance.clientId;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('API key validation error:', error);
      throw new UnauthorizedException('API key validation failed');
    }
  }

  private extractApiKey(request: any): string | null {
    // Check X-API-Key header
    const apiKey = request.headers['x-api-key'];
    if (apiKey) {
      return apiKey;
    }

    // Check Authorization header (Bearer token format)
    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer aqai_')) {
      return authHeader.substring(7);
    }

    // Check query parameter (for webhooks)
    if (request.query?.api_key) {
      return request.query.api_key;
    }

    return null;
  }
}

/**
 * API Key decorator for marking routes that accept API key auth
 */
import { SetMetadata } from '@nestjs/common';
export const API_KEY_AUTH = 'apiKeyAuth';
export const ApiKeyAuth = () => SetMetadata(API_KEY_AUTH, true);

/**
 * Helper to generate new API keys
 */
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'aqai_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}
