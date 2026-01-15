# Sahaya Pragathi - Backend API

RESTful backend API server for the Sahaya Pragathi Government Service Management System, built with **Node.js**, **Express.js**, and **MongoDB**.

## 🌟 Overview

This backend provides a comprehensive API for managing government services including grievances, appointments, emergencies, disputes, temple letters, relief funds, education support, and CSR initiatives.

## 🛠️ Technologies

- **Node.js** v18+ - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** v6+ - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher) - Running locally or cloud (MongoDB Atlas)
- **npm** or **yarn** package manager

## ⚙️ Installation

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/sahaya-pragathi

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS
CORS_ORIGIN=http://localhost:8080

# Optional: MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sahaya-pragathi?retryWrites=true&w=majority
```

### 4. Ensure MongoDB is Running

**Local MongoDB:**

```bash
mongod
```

**Or use MongoDB Atlas** (Cloud) - Update `MONGODB_URI` with your connection string

## 🚀 Running the Server

### Development Mode (with auto-reload using nodemon)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server will start on `http://localhost:5000` (or PORT specified in .env)

## 📡 API Endpoints

### Health & Status

```
GET  /api/health           # Server health check
GET  /api/health/db        # Database connection status
```

### Authentication & Users

```
POST   /api/users/register        # Register new user
POST   /api/users/login           # Login user (returns JWT token)
GET    /api/users                 # Get all users (admin only)
GET    /api/users/:id             # Get user by ID
PUT    /api/users/:id             # Update user profile
POST   /api/users/:id/change-password  # Change password
DELETE /api/users/:id             # Deactivate user account
```

### Cases (Generic Case Management)

```
GET    /api/cases                 # Get all cases (with filters)
GET    /api/cases/:id             # Get single case details
POST   /api/cases                 # Create new case/task
PUT    /api/cases/:id             # Update case
PATCH  /api/cases/:id/status      # Update case status
POST   /api/cases/:id/comments    # Add comment to case
GET    /api/cases/stats/dashboard # Get case statistics
DELETE /api/cases/:id             # Close/delete case
```

### Appointments

```
GET    /api/appointments          # Get all appointments
GET    /api/appointments/:id      # Get appointment details
POST   /api/appointments          # Book new appointment
PUT    /api/appointments/:id      # Update appointment
PATCH  /api/appointments/:id/status  # Confirm/cancel appointment
POST   /api/appointments/:id/assign  # Assign to official
DELETE /api/appointments/:id      # Delete appointment
GET    /api/appointments/stats/overview  # Appointment statistics
```

### Emergencies

```
GET    /api/emergencies           # Get all emergency requests
GET    /api/emergencies/:id       # Get emergency details
POST   /api/emergencies           # Log new emergency
PUT    /api/emergencies/:id       # Update emergency
PATCH  /api/emergencies/:id/status    # Update status (LOGGED, DISPATCHED, RESOLVED)
POST   /api/emergencies/:id/assign    # Assign responder
POST   /api/emergencies/:id/escalate  # Escalate emergency
DELETE /api/emergencies/:id       # Close emergency
GET    /api/emergencies/stats/overview  # Emergency statistics
```

### Disputes

```
GET    /api/disputes              # Get all dispute cases
GET    /api/disputes/:id          # Get dispute details
POST   /api/disputes              # File new dispute
PUT    /api/disputes/:id          # Update dispute
PATCH  /api/disputes/:id/status   # Update status
POST   /api/disputes/:id/mediation  # Schedule mediation
DELETE /api/disputes/:id          # Close dispute
```

### Temple Darshan Letters

```
GET    /api/temples               # Get all temple letter requests
GET    /api/temples/:id           # Get temple letter details
POST   /api/temples               # Submit new request
PUT    /api/temples/:id           # Update request
POST   /api/temples/:id/comments  # Add comment
DELETE /api/temples/:id           # Cancel request
GET    /api/temples/stats/summary # Temple request statistics
```

### CM Relief Fund (CMRF)

```
GET    /api/cmrelief              # Get all CMRF applications
GET    /api/cmrelief/:id          # Get application details
POST   /api/cmrelief              # Submit new application
PUT    /api/cmrelief/:id          # Update application
PATCH  /api/cmrelief/:id/status   # Update status
DELETE /api/cmrelief/:id          # Close application
GET    /api/cmrelief/stats/summary # CMRF statistics
```

