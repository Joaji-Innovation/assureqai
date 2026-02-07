/**
 * Provisioning Service - SSH deployment to client VPS
 * Handles remote deployment, updates, and instance management
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeSSH } from 'node-ssh';

export interface DeployConfig {
  host: string;
  port?: number;
  username: string;
  privateKey?: string;
  password?: string;
}

export interface DeployResult {
  success: boolean;
  logs: string[];
  duration: number;
  error?: string;
}

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(private configService: ConfigService) { }

  /**
   * Deploy a new client instance to remote VPS
   */
  async deploy(config: DeployConfig, options: {
    version: string;
    instanceId: string;
    mongoUri: string;
    apiKey: string;
    domain: string;
  }): Promise<DeployResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    const ssh = new NodeSSH();

    try {
      logs.push(`[${new Date().toISOString()}] Starting deployment to ${config.host}`);

      // Connect via SSH
      await ssh.connect({
        host: config.host,
        port: config.port || 22,
        username: config.username,
        privateKey: config.privateKey,
        password: config.password,
      });
      logs.push(`[${new Date().toISOString()}] SSH connection established`);

      // Check prerequisites
      const { stdout: dockerCheck } = await ssh.execCommand('docker --version');
      if (!dockerCheck.includes('Docker')) {
        throw new Error('Docker not installed on target VPS');
      }
      logs.push(`[${new Date().toISOString()}] Docker verified: ${dockerCheck.trim()}`);

      // Create deployment directory
      await ssh.execCommand('mkdir -p /opt/assureqai');
      logs.push(`[${new Date().toISOString()}] Created deployment directory`);

      // Generate docker-compose.yml
      const dockerCompose = this.generateDockerCompose(options);
      await ssh.execCommand(`cat > /opt/assureqai/docker-compose.yml << 'EOF'
${dockerCompose}
EOF`);
      logs.push(`[${new Date().toISOString()}] Docker Compose file created`);

      // Generate environment file
      const envFile = this.generateEnvFile(options);
      await ssh.execCommand(`cat > /opt/assureqai/.env << 'EOF'
${envFile}
EOF`);
      logs.push(`[${new Date().toISOString()}] Environment file created`);

      // Pull and start containers
      const { stdout: pullOutput } = await ssh.execCommand('cd /opt/assureqai && docker-compose pull');
      logs.push(`[${new Date().toISOString()}] Docker images pulled`);

      const { stdout: upOutput, stderr: upError } = await ssh.execCommand('cd /opt/assureqai && docker-compose up -d');
      if (upError && !upError.includes('Creating') && !upError.includes('Starting')) {
        throw new Error(`Docker compose failed: ${upError}`);
      }
      logs.push(`[${new Date().toISOString()}] Containers started`);

      // Verify health
      await new Promise(r => setTimeout(r, 5000)); // Wait for startup
      const { stdout: healthCheck } = await ssh.execCommand('curl -s http://localhost:3000/health || echo "FAILED"');
      if (healthCheck.includes('FAILED')) {
        logs.push(`[${new Date().toISOString()}] Warning: Health check failed, may need more time`);
      } else {
        logs.push(`[${new Date().toISOString()}] Health check passed`);
      }

      // Setup Caddy for SSL
      const caddyConfig = this.generateCaddyConfig(options.domain);
      await ssh.execCommand(`cat > /opt/assureqai/Caddyfile << 'EOF'
${caddyConfig}
EOF`);
      await ssh.execCommand('cd /opt/assureqai && docker-compose restart caddy 2>/dev/null || true');
      logs.push(`[${new Date().toISOString()}] Caddy configured for ${options.domain}`);

      ssh.dispose();

      return {
        success: true,
        logs,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      logs.push(`[${new Date().toISOString()}] ERROR: ${error.message}`);
      ssh.dispose();

      return {
        success: false,
        logs,
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Update an existing instance
   */
  async update(config: DeployConfig, version: string): Promise<DeployResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    const ssh = new NodeSSH();

    try {
      await ssh.connect({
        host: config.host,
        port: config.port || 22,
        username: config.username,
        privateKey: config.privateKey,
        password: config.password,
      });
      logs.push(`[${new Date().toISOString()}] Connected to ${config.host}`);

      // Pull latest images
      await ssh.execCommand('cd /opt/assureqai && docker-compose pull');
      logs.push(`[${new Date().toISOString()}] Pulled latest images`);

      // Restart with new version
      await ssh.execCommand('cd /opt/assureqai && docker-compose up -d');
      logs.push(`[${new Date().toISOString()}] Containers restarted`);

      ssh.dispose();

      return {
        success: true,
        logs,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      logs.push(`[${new Date().toISOString()}] ERROR: ${error.message}`);
      ssh.dispose();

      return {
        success: false,
        logs,
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Restart instance containers
   */
  async restart(config: DeployConfig): Promise<DeployResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    const ssh = new NodeSSH();

    try {
      await ssh.connect({
        host: config.host,
        port: config.port || 22,
        username: config.username,
        privateKey: config.privateKey,
        password: config.password,
      });

      await ssh.execCommand('cd /opt/assureqai && docker-compose restart');
      logs.push(`[${new Date().toISOString()}] Containers restarted`);

      ssh.dispose();

      return { success: true, logs, duration: Date.now() - startTime };
    } catch (error) {
      ssh.dispose();
      return { success: false, logs, duration: Date.now() - startTime, error: error.message };
    }
  }

  /**
   * Stop instance containers
   */
  async stop(config: DeployConfig): Promise<DeployResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    const ssh = new NodeSSH();

    try {
      await ssh.connect({
        host: config.host,
        port: config.port || 22,
        username: config.username,
        privateKey: config.privateKey,
        password: config.password,
      });

      await ssh.execCommand('cd /opt/assureqai && docker-compose stop');
      logs.push(`[${new Date().toISOString()}] Containers stopped`);

      ssh.dispose();

      return { success: true, logs, duration: Date.now() - startTime };
    } catch (error) {
      ssh.dispose();
      return { success: false, logs, duration: Date.now() - startTime, error: error.message };
    }
  }

  /**
   * Start instance containers
   */
  async start(config: DeployConfig): Promise<DeployResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    const ssh = new NodeSSH();

    try {
      await ssh.connect({
        host: config.host,
        port: config.port || 22,
        username: config.username,
        privateKey: config.privateKey,
        password: config.password,
      });

      await ssh.execCommand('cd /opt/assureqai && docker-compose up -d');
      logs.push(`[${new Date().toISOString()}] Containers started`);

      ssh.dispose();

      return { success: true, logs, duration: Date.now() - startTime };
    } catch (error) {
      ssh.dispose();
      return { success: false, logs, duration: Date.now() - startTime, error: error.message };
    }
  }

  /**
   * Get logs from instance
   */
  async getLogs(config: DeployConfig, lines = 100): Promise<{ logs: string; error?: string }> {
    const ssh = new NodeSSH();

    try {
      await ssh.connect({
        host: config.host,
        port: config.port || 22,
        username: config.username,
        privateKey: config.privateKey,
        password: config.password,
      });

      const { stdout } = await ssh.execCommand(`cd /opt/assureqai && docker-compose logs --tail=${lines}`);
      ssh.dispose();

      return { logs: stdout };
    } catch (error) {
      ssh.dispose();
      return { logs: '', error: error.message };
    }
  }

  /**
   * Check instance health
   */
  async checkHealth(config: DeployConfig): Promise<{
    healthy: boolean;
    status: string;
    containers?: any[];
  }> {
    const ssh = new NodeSSH();

    try {
      await ssh.connect({
        host: config.host,
        port: config.port || 22,
        username: config.username,
        privateKey: config.privateKey,
        password: config.password,
      });

      const { stdout: containers } = await ssh.execCommand('cd /opt/assureqai && docker-compose ps --format json 2>/dev/null || docker-compose ps');
      const { stdout: health } = await ssh.execCommand('curl -s http://localhost:3000/health || echo "UNREACHABLE"');

      ssh.dispose();

      const isHealthy = !health.includes('UNREACHABLE') && !health.includes('error');

      return {
        healthy: isHealthy,
        status: isHealthy ? 'running' : 'unhealthy',
        containers: containers ? [containers] : undefined,
      };
    } catch (error) {
      ssh.dispose();
      return { healthy: false, status: 'unreachable' };
    }
  }

  // Helper methods
  private generateDockerCompose(options: {
    version: string;
    instanceId: string;
    domain: string;
  }): string {
    return `version: '3.8'

services:
  app:
    image: assureqai/client-instance:${options.version}
    container_name: assureqai-app
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
      - redis
    networks:
      - assureqai

  worker:
    image: assureqai/client-worker:${options.version}
    container_name: assureqai-worker
    restart: unless-stopped
    env_file:
      - .env
    depends_on:
      - mongodb
      - redis
    networks:
      - assureqai

  mongodb:
    image: mongo:7
    container_name: assureqai-mongo
    restart: unless-stopped
    volumes:
      - mongodb_data:/data/db
    networks:
      - assureqai

  redis:
    image: redis:7-alpine
    container_name: assureqai-redis
    restart: unless-stopped
    networks:
      - assureqai

  caddy:
    image: caddy:2-alpine
    container_name: assureqai-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - assureqai

networks:
  assureqai:
    driver: bridge

volumes:
  mongodb_data:
  caddy_data:
  caddy_config:
`;
  }

  private generateEnvFile(options: {
    instanceId: string;
    mongoUri: string;
    apiKey: string;
    domain: string;
  }): string {
    return `# AssureQai Instance Configuration
INSTANCE_ID=${options.instanceId}
API_KEY=${options.apiKey}

# Database
MONGODB_URI=${options.mongoUri}

# Domain
DOMAIN=${options.domain}

# Node
NODE_ENV=production
PORT=3000

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
`;
  }

  private generateCaddyConfig(domain: string): string {
    return `${domain} {
  reverse_proxy app:3000
  
  encode gzip
  
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
    X-Content-Type-Options nosniff
    X-Frame-Options DENY
  }
}
`;
  }
}
