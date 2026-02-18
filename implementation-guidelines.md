# Implementation Guidelines

## Overview

This document provides comprehensive guidelines for implementing the cab booking service API. It covers architecture decisions, technology recommendations, deployment considerations, and best practices for building a production-ready service.

## Architecture Recommendations

### Microservices Architecture

The API should be implemented using a microservices architecture with the following service boundaries:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Microservices Architecture                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   API Gateway    │    │  Authentication  │    │   User Service   │
│                  │    │     Service      │    │                  │
│ • Rate limiting  │    │                  │    │ • User profiles  │
│ • Load balancing │    │ • JWT tokens     │    │ • Registration   │
│ • Request routing│    │ • Password auth  │    │ • Preferences    │
│ • Response cache │    │ • Token refresh  │    │ • Verification   │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Ride Service   │    │  Location        │    │  Payment Service │
│                  │    │   Service        │    │                  │
│ • Ride booking   │    │                  │    │ • Payment proc   │
│ • Status updates │    │ • Real-time GPS  │    │ • Billing        │
│ • Driver matching│    │ • Route calc     │    │ • Receipts       │
│ • Fare calc      │    │ • Geofencing     │    │ • Refunds        │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Notification     │    │   Driver         │    │  Analytics       │
│   Service        │    │   Service        │    │   Service        │
│                  │    │                  │    │                  │
│ • Push notifs    │    │ • Driver profiles│    │ • Trip metrics   │
│ • SMS/Email      │    │ • Availability   │    │ • Performance    │
│ • In-app msgs    │    │ • Vehicle info   │    │ • Reporting      │
│ • Webhooks       │    │ • Ratings        │    │ • Insights       │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

### Technology Stack Recommendations

#### Backend Technologies

**Primary Stack (Node.js)**
```json
{
  "runtime": "Node.js 18 LTS",
  "framework": "Express.js 4.x",
  "database": "PostgreSQL 15",
  "cache": "Redis 7.x",
  "messageQueue": "Redis / AWS SQS",
  "containerization": "Docker",
  "orchestration": "Kubernetes / Docker Compose"
}
```

**Alternative Stack (Python)**
```json
{
  "runtime": "Python 3.11",
  "framework": "FastAPI / Django REST",
  "database": "PostgreSQL 15",
  "cache": "Redis 7.x",
  "messageQueue": "Celery + Redis",
  "containerization": "Docker",
  "orchestration": "Kubernetes"
}
```

**Alternative Stack (Go)**
```json
{
  "runtime": "Go 1.20",
  "framework": "Gin / Echo",
  "database": "PostgreSQL 15",
  "cache": "Redis 7.x",
  "messageQueue": "NATS / RabbitMQ",
  "containerization": "Docker",
  "orchestration": "Kubernetes"
}
```

#### Database Design

**Primary Database: PostgreSQL**
- ACID compliance for transactions
- PostGIS extension for geospatial queries
- Strong consistency for financial data
- Excellent performance for complex queries

**Cache Layer: Redis**
- Session storage
- Real-time location data
- Rate limiting counters
- Temporary ride state

**Message Queue: Redis/SQS**
- Asynchronous processing
- Notification delivery
- Payment processing
- Analytics events

### Database Schema

#### Core Tables