### Education Support

```
GET    /api/education             # Get all education requests
GET    /api/education/:id         # Get request details
POST   /api/education             # Submit new request
PUT    /api/education/:id         # Update request
DELETE /api/education/:id         # Close request
GET    /api/education/stats/summary # Education statistics
```

### CSR & Industrial Relations

```
GET    /api/csrindustrial         # Get all CSR proposals
GET    /api/csrindustrial/:id     # Get proposal details
POST   /api/csrindustrial         # Submit new proposal
PUT    /api/csrindustrial/:id     # Update proposal
PATCH  /api/csrindustrial/:id/status  # Update status
DELETE /api/csrindustrial/:id     # Close proposal
GET    /api/csrindustrial/stats/summary # CSR statistics
```

## 🗄️ Database Models

### User Model

- Authentication (email, hashed password)
- Profile (firstName, lastName, role)
- Role-based access control (citizen, L3, L2, L1, executive, admin, master-admin)
- Preferences and settings

### Case Model

- Generic case/task management
- Case type (grievance, task, program)
- Citizen information with nested contact object
- Status workflow and history
- SLA tracking with due dates
- Assignment to officials
- Priority levels (P1-P4)
- Comments and attachments
- Module-specific fields

### Appointment Model

- Applicant information
- Purpose and category
- Preferred and confirmed dates/times
- Status (REQUESTED, CONFIRMED, RESCHEDULED, COMPLETED, CANCELLED)
- Assignment to officials

### Emergency Model

- Auto-generated emergency ID
- Emergency type (MEDICAL, POLICE, FIRE, NATURAL_DISASTER, ACCIDENT, OTHER)
- GPS coordinates support
- Urgency levels (LOW, MEDIUM, HIGH, CRITICAL)
- Status workflow (LOGGED → DISPATCHED → IN_PROGRESS → RESOLVED)
- Response tracking

### Dispute Model

- Party A and Party B information (nested objects)
- Dispute category and type
- Mediation scheduling
- Status workflow
- Settlement tracking

### Temple Model

- Applicant information
- Temple name and darshan type (VIP, GENERAL, SPECIAL, DIVYA_DARSHAN, SARVA_DARSHAN)
- Preferred date and number of people
- Status (REQUESTED, UNDER_REVIEW, APPROVED, LETTER_ISSUED)
- Letter details (number, issue date, validity)

### CMRelief Model

- Patient information
- Medical condition and treatment details
- Hospital recommendations
- Estimated costs
- Income verification
- Status workflow

### Education Model

- Student information
- Academic performance
- Course and institution details
- Family income
- Fee concession requests

### CSRIndustrial Model

- Company information
- Project details
- Budget and timeline
- Expected impact
- Status workflow

## 🔐 Authentication

API uses **JWT (JSON Web Tokens)** for authentication.

### Login Flow:

1. User sends credentials to `/api/users/login`
2. Server validates and returns JWT token
3. Client stores token (localStorage/sessionStorage)
4. Client includes token in Authorization header: `Bearer <token>`

### Protected Routes:

