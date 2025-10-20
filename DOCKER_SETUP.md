# AuthKit Docker Setup

## 🐳 **Docker Compose Configuration**

Complete containerized setup for AuthKit with backend, frontend, and PostgreSQL database.

## 📋 **Services Overview**

### **1. PostgreSQL Database**
- **Image**: `postgres:15`
- **Container**: `authkit_postgres`
- **Port**: `5432:5432`
- **Volume**: `postgres_data` (persists data locally)
- **Health Check**: Automatic readiness check

### **2. Backend API Server**
- **Image**: `node:18`
- **Container**: `authkit_backend`
- **Port**: `5000:3000` (host:container)
- **Command**: `npm run dev`
- **Environment**:
  - ⚠️ **COMPOSE_ENV**: "DEMO MODE: Credentials are hardcoded for demo only"
  - **GOOGLE_CLIENT_ID**: `AUTHKIT_DEMO_CLIENT_ID`
  - **GOOGLE_CLIENT_SECRET**: `AUTHKIT_DEMO_SECRET`
  - JWT configuration with 15-minute access tokens
  - Database connection settings

### **3. Frontend React App**
- **Image**: `node:18`
- **Container**: `authkit_frontend`
- **Port**: `3000:3000`
- **Command**: `npm start`
- **Pre-configured Demo Credentials**:
  - **REACT_APP_DEMO_EMAIL**: `demo@authkit.com`
  - **REACT_APP_DEMO_PASSWORD**: `password`
  - **REACT_APP_API_URL**: `http://localhost:5000`
  - **REACT_APP_DEMO_MODE**: `true`

## 🚀 **Quick Start**

### **1. Start All Services**
```bash
docker-compose up -d
```

### **2. View Logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### **3. Stop Services**
```bash
docker-compose down
```

### **4. Stop and Remove Volumes**
```bash
docker-compose down -v
```

## 🔧 **Service Details**

### **Backend Service**
```yaml
backend:
  image: node:18
  ports:
    - "5000:3000"
  command: npm run dev
  environment:
    COMPOSE_ENV: "DEMO MODE: Credentials are hardcoded for demo only"
    GOOGLE_CLIENT_ID: AUTHKIT_DEMO_CLIENT_ID
    GOOGLE_CLIENT_SECRET: AUTHKIT_DEMO_SECRET
  volumes:
    - ./:/app
    - /app/node_modules
```

**Features:**
- Hot reload with `npm run dev`
- Hardcoded demo Google OAuth credentials
- Warning environment variable for demo mode
- Persistent node_modules volume

### **Frontend Service**
```yaml
frontend:
  image: node:18
  ports:
    - "3000:3000"
  command: npm start
  environment:
    REACT_APP_DEMO_EMAIL: demo@authkit.com
    REACT_APP_DEMO_PASSWORD: password
    REACT_APP_API_URL: http://localhost:5000
  volumes:
    - ./frontend:/app/frontend
    - /app/frontend/node_modules
```

**Features:**
- React development server
- Pre-configured demo credentials
- Hot reload enabled
- API URL configured for backend

### **Database Service**
```yaml
postgres:
  image: postgres:15
  ports:
    - "5432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql
```

**Features:**
- PostgreSQL 15
- Persistent data volume
- Auto-initialization with init.sql
- Health check for service readiness

## 📊 **Port Mapping**

| Service | Host Port | Container Port | URL |
|---------|-----------|----------------|-----|
| Frontend | 3000 | 3000 | http://localhost:3000 |
| Backend | 5000 | 3000 | http://localhost:5000 |
| PostgreSQL | 5432 | 5432 | localhost:5432 |

## 💾 **Volumes**

### **Persistent Data**
```yaml
volumes:
  postgres_data:
    driver: local
```

**Purpose:**
- Database data persists across container restarts
- Located in Docker's volume storage
- Can be backed up using Docker commands