```sql
-- Users table (passengers and drivers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('passenger', 'driver')),
    is_verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    rides_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver-specific information
CREATE TABLE driver_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) NOT NULL,
    license_expiry DATE NOT NULL,
    vehicle_make VARCHAR(50) NOT NULL,
    vehicle_model VARCHAR(50) NOT NULL,
    vehicle_year INTEGER NOT NULL,
    vehicle_color VARCHAR(30) NOT NULL,
    license_plate VARCHAR(20) NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT FALSE,
    current_lat DECIMAL(10, 8),
    current_lng DECIMAL(11, 8),
    last_location_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rides table
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id UUID NOT NULL REFERENCES users(id),
    driver_id UUID REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'requested' 
        CHECK (status IN ('requested', 'driver_assigned', 'driver_arriving', 
                         'arrived', 'in_progress', 'completed', 'cancelled')),
    pickup_lat DECIMAL(10, 8) NOT NULL,
    pickup_lng DECIMAL(11, 8) NOT NULL,
    pickup_address TEXT NOT NULL,
    dropoff_lat DECIMAL(10, 8) NOT NULL,
    dropoff_lng DECIMAL(11, 8) NOT NULL,
    dropoff_address TEXT NOT NULL,
    ride_type VARCHAR(20) NOT NULL DEFAULT 'standard',
    estimated_fare DECIMAL(10, 2),
    actual_fare DECIMAL(10, 2),
    estimated_duration INTEGER, -- seconds
    actual_duration INTEGER, -- seconds
    estimated_distance DECIMAL(8, 2), -- kilometers
    actual_distance DECIMAL(8, 2), -- kilometers
    notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    arrived_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time location tracking
CREATE TABLE ride_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    heading DECIMAL(5, 2), -- 0-360 degrees
    speed DECIMAL(5, 2), -- km/h
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(id),
    amount DECIMAL(10, 2) NOT NULL,
    tip DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_driver_profiles_user_id ON driver_profiles(user_id);
CREATE INDEX idx_driver_profiles_available ON driver_profiles(is_available) WHERE is_available = true;
CREATE INDEX idx_driver_profiles_location ON driver_profiles(current_lat, current_lng);
CREATE INDEX idx_rides_passenger_id ON rides(passenger_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_requested_at ON rides(requested_at);
CREATE INDEX idx_ride_locations_ride_id ON ride_locations(ride_id);
CREATE INDEX idx_ride_locations_recorded_at ON ride_locations(recorded_at);
CREATE INDEX idx_payments_ride_id ON payments(ride_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

## Implementation Patterns

### Service Layer Architecture

```javascript
// Example: Ride Service Structure

class RideService {
  constructor(rideRepository, driverService, locationService, notificationService) {
    this.rideRepository = rideRepository;
    this.driverService = driverService;
    this.locationService = locationService;
    this.notificationService = notificationService;
  }

  async createRide(passengerId, rideRequest) {
    // Validate input
    const validation = await this.validateRideRequest(rideRequest);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }

    // Calculate estimates
    const estimates = await this.locationService.calculateEstimates(
      rideRequest.pickupLocation,
      rideRequest.dropoffLocation
    );

    // Create ride record
    const ride = await this.rideRepository.create({
      passengerId,
      ...rideRequest,
      ...estimates,
      status: 'requested'
    });

    // Find available drivers (async)
    this.findAndNotifyDrivers(ride).catch(error => {
      console.error('Driver matching failed:', error);
    });

    return ride;
  }

  async findAndNotifyDrivers(ride) {
    const nearbyDrivers = await this.driverService.findNearbyDrivers(
      ride.pickupLocation,
      5 // 5km radius
    );

    for (const driver of nearbyDrivers) {
      try {
        await this.notificationService.sendRideRequest(driver.id, ride);
      } catch (error) {
        console.error(`Failed to notify driver ${driver.id}:`, error);
      }
    }
  }

  async acceptRide(driverId, rideId) {
    return await this.rideRepository.transaction(async (trx) => {
      // Lock ride record
      const ride = await this.rideRepository.findByIdForUpdate(rideId, trx);
      
      if (!ride) {
        throw new NotFoundError('Ride not found');
      }

      if (ride.status !== 'requested') {
        throw new ConflictError('Ride is no longer available');
      }

      // Update ride status
      const updatedRide = await this.rideRepository.update(rideId, {
        driverId,
        status: 'driver_assigned',
        acceptedAt: new Date()
      }, trx);

      // Update driver availability
      await this.driverService.setAvailability(driverId, false, trx);

      // Notify passenger
      await this.notificationService.sendDriverAssigned(
        ride.passengerId,
        updatedRide
      );

      return updatedRide;
    });
  }
}
```

### Repository Pattern

```javascript
// Example: Ride Repository

