# AssureQai Platform

AI-powered quality assurance and audit platform for call centers.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- MongoDB 7.0+
- Redis 7+

### Development

```bash
# Install dependencies
npm install

# Start API Gateway
npx nx serve api-gateway

# Start Client Portal (separate terminal)
npx nx dev client-portal

# Start Admin Portal (separate terminal)
npx nx dev admin-portal
```

### Production (Docker)

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your values

# Build and start all services
docker-compose up -d

# With Nginx reverse proxy
docker-compose --profile with-nginx up -d
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 3000 | NestJS backend with MongoDB, Redis |
| Client Portal | 3001 | Next.js dashboard for clients |
| Admin Portal | 3002 | Next.js super-admin panel |
| MongoDB | 27017 | Database |
| Redis | 6379 | Cache & queue |

## Project Structure

```
apps/
├── api-gateway/       # NestJS API (audits, users, campaigns, AI)
├── client-portal/     # Next.js client dashboard (14 pages)
└── admin-portal/      # Next.js super-admin (10 pages)

libs/
├── constants/         # Shared constants
└── database/          # MongoDB schemas
```

## Features

### Client Portal
- Dashboard with stats & charts
- AI-powered audit (single & bulk)
- Manual audit forms
- Agent performance drilldown
- Transcript playback with annotations
- Real-time alerts & webhooks

### Admin Portal
- Client provisioning
- Instance management (start/stop)
- Domain & SSL management
- Usage tracking & limits
- Security & audit logs

## API Endpoints

```
POST /api/users/login      # Authenticate
GET  /api/users/me         # Current user
GET  /api/audits           # List audits
GET  /api/audits/stats     # Dashboard stats
POST /api/audits           # Create audit
GET  /api/campaigns        # List campaigns
POST /api/campaigns        # Start campaign
GET  /health               # Health check
```

## Environment Variables

See `.env.example` for all configuration options.

## License

Proprietary - AssureQai © 2025