### **Development Volumes**
```yaml
# Backend
- ./:/app
- /app/node_modules

# Frontend
- ./frontend:/app/frontend
- /app/frontend/node_modules
```

**Purpose:**
- Live code reloading
- Separate node_modules for each service
- Development efficiency

## ⚠️ **Demo Mode Warnings**

### **Environment Variables**
```bash
# Backend
COMPOSE_ENV="DEMO MODE: Credentials are hardcoded for demo only"
GOOGLE_CLIENT_ID=AUTHKIT_DEMO_CLIENT_ID
GOOGLE_CLIENT_SECRET=AUTHKIT_DEMO_SECRET

# Frontend
REACT_APP_DEMO_MODE="true"
REACT_APP_WARNING="DEMO MODE: Using hardcoded credentials for testing only"
```

### **Critical Notes**
- ⚠️ **NEVER use demo credentials in production**
- ⚠️ **Replace Google OAuth credentials before deployment**
- ⚠️ **Change all secrets and passwords**
- ⚠️ **Use environment-specific configuration**

## 🔨 **Development Workflow**

### **Initial Setup**
```bash
# 1. Clone repository
git clone https://github.com/Om7035/AuthKit.git
cd AuthKit

# 2. Start services
docker-compose up -d

# 3. Wait for services to be ready
docker-compose logs -f

# 4. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Database: localhost:5432
```

### **Making Changes**
```bash
# Code changes are automatically detected
# Backend: nodemon restarts on file changes
# Frontend: React hot reload updates browser

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### **Database Management**
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U authkit_user -d authkit

# Backup database
docker-compose exec postgres pg_dump -U authkit_user authkit > backup.sql

# Restore database
docker-compose exec -T postgres psql -U authkit_user authkit < backup.sql
```

## 🧪 **Testing**

### **Access Services**
```bash
# Frontend
curl http://localhost:3000

# Backend Health Check
curl http://localhost:5000/health

# Backend API Status
curl http://localhost:5000/api/status

# Google OAuth Status
curl http://localhost:5000/api/auth/google/status
```

### **Demo Login**
```bash
# Using demo credentials
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@authkit.com","password":"password"}'
```

## 🛠️ **Troubleshooting**

### **Services Not Starting**
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs

# Restart services
docker-compose restart
```

### **Database Connection Issues**
```bash
# Check database health
docker-compose exec postgres pg_isready -U authkit_user

# Restart database
docker-compose restart postgres
```

### **Port Conflicts**
```bash
# Check if ports are in use
netstat -an | findstr "3000"
netstat -an | findstr "5000"
netstat -an | findstr "5432"

# Change ports in docker-compose.yml if needed
```

### **Clean Restart**
```bash
# Stop and remove everything
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

## 📦 **Production Deployment**

### **Before Deploying**
1. **Replace demo credentials**:
   - Generate real Google OAuth credentials
   - Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

2. **Update secrets**:
   - Generate strong JWT secrets (32+ characters)
   - Update database passwords
   - Update cookie secrets

3. **Configure environment**:
   - Set `NODE_ENV=production`
   - Update CORS origins
   - Configure proper domains

4. **Security**:
   - Remove demo mode warnings
   - Enable HTTPS
   - Configure firewall rules
   - Set up SSL certificates

### **Production docker-compose.yml**
```yaml
# Use production-ready images
backend:
  build: ./backend
  environment:
    NODE_ENV: production
    # Use secrets management
    
frontend:
  build: ./frontend
  # Use nginx for production
```

## 🎯 **Summary**

✅ **Backend**: node:18 with npm run dev  
✅ **Frontend**: node:18 with npm start  
✅ **Database**: postgres:15 with persistent volume  
✅ **Ports**: Frontend (3000), Backend (5000), DB (5432)  
✅ **Demo Credentials**: Hardcoded in environment  
✅ **Warning**: COMPOSE_ENV variable added  
✅ **Volumes**: Local data persistence enabled  

**Ready to run with `docker-compose up -d`!**