class RideRepository {
  constructor(database) {
    this.db = database;
  }

  async create(rideData) {
    const [ride] = await this.db('rides')
      .insert({
        ...rideData,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning('*');

    return this.mapToRideEntity(ride);
  }

  async findById(id) {
    const ride = await this.db('rides')
      .leftJoin('users as passenger', 'rides.passenger_id', 'passenger.id')
      .leftJoin('users as driver', 'rides.driver_id', 'driver.id')
      .leftJoin('driver_profiles', 'driver.id', 'driver_profiles.user_id')
      .select(
        'rides.*',
        'passenger.first_name as passenger_first_name',
        'passenger.last_name as passenger_last_name',
        'driver.first_name as driver_first_name',
        'driver.last_name as driver_last_name',
        'driver_profiles.vehicle_make',
        'driver_profiles.vehicle_model',
        'driver_profiles.license_plate'
      )
      .where('rides.id', id)
      .first();

    return ride ? this.mapToRideEntityWithDetails(ride) : null;
  }

  async findByPassengerId(passengerId, limit = 20, offset = 0) {
    const rides = await this.db('rides')
      .where('passenger_id', passengerId)
      .orderBy('requested_at', 'desc')
      .limit(limit)
      .offset(offset);

    return rides.map(ride => this.mapToRideEntity(ride));
  }

  async update(id, updateData) {
    const [updatedRide] = await this.db('rides')
      .where('id', id)
      .update({
        ...updateData,
        updatedAt: new Date()
      })
      .returning('*');

    return this.mapToRideEntity(updatedRide);
  }

  async transaction(callback) {
    return await this.db.transaction(callback);
  }

  mapToRideEntity(row) {
    return {
      id: row.id,
      status: row.status,
      passengerId: row.passenger_id,
      driverId: row.driver_id,
      pickupLocation: {
        lat: parseFloat(row.pickup_lat),
        lng: parseFloat(row.pickup_lng),
        address: row.pickup_address
      },
      dropoffLocation: {
        lat: parseFloat(row.dropoff_lat),
        lng: parseFloat(row.dropoff_lng),
        address: row.dropoff_address
      },
      estimatedFare: parseFloat(row.estimated_fare),
      actualFare: parseFloat(row.actual_fare),
      requestedAt: row.requested_at,
      acceptedAt: row.accepted_at,
      completedAt: row.completed_at
    };
  }
}
```

### Error Handling Strategy

```javascript
// Custom Error Classes
class APIError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.name = this.constructor.name;
  }
}

class ValidationError extends APIError {
  constructor(errors) {
    super('Validation failed', 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class NotFoundError extends APIError {
  constructor(resource) {
    super(`${resource} not found`, 404, 'RESOURCE_NOT_FOUND');
    this.resource = resource;
  }
}

class ConflictError extends APIError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

// Global Error Handler Middleware
function errorHandler(error, req, res, next) {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  // Log error
  console.error({
    requestId,
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id
  });

  // Handle known API errors
  if (error instanceof APIError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.errorCode,
        message: error.message,
        details: error.errors || error.resource,
        timestamp: new Date().toISOString(),
        requestId
      }
    });
  }

  // Handle database errors
  if (error.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: 'Resource already exists',
        timestamp: new Date().toISOString(),
        requestId
      }
    });
  }

  // Default to 500 Internal Server Error
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      requestId
    }
  });
}
```

### Rate Limiting Implementation

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

// Different rate limits for different endpoints
const createAuthLimiter = () => rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth_limit:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

const createAPILimiter = () => rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'api_limit:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Usage
app.use('/auth', createAuthLimiter());
app.use('/api', createAPILimiter());
```

## Real-time Communication

### WebSocket Implementation

