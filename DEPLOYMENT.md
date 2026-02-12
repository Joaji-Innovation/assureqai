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

| Variable           | Description                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `MONGODB_URI`      | MongoDB connection string                                                                 |
| `JWT_SECRET`       | Secret for JWT signing                                                                    |
| `GEMINI_API_KEY`   | Google Gemini API key                                                                     |
| `MASTER_API_KEY`   | Admin-level API key (optional)                                                            |
| `REDIS_URL`        | Redis for queues (optional)                                                               |
| `ADMIN_PANEL_URL`  | URL of the central admin API (e.g. `https://api.assureqai.app`) – enables usage reporting |
| `INSTANCE_API_KEY` | API key for this instance (generated in Admin Portal → Instances → Detail → API Key)      |

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

---

## Troubleshooting: 500 Error / Coolify Down

If Coolify crashes or shows a 500 error during a build, it is usually because the server ran out of **RAM (OOM Error)**. Building Next.js/NestJS apps is memory-intensive.

### 1. Immediate Fix (Restart Coolify)

SSH into your server and run:

```bash
# Check if containers are running
docker ps

# Restart Coolify
docker restart coolify

# If that fails, restart the proxy
docker restart coolify-proxy
```

### 2. Prevention: Enable Swap Space (Critical)

If your server has less than 4GB RAM, you **must** add swap space to prevent crashes during builds.

Run these commands on your VPS:

```bash
# Create 4GB swap file
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make it permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 3. Alternative: Build Locally

If the server is too small to build, use Coolify's "Build Locally" feature or push pre-built Docker images, but adding Swap is usually sufficient.

### 4. Advanced Recovery (If UI still won't load)

If restarting the container didn't work, the storage might be full or the proxy (Traefik) might be down.

**Run these commands in order:**

1. **Check Disk Space**:

   ```bash
   df -h
   # If Use% is 100%, run: docker system prune -a -f
   ```

2. **Force Restart All Services**:
   Coolify has a built-in upgrade script that also fixes broken containers:

   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```

   _Don't worry, this won't delete your data. It just pulls the latest images and recreates the containers._

3. **Check Logs**:
   ```bash
   docker logs coolify -n 50
   docker logs coolify-proxy -n 50
   ```

### 5. Disk Full (100% Usage)

If `df -h` shows your disk is 100% full, Coolify cannot write logs or create containers.

**Immediate Fix (Free up space):**
This deletes all stopped containers and unused images.

```bash
docker system prune -a -f
```

**Permanent Solution (Resize Disk):**
10GB is often too small. Increase your disk size to 30GB+ in your VPS provider's dashboard (Google Cloud/AWS/DigitalOcean).

**After increasing size in dashboard, run these commands to expand it in the OS:**

```bash
# 1. Expand the partition (usually partition 1)
sudo growpart /dev/sda 1

# 2. Resize the filesystem
sudo resize2fs /dev/sda1
```
