# Sahaya Pragathi Backend - Setup Guide

## Prerequisites Setup

### 1. Install MongoDB

#### Windows:

1. **Download MongoDB Community Server:**

   - Visit: https://www.mongodb.com/try/download/community
   - Download the Windows MSI installer
   - Run the installer and follow the setup wizard

2. **Install as a Windows Service** (recommended):

   - During installation, check "Install MongoDB as a Service"
   - This will automatically start MongoDB on system boot

3. **Verify Installation:**
   ```bash
   mongod --version
   ```

#### Alternative - MongoDB Atlas (Cloud Database):

If you prefer not to install MongoDB locally:

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sahaya-pragathi?retryWrites=true&w=majority
   ```

### 2. Start MongoDB (Local Installation)

#### Windows:

```bash
# If installed as a service, it should already be running
# Check status:
net start | findstr MongoDB

# If not running, start it:
net start MongoDB

# Or start manually:
mongod
```

#### Verify MongoDB is Running:

```bash
# Connect to MongoDB shell
mongosh

# Or check if port 27017 is listening
netstat -an | findstr 27017
```

### 3. Install Node.js Dependencies

```bash
cd backend
npm install
```

### 4. Configure Environment

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your settings (already configured for local MongoDB)

### 5. Start the Backend Server

#### Development Mode (with auto-reload):

```bash
npm run dev
```

#### Production Mode:

```bash
npm start
```

### 6. Verify Server is Running

Once started, you should see:

```
✅ MongoDB connected successfully
📊 Database: sahaya-pragathi
🚀 Server is running on port 5000
📍 Environment: development
🌐 API Base URL: http://localhost:5000
```

### 7. Test the API

#### Health Check:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-11-06T...",
  "uptime": 123.456,
  "database": {
    "status": "connected",
    "name": "sahaya-pragathi"
  },
  "memory": {
    "heapUsed": "25 MB",
    "heapTotal": "35 MB"
  }
}
```

#### Test Root Endpoint:

```bash
curl http://localhost:5000/
```

#### Create a Test Case:

```bash
curl -X POST http://localhost:5000/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "caseType": "grievance",
    "citizenName": "Test User",
    "subject": "Test Grievance",
    "description": "This is a test case",
    "department": "Public Works",
    "priority": "medium"
  }'
```

## Troubleshooting

### MongoDB Connection Issues

**Error: `MongoNetworkError: connect ECONNREFUSED`**

- MongoDB is not running
- Start MongoDB service (see step 2 above)

**Error: `Authentication failed`**

- Check your MongoDB credentials in `.env`
- Make sure the database user has proper permissions

### Port Already in Use

**Error: `Port 5000 is already in use`**

```bash
# Windows - Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change the PORT in .env file
PORT=3000
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Quick Start Commands

```bash
# 1. Start MongoDB (if not running as service)
net start MongoDB

# 2. Navigate to backend
cd backend

# 3. Install dependencies (first time only)
npm install

# 4. Start development server
npm run dev

# 5. In another terminal, test the API
curl http://localhost:5000/api/health
```

## Production Deployment

### Environment Variables

Make sure to update these in production:

- `JWT_SECRET` - Use a strong random secret
- `MONGODB_URI` - Point to production database
- `NODE_ENV` - Set to `production`
- `CORS_ORIGIN` - Set to your frontend domain

### Security Considerations

1. Never commit `.env` file
2. Use environment-specific configurations
3. Enable MongoDB authentication
4. Use HTTPS in production
5. Implement rate limiting
6. Add authentication middleware to protected routes

## Next Steps

1. ✅ MongoDB installed and running
2. ✅ Backend server running
3. ✅ API endpoints working
4. 🔄 Connect frontend to backend
5. 🔄 Implement authentication
6. 🔄 Add more API endpoints as needed
7. 🔄 Set up production database

## API Documentation

Full API documentation available in `README.md`

## Support

For issues or questions:

- Check the logs in the terminal
- Review error messages
- Ensure MongoDB is running
- Verify environment variables are correct
