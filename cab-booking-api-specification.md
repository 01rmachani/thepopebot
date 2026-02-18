# Cab Booking Service API Specification

## Overview

This document defines a minimal yet complete API interface for an online cab booking service. The API covers the core user journey from registration to ride completion with essential endpoints for users, drivers, and ride management.

## Table of Contents

1. [Core API Endpoints Analysis](#core-api-endpoints-analysis)
2. [Essential Endpoints](#essential-endpoints)
3. [OpenAPI Specification](#openapi-specification)
4. [Technical Specifications](#technical-specifications)
5. [Security Considerations](#security-considerations)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Authentication Flow](#authentication-flow)
8. [Implementation Guidelines](#implementation-guidelines)

## Core API Endpoints Analysis

### Absolute Minimum Endpoints

The minimal functional cab booking service requires these core endpoint groups:

1. **Authentication & Users** (3 endpoints)
   - User registration/login
   - Profile management
   - Token refresh

2. **Ride Management** (4 endpoints)
   - Request ride
   - Cancel ride
   - Get ride status
   - Complete ride

3. **Driver Operations** (3 endpoints)
   - Driver availability
   - Accept/decline rides
   - Real-time location updates

4. **Tracking & Communication** (2 endpoints)
   - Real-time ride tracking
   - Basic messaging

5. **Payment** (1 endpoint)
   - Process payment

**Total: 13 core endpoints** for a functional service

### RESTful API Structure

Base URL: `https://api.cabservice.com/v1`

#### HTTP Methods Mapping

| Operation | Method | Purpose |
|-----------|--------|---------|
| Read/Query | GET | Retrieve resources |
| Create | POST | Create new resources |
| Update | PUT | Replace entire resource |
| Partial Update | PATCH | Modify specific fields |
| Delete | DELETE | Remove resources |

#### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful operation |
| 201 | Resource created successfully |
| 202 | Request accepted for processing |
| 400 | Bad request (validation errors) |
| 401 | Unauthorized (authentication required) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (resource already exists) |
| 422 | Unprocessable entity |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Essential Endpoints

### 1. Authentication & User Management

#### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "userType": "passenger"
}
```

**Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "usr_123456789",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "userType": "passenger",
    "isVerified": false,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

#### POST /auth/login
Authenticate user credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "usr_123456789",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "passenger"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

#### GET /users/profile
Get current user profile.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "id": "usr_123456789",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "userType": "passenger",
  "rating": 4.8,
  "ridesCompleted": 25,
  "isVerified": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 2. Ride Management

#### POST /rides
Request a new ride.

**Request:**
```json
{
  "pickupLocation": {
    "lat": 40.7128,
    "lng": -74.0060,
    "address": "123 Main St, New York, NY"
  },
  "dropoffLocation": {
    "lat": 40.7589,
    "lng": -73.9851,
    "address": "456 Broadway, New York, NY"
  },
  "rideType": "standard",
  "scheduledTime": null,
  "notes": "Please call when you arrive"
}
```

**Response (201):**
```json
{
  "id": "ride_987654321",
  "status": "requested",
  "passengerId": "usr_123456789",
  "pickupLocation": {
    "lat": 40.7128,
    "lng": -74.0060,
    "address": "123 Main St, New York, NY"
  },
  "dropoffLocation": {
    "lat": 40.7589,
    "lng": -73.9851,
    "address": "456 Broadway, New York, NY"
  },
  "rideType": "standard",
  "estimatedFare": 15.50,
  "estimatedDuration": 1200,
  "estimatedDistance": 5.2,
  "requestedAt": "2024-01-15T10:30:00Z",
  "notes": "Please call when you arrive"
}
```

#### GET /rides/{rideId}
Get ride details and current status.

**Response (200):**
```json
{
  "id": "ride_987654321",
  "status": "in_progress",
  "passengerId": "usr_123456789",
  "driverId": "drv_555666777",
  "driver": {
    "id": "drv_555666777",
    "firstName": "Mike",
    "lastName": "Johnson",
    "phoneNumber": "+1987654321",
    "rating": 4.9,
    "vehicle": {
      "make": "Toyota",
      "model": "Camry",
      "year": 2022,
      "color": "Silver",
      "licensePlate": "ABC123"
    }
  },
  "pickupLocation": {
    "lat": 40.7128,
    "lng": -74.0060,
    "address": "123 Main St, New York, NY"
  },
  "dropoffLocation": {
    "lat": 40.7589,
    "lng": -73.9851,
    "address": "456 Broadway, New York, NY"
  },
  "actualFare": 15.50,
  "currentLocation": {
    "lat": 40.7300,
    "lng": -74.0000
  },
  "requestedAt": "2024-01-15T10:30:00Z",
  "acceptedAt": "2024-01-15T10:32:00Z",
  "arrivedAt": "2024-01-15T10:40:00Z",
  "startedAt": "2024-01-15T10:42:00Z",
  "estimatedArrival": "2024-01-15T11:02:00Z"
}
```

#### PATCH /rides/{rideId}/cancel
Cancel a ride.

**Request:**
```json
{
  "reason": "Change of plans"
}
```

**Response (200):**
```json
{
  "message": "Ride cancelled successfully",
  "id": "ride_987654321",
  "status": "cancelled",
  "cancelledAt": "2024-01-15T10:35:00Z",
  "cancellationFee": 0
}
```

#### PATCH /rides/{rideId}/complete
Mark ride as completed.

**Response (200):**
```json
{
  "id": "ride_987654321",
  "status": "completed",
  "finalFare": 15.50,
  "distance": 5.2,
  "duration": 1200,
  "completedAt": "2024-01-15T11:02:00Z"
}
```

### 3. Driver Operations

#### PATCH /drivers/availability
Update driver availability status.

**Request:**
```json
{
  "isAvailable": true,
  "currentLocation": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

**Response (200):**
```json
{
  "message": "Availability updated",
  "driverId": "drv_555666777",
  "isAvailable": true,
  "currentLocation": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### POST /rides/{rideId}/accept
Accept a ride request.

**Response (200):**
```json
{
  "message": "Ride accepted",
  "rideId": "ride_987654321",
  "estimatedArrival": "2024-01-15T10:40:00Z"
}
```

#### PATCH /rides/{rideId}/location
Update driver's real-time location during ride.

**Request:**
```json
{
  "lat": 40.7300,
  "lng": -74.0000,
  "heading": 45
}
```

**Response (200):**
```json
{
  "message": "Location updated",
  "rideId": "ride_987654321",
  "location": {
    "lat": 40.7300,
    "lng": -74.0000,
    "heading": 45
  },
  "updatedAt": "2024-01-15T10:45:00Z"
}
```

### 4. Real-time Tracking

#### GET /rides/{rideId}/track
Get real-time tracking information.

**Response (200):**
```json
{
  "rideId": "ride_987654321",
  "status": "in_progress",
  "driverLocation": {
    "lat": 40.7300,
    "lng": -74.0000,
    "heading": 45
  },
  "estimatedArrival": "2024-01-15T11:02:00Z",
  "lastUpdated": "2024-01-15T10:45:00Z"
}
```

#### WebSocket: /ws/rides/{rideId}
Real-time ride updates via WebSocket connection.

**Message Format:**
```json
{
  "type": "location_update",
  "rideId": "ride_987654321",
  "data": {
    "lat": 40.7300,
    "lng": -74.0000,
    "heading": 45
  },
  "timestamp": "2024-01-15T10:45:00Z"
}
```

### 5. Payment Processing

#### POST /payments
Process payment for completed ride.

**Request:**
```json
{
  "rideId": "ride_987654321",
  "amount": 15.50,
  "paymentMethod": "card",
  "tip": 2.50
}
```

**Response (200):**
```json
{
  "paymentId": "pay_111222333",
  "rideId": "ride_987654321",
  "amount": 15.50,
  "tip": 2.50,
  "total": 18.00,
  "status": "completed",
  "processedAt": "2024-01-15T11:05:00Z"
}
```

## Technical Specifications

### Authentication Method
- **Primary**: JWT (JSON Web Tokens)
- **Access Token**: Short-lived (1 hour)
- **Refresh Token**: Long-lived (30 days)
- **Algorithm**: HS256 for development, RS256 for production

### Data Formats
- **Request/Response**: JSON only
- **Date/Time**: ISO 8601 format (UTC)
- **Coordinates**: Decimal degrees (lat/lng)

### Pagination
For list endpoints, use cursor-based pagination:

```http
GET /rides?limit=20&cursor=eyJpZCI6InJpZGVfOTg3NjU0MzIxIn0
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "hasNext": true,
    "nextCursor": "eyJpZCI6InJpZGVfOTg3NjU0MzIx",
    "limit": 20,
    "total": 150
  }
}
```

### Real-time Communication
- **WebSockets**: For live location tracking
- **Fallback**: Server-Sent Events (SSE)
- **Polling**: Last resort with 5-second intervals

### Rate Limiting
- **Default**: 100 requests per minute per user
- **Authentication**: 10 requests per minute per IP
- **Location Updates**: 60 requests per minute per driver

## Security Considerations

### Input Validation
- Validate all input parameters
- Sanitize location coordinates
- Enforce password complexity
- Phone number format validation

### Rate Limiting
- Implement sliding window rate limiting
- Different limits per endpoint type
- IP-based and user-based limits

### CORS Policies
```javascript
{
  "origin": ["https://app.cabservice.com", "https://driver.cabservice.com"],
  "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
  "allowedHeaders": ["Content-Type", "Authorization"],
  "credentials": true
}
```

### Data Encryption
- **In Transit**: TLS 1.3 minimum
- **At Rest**: AES-256 for sensitive data
- **PII**: Encrypted user data and payment information

### Security Headers
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

## Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "INVALID_LOCATION",
    "message": "The provided pickup location is invalid",
    "details": "Coordinates must be within service area",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED`: Missing or invalid token
- `INVALID_INPUT`: Validation errors
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVICE_UNAVAILABLE`: Temporary service issues

## Status Mappings

### Ride Status Flow
```
requested → driver_assigned → driver_arriving → arrived → 
in_progress → completed | cancelled
```

### Payment Status
```
pending → processing → completed | failed | refunded
```

### Driver Status
```
offline → available → busy → on_ride
```

This completes the essential endpoints and technical specifications. The next sections will provide the OpenAPI specification, data flow diagrams, and implementation guidelines.