```javascript
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class RealTimeService {
  constructor() {
    this.clients = new Map(); // userId -> WebSocket connection
    this.rideSubscriptions = new Map(); // rideId -> Set of userIds
  }

  setupWebSocketServer(server) {
    const wss = new WebSocket.Server({
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    wss.on('connection', this.handleConnection.bind(this));
    return wss;
  }

  verifyClient(info) {
    try {
      const token = new URL(info.req.url, 'http://localhost').searchParams.get('token');
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      info.req.user = payload;
      return true;
    } catch (error) {
      return false;
    }
  }

  handleConnection(ws, req) {
    const userId = req.user.sub;
    
    // Store connection
    this.clients.set(userId, ws);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(userId, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      this.clients.delete(userId);
      // Clean up subscriptions
      this.cleanupSubscriptions(userId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connection_confirmed',
      userId
    }));
  }

  handleMessage(userId, message) {
    switch (message.type) {
      case 'subscribe_ride':
        this.subscribeToRide(userId, message.rideId);
        break;
      case 'unsubscribe_ride':
        this.unsubscribeFromRide(userId, message.rideId);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  subscribeToRide(userId, rideId) {
    if (!this.rideSubscriptions.has(rideId)) {
      this.rideSubscriptions.set(rideId, new Set());
    }
    this.rideSubscriptions.get(rideId).add(userId);
  }

  broadcastToRide(rideId, message) {
    const subscribers = this.rideSubscriptions.get(rideId);
    if (!subscribers) return;

    subscribers.forEach(userId => {
      const client = this.clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Public method for services to send updates
  sendLocationUpdate(rideId, location) {
    this.broadcastToRide(rideId, {
      type: 'location_update',
      rideId,
      data: location,
      timestamp: new Date().toISOString()
    });
  }

  sendStatusUpdate(rideId, status, data = {}) {
    this.broadcastToRide(rideId, {
      type: 'status_update',
      rideId,
      status,
      data,
      timestamp: new Date().toISOString()
    });
  }
}
```

## Deployment Configuration

### Docker Configuration

**Dockerfile**
```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY src/ ./src/
COPY config/ ./config/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/index.js"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/cabservice
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-secret-key
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=cabservice
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
```

### Kubernetes Configuration

**deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cabservice-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cabservice-api
  template:
    metadata:
      labels:
        app: cabservice-api
    spec:
      containers:
      - name: api
        image: your-registry/cabservice-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: cabservice-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: cabservice-secrets
              key: jwt-secret
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: cabservice-api-service
spec:
  selector:
    app: cabservice-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Monitoring and Observability

### Logging Strategy

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'cabservice-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logging middleware
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
}
```

### Health Checks

```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  };

  try {
    // Check database connectivity
    await database.raw('SELECT 1');
    health.database = 'connected';

    // Check Redis connectivity
    await redisClient.ping();
    health.redis = 'connected';

    res.status(200).json(health);
  } catch (error) {
    health.status = 'ERROR';
    health.error = error.message;
    res.status(503).json(health);
  }
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  const metrics = await prometheus.register.metrics();
  res.set('Content-Type', prometheus.register.contentType);
  res.end(metrics);
});
```

## Security Best Practices

### Input Validation

```javascript
const Joi = require('joi');

// Validation schemas
const schemas = {
  rideRequest: Joi.object({
    pickupLocation: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
      address: Joi.string().max(500).required()
    }).required(),
    dropoffLocation: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
      address: Joi.string().max(500).required()
    }).required(),
    rideType: Joi.string().valid('standard', 'premium', 'shared').required(),
    notes: Joi.string().max(500).optional()
  }),

  userRegistration: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
    firstName: Joi.string().max(50).required(),
    lastName: Joi.string().max(50).required(),
    phoneNumber: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
    userType: Joi.string().valid('passenger', 'driver').required()
  })
};

// Validation middleware
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
    }
    
    req.body = value;
    next();
  };
}
```

### CORS Configuration

```javascript
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
};

app.use(cors(corsOptions));
```

This implementation guide provides a comprehensive foundation for building a production-ready cab booking service API with proper architecture, security, and scalability considerations.