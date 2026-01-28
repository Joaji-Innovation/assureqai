# AssureQAi Deployment Guide

## Deployment Options

### Option 1: Coolify (Recommended)

**Best for**: Managed deployments with auto-SSL, easy scaling, and UI-based management.

**Pros**:

- Auto SSL via Let's Encrypt
- Built-in reverse proxy (Traefik)
- Easy environment variable management
- One-click deployments from Git
- Built-in MongoDB/Redis add-ons

**Setup**:

1. Install Coolify on your server
2. Add Git repository
3. Configure environment variables
4. Set domain: `*.assureqai.app`
5. Deploy

**Wildcard SSL for subdomains**:

```yaml
# Coolify supports wildcard domains natively
# Configure: *.assureqai.app → your app
```

---

### Architecture: How Client Instances Work

**Crucial Concept**: You do **NOT** deploy a new server/container for each client.
With the Multi-Tenant architecture we implemented, you deploy the AssureQAi platform **once** (on Coolify or Docker).

1. **Shared Cloud (Standard)**:
   - **Infrastructure**: Single deployment of API + Portals + MongoDB.
   - **Onboarding**: When you create a client in Admin Portal, it just creates a **Database Record**.
   - **Isolation**: Verified by API Key & Project ID.
   - **No Coolify API needed**.

2. **Isolated Database**:
   - **Infrastructure**: Same single deployment.
   - **Onboarding**: Admin Portal creates a new logical database (e.g., `client_A`) on the _same_ MongoDB cluster.
   - **No Coolify API needed**.

3. **Isolated Server / On-Premise**:
   - **Infrastructure**: Deployment connects to a _remote_ MongoDB or VPS.
   - **Onboarding**: System uses SSH (for VPS) or Mongo URI (for remote DB).
   - **Coolify API**: Not required unless you want to auto-provision containers dynamically (advanced).

**Summary**: For 99% of cases, you just deploy the platform once. "Deploying" a client instance is instantaneous and handled purely by your application code, not by spinning up new servers.

---

### Option 2: Direct Docker

**Best for**: Full control, custom infrastructure, or existing Docker setups.

**Required Files**:

```yaml
# docker-compose.yml
version: '3.8'
services:
  api-gateway:
    build: ./apps/api-gateway
    ports:
      - '3000:3000'
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - mongo

  admin-portal:
    build: ./apps/admin-portal
    ports:
      - '3001:3000'
    environment:
      - NEXT_PUBLIC_API_URL=https://api.assureqai.app

  client-portal:
    build: ./apps/client-portal
    ports:
      - '3002:3000'
    environment:
      - NEXT_PUBLIC_API_URL=https://api.assureqai.app

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

  caddy:
    image: caddy:2
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data

volumes:
  mongo_data:
  caddy_data:
```

**Caddyfile for wildcard subdomains**:

```
*.assureqai.app {
  tls {
    on_demand
  }
  reverse_proxy client-portal:3000
}

admin.assureqai.app {
  reverse_proxy admin-portal:3000
}

api.assureqai.app {
  reverse_proxy api-gateway:3000
}
```

---

## Required Environment Variables

| Variable         | Description                    |
| ---------------- | ------------------------------ |
| `MONGODB_URI`    | MongoDB connection string      |
| `JWT_SECRET`     | Secret for JWT signing         |
| `GEMINI_API_KEY` | Google Gemini API key          |
| `MASTER_API_KEY` | Admin-level API key (optional) |
| `REDIS_URL`      | Redis for queues (optional)    |

---

## Recommendation

**Use Coolify** if:

- You want easy management
- Auto-SSL is important
- Single server deployment

**Use Direct Docker** if:

- You need custom infra
- Multi-server setup
- Kubernetes migration planned

---

## Post-Deployment Checklist

1. [ ] Create first admin user via API
2. [ ] Create your own instance via Admin Portal
3. [ ] Test: Create audit → Verify credit deduction
4. [ ] Configure DNS for `*.assureqai.app`