Most routes require authentication. Include JWT in headers:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📂 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js           # MongoDB connection config
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── models/
│   │   ├── User.js               # User/authentication model
│   │   ├── Case.js               # Generic case model
│   │   ├── Appointment.js        # Appointment model
│   │   ├── Emergency.js          # Emergency support model
│   │   ├── Dispute.js            # Dispute resolution model
│   │   ├── Temple.js             # Temple darshan letter model
│   │   ├── CMRelief.js           # CM Relief Fund model
│   │   ├── Education.js          # Education support model
│   │   ├── CSRIndustrial.js      # CSR proposals model
│   │   └── Program.js            # Government programs model
│   ├── routes/
│   │   ├── health.js             # Health check routes
│   │   ├── users.js              # User management routes
│   │   ├── cases.js              # Case management routes
│   │   ├── appointments.js       # Appointment routes
│   │   ├── emergencies.js        # Emergency routes
│   │   ├── disputes.js           # Dispute routes
│   │   ├── temples.js            # Temple letter routes
│   │   ├── cmrelief.js           # CMRF routes
│   │   ├── education.js          # Education support routes
│   │   ├── csrindustrial.js      # CSR routes
│   │   ├── programs.js           # Program routes
│   │   └── upload.js             # File upload routes
│   └── index.js                  # Server entry point & app config
├── uploads/                      # File upload directory
├── .env                          # Environment variables (not in git)
├── .env.example                  # Environment template
├── .gitignore
├── package.json
└── README.md
```

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "citizen"
  }'

# Login
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Create grievance (requires token)
curl -X POST http://localhost:5000/api/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "caseType": "grievance",
    "citizenName": "John Doe",
    "citizenContact": {
      "phone": "9876543210",
      "email": "john@example.com",
      "address": "123 Main St"
    },
    "subject": "Road Repair Request",
    "description": "Road needs urgent repair",
    "department": "Public Works",
    "district": "Krishna",
    "priority": "P2",
    "status": "pending"
  }'

# Book appointment
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "applicantName": "Jane Smith",
    "mobile": "9876543210",
    "purpose": "Discuss infrastructure project",
    "category": "PROJECT_DISCUSSION",
    "preferredDate": "2025-12-01",
    "preferredTime": "10:00 AM"
  }'

# Log emergency
curl -X POST http://localhost:5000/api/emergencies \
  -H "Content-Type: application/json" \
  -d '{
    "applicantName": "Emergency Caller",
    "mobile": "9999999999",
    "emergencyType": "MEDICAL",
    "location": "Town Square, Krishna District",
    "description": "Medical emergency requiring immediate attention",
    "urgency": "CRITICAL",
    "gpsCoordinates": {
      "latitude": 16.5062,
      "longitude": 80.6480
    }
  }'
```

### Using Postman or Thunder Client

1. Import the API collection (if available)
2. Set base URL: `http://localhost:5000/api`
3. For protected routes, add Authorization header with JWT token

### Test Credentials

See `TEST_CREDENTIALS.md` in the root directory for demo user accounts.

## 🔒 Security Best Practices

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens for stateless authentication
- ✅ CORS configured for frontend origin
- ✅ Input validation on all endpoints
- ✅ MongoDB injection protection
- ⚠️ Use HTTPS in production
- ⚠️ Keep JWT_SECRET secure and unique
- ⚠️ Regular security updates

## 🚀 Deployment

### Environment Setup for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sahaya-pragathi
JWT_SECRET=super-secret-production-key-min-32-chars
CORS_ORIGIN=https://yourdomain.com
```

### Deployment Options

**Option 1: Traditional VPS (DigitalOcean, AWS EC2, Linode)**

```bash
# Clone repo
git clone https://github.com/Waseem-Baig/sahaya-pragathi.git
cd sahaya-pragathi/backend

# Install dependencies
npm install --production

# Set environment variables
nano .env

# Use PM2 for process management
npm install -g pm2
pm2 start src/index.js --name sahaya-api
pm2 save
pm2 startup
```

**Option 2: Heroku**

```bash
heroku create sahaya-pragathi-api
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

**Option 3: Docker**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

**Option 4: Render, Railway, Cyclic** - Follow platform-specific deployment guides

## 📊 Monitoring & Logs

### Development Logs

```bash
npm run dev
# Logs will appear in console
```

### Production Monitoring

- Use PM2 logs: `pm2 logs sahaya-api`
- Set up error tracking (Sentry, LogRocket)
- Monitor database performance (MongoDB Atlas)
- Set up uptime monitoring (UptimeRobot, Pingdom)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection string format
mongodb://localhost:27017/sahaya-pragathi
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### JWT Token Issues

- Ensure JWT_SECRET is set in .env
- Check token expiration
- Verify Authorization header format: `Bearer <token>`

## 📝 License

ISC License

## 👥 Contributors

**Waseem-Baig** - Project Lead & Developer

## 📞 Support

- **GitHub Issues**: [Report a bug](https://github.com/Waseem-Baig/sahaya-pragathi/issues)
- **Email**: support@sahaya-pragathi.in (demo)

---

**Built with ❤️ for Government Digital Services**
