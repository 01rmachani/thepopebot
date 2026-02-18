# Authentication Flow Documentation

## Overview

This document details the authentication and authorization mechanisms for the cab booking service API. The system uses JWT (JSON Web Tokens) with a dual-token approach for secure, stateless authentication.

## Authentication Strategy

### Token-Based Authentication (JWT)

- **Access Token**: Short-lived (1 hour), used for API requests
- **Refresh Token**: Long-lived (30 days), used to obtain new access tokens
- **Algorithm**: HS256 for development, RS256 for production
- **Storage**: Secure storage on client (iOS Keychain, Android Keystore, Secure HTTP-only cookies for web)

## Token Structure

### Access Token Payload

```json
{
  "sub": "usr_123456789",
  "email": "user@example.com",
  "userType": "passenger",
  "iat": 1642234567,
  "exp": 1642238167,
  "iss": "cabservice.com",
  "aud": "cabservice-api"
}
```

### Refresh Token Payload

```json
{
  "sub": "usr_123456789",
  "tokenType": "refresh",
  "iat": 1642234567,
  "exp": 1644826567,
  "iss": "cabservice.com",
  "jti": "refresh_abc123xyz"
}
```

## Authentication Flows

### 1. User Registration Flow

```
Client App                           Auth Service                     Database
     │                                    │                              │
     │ POST /auth/register                │                              │
     │ {email, password, profile}         │                              │
     │──────────────────────────────────→ │                              │
     │                                    │                              │
     │                                    │ ┌─────────────────────────┐  │
     │                                    │ │ 1. Validate input       │  │
     │                                    │ │    • Email format       │  │
     │                                    │ │    • Password strength  │  │
     │                                    │ │    • Required fields    │  │
     │                                    │ └─────────────────────────┘  │
     │                                    │                              │
     │                                    │ Check email exists           │
     │                                    │────────────────────────────→ │
     │                                    │                              │
     │                                    │ Email availability result    │
     │                                    │ ◄────────────────────────────│
     │                                    │                              │
     │ 409 Conflict                       │                              │
     │ {error: "Email already exists"}    │                              │
     │◄────────────────────────────────── │                              │
     │                                    │  (if email exists)          │
     │                                    │                              │
     │                                    │ ┌─────────────────────────┐  │
     │                                    │ │ 2. Hash password        │  │
     │                                    │ │    • bcrypt with salt   │  │
     │                                    │ │    • Cost factor 12     │  │
     │                                    │ └─────────────────────────┘  │
     │                                    │                              │
     │                                    │ Create user record           │
     │                                    │────────────────────────────→ │
     │                                    │                              │
     │                                    │ User created                 │
     │                                    │ ◄────────────────────────────│
     │                                    │                              │
     │                                    │ ┌─────────────────────────┐  │
     │                                    │ │ 3. Generate tokens      │  │
     │                                    │ │    • Access token       │  │
     │                                    │ │    • Refresh token      │  │
     │                                    │ │    • Set expiration     │  │
     │                                    │ └─────────────────────────┘  │
     │                                    │                              │
     │                                    │ Store refresh token          │
     │                                    │────────────────────────────→ │
     │                                    │                              │
     │ 201 Created                        │                              │
     │ {user, accessToken, refreshToken}  │                              │
     │◄────────────────────────────────── │                              │
     │                                    │                              │
```

### 2. User Login Flow

```
Client App                           Auth Service                     Database
     │                                    │                              │
     │ POST /auth/login                   │                              │
     │ {email, password}                  │                              │
     │──────────────────────────────────→ │                              │
     │                                    │                              │
     │                                    │ Find user by email           │
     │                                    │────────────────────────────→ │
     │                                    │                              │
     │                                    │ User record or null          │
     │                                    │ ◄────────────────────────────│
     │                                    │                              │
     │ 401 Unauthorized                   │                              │
     │ {error: "Invalid credentials"}     │                              │
     │◄────────────────────────────────── │                              │
     │                                    │  (if user not found)        │
     │                                    │                              │
     │                                    │ ┌─────────────────────────┐  │
     │                                    │ │ Verify password         │  │
     │                                    │ │ • Compare with bcrypt   │  │
     │                                    │ │ • Constant time compare │  │
     │                                    │ └─────────────────────────┘  │
     │                                    │                              │
     │ 401 Unauthorized                   │                              │
     │ {error: "Invalid credentials"}     │                              │
     │◄────────────────────────────────── │                              │
     │                                    │  (if password invalid)      │
     │                                    │                              │
     │                                    │ ┌─────────────────────────┐  │
     │                                    │ │ Generate new tokens     │  │
     │                                    │ │ • Fresh access token    │  │
     │                                    │ │ • New refresh token     │  │
     │                                    │ └─────────────────────────┘  │
     │                                    │                              │
     │                                    │ Store new refresh token      │
     │                                    │────────────────────────────→ │
     │                                    │                              │
     │ 200 OK                             │                              │
     │ {user, accessToken, refreshToken}  │                              │
     │◄────────────────────────────────── │                              │
     │                                    │                              │
```

### 3. Token Refresh Flow

```
Client App                           Auth Service                     Database
     │                                    │                              │
     │ POST /auth/refresh                 │                              │
     │ {refreshToken}                     │                              │
     │──────────────────────────────────→ │                              │
     │                                    │                              │
     │                                    │ ┌─────────────────────────┐  │
     │                                    │ │ Validate refresh token  │  │
     │                                    │ │ • Verify JWT signature  │  │
     │                                    │ │ • Check expiration      │  │
     │                                    │ │ • Validate claims       │  │
     │                                    │ └─────────────────────────┘  │
     │                                    │                              │
     │ 401 Unauthorized                   │                              │
     │ {error: "Invalid refresh token"}   │                              │
     │◄────────────────────────────────── │                              │
     │                                    │  (if token invalid)         │
     │                                    │                              │
     │                                    │ Check token in database      │
     │                                    │────────────────────────────→ │
     │                                    │                              │
     │                                    │ Token exists and valid       │
     │                                    │ ◄────────────────────────────│
     │                                    │                              │
     │ 401 Unauthorized                   │                              │
     │ {error: "Refresh token revoked"}   │                              │
     │◄────────────────────────────────── │                              │
     │                                    │  (if token revoked)         │
     │                                    │                              │
     │                                    │ Get user details             │
     │                                    │────────────────────────────→ │
     │                                    │                              │
     │                                    │ User record                  │
     │                                    │ ◄────────────────────────────│
     │                                    │                              │
     │                                    │ ┌─────────────────────────┐  │
     │                                    │ │ Generate new access     │  │
     │                                    │ │ token with fresh        │  │
     │                                    │ │ expiration              │  │
     │                                    │ └─────────────────────────┘  │
     │                                    │                              │
     │ 200 OK                             │                              │
     │ {accessToken, expiresIn}           │                              │
     │◄────────────────────────────────── │                              │
     │                                    │                              │
```

### 4. Authenticated API Request Flow

```
Client App                           API Gateway                      Service Layer
     │                                    │                              │
     │ GET /users/profile                 │                              │
     │ Authorization: Bearer {token}      │                              │
     │──────────────────────────────────→ │                              │
     │                                    │                              │
     │                                    │ ┌─────────────────────────┐  │
     │                                    │ │ Extract Bearer token    │  │
     │                                    │ │ from Authorization      │  │
     │                                    │ │ header                  │  │
     │                                    │ └─────────────────────────┘  │
     │                                    │                              │
     │ 401 Unauthorized                   │                              │
     │ {error: "Authorization required"}  │                              │
     │◄────────────────────────────────── │                              │
     │                                    │  (if header missing)        │
     │                                    │                              │
     │                                    │ ┌─────────────────────────┐  │
     │                                    │ │ Validate JWT token      │  │
     │                                    │ │ • Verify signature      │  │
     │                                    │ │ • Check expiration      │  │
     │                                    │ │ • Validate issuer       │  │
     │                                    │ │ • Check audience        │  │
     │                                    │ └─────────────────────────┘  │
     │                                    │                              │
     │ 401 Unauthorized                   │                              │
     │ {error: "Invalid token"}           │                              │
     │◄────────────────────────────────── │                              │
     │                                    │  (if token invalid)         │
     │                                    │                              │
     │                                    │ ┌─────────────────────────┐  │
     │                                    │ │ Extract user context    │  │
     │                                    │ │ • User ID from 'sub'    │  │
     │                                    │ │ • User type             │  │
     │                                    │ │ • Email                 │  │
     │                                    │ └─────────────────────────┘  │
     │                                    │                              │
     │                                    │ Forward with user context    │
     │                                    │────────────────────────────→ │
     │                                    │                              │
     │                                    │                              │ ┌─────────────────┐
     │                                    │                              │ │ Process request │
     │                                    │                              │ │ using user ID   │
     │                                    │                              │ │ for authz       │
     │                                    │                              │ └─────────────────┘
     │                                    │                              │
     │                                    │ Service response             │
     │                                    │ ◄────────────────────────────│
     │                                    │                              │
     │ 200 OK                             │                              │
     │ {user_profile_data}                │                              │
     │◄────────────────────────────────── │                              │
     │                                    │                              │
```

## Authorization Patterns

### Role-Based Access Control (RBAC)

The API implements basic role-based access control with two primary user types:

- **Passengers**: Can book rides, view ride history, make payments
- **Drivers**: Can accept rides, update location, mark rides complete

### Endpoint Authorization Matrix

| Endpoint | Passenger | Driver | Admin |
|----------|-----------|---------|--------|
| `POST /rides` | ✅ | ❌ | ✅ |
| `GET /rides/{id}` | ✅ (own) | ✅ (assigned) | ✅ |
| `PATCH /rides/{id}/cancel` | ✅ (own) | ❌ | ✅ |
| `POST /rides/{id}/accept` | ❌ | ✅ | ✅ |
| `PATCH /rides/{id}/location` | ❌ | ✅ (assigned) | ✅ |
| `PATCH /drivers/availability` | ❌ | ✅ | ✅ |
| `POST /payments` | ✅ (own rides) | ❌ | ✅ |

### Authorization Middleware

```javascript
// Pseudo-code for authorization middleware
function requireAuth(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      const token = extractBearerToken(req.headers.authorization);
      const payload = verifyJWT(token);
      
      // Check token expiration
      if (payload.exp < Date.now() / 1000) {
        return res.status(401).json({
          error: { code: "TOKEN_EXPIRED", message: "Access token expired" }
        });
      }
      
      // Check user role authorization
      if (allowedRoles.length > 0 && !allowedRoles.includes(payload.userType)) {
        return res.status(403).json({
          error: { code: "INSUFFICIENT_PERMISSIONS", message: "Access denied" }
        });
      }
      
      // Add user context to request
      req.user = {
        id: payload.sub,
        email: payload.email,
        userType: payload.userType
      };
      
      next();
    } catch (error) {
      return res.status(401).json({
        error: { code: "AUTHENTICATION_FAILED", message: "Invalid token" }
      });
    }
  };
}
```

### Resource-Level Authorization

For endpoints that access specific resources, additional authorization checks ensure users can only access their own data:

```javascript
// Example: Ride access authorization
function authorizeRideAccess(req, res, next) {
  const { rideId } = req.params;
  const { user } = req;
  
  // Get ride from database
  const ride = getRideById(rideId);
  
  if (!ride) {
    return res.status(404).json({
      error: { code: "RIDE_NOT_FOUND", message: "Ride not found" }
    });
  }
  
  // Check if user can access this ride
  const canAccess = (
    user.userType === 'admin' ||
    (user.userType === 'passenger' && ride.passengerId === user.id) ||
    (user.userType === 'driver' && ride.driverId === user.id)
  );
  
  if (!canAccess) {
    return res.status(403).json({
      error: { code: "ACCESS_DENIED", message: "Cannot access this ride" }
    });
  }
  
  req.ride = ride;
  next();
}
```

## Security Considerations

### Token Security

1. **Storage**
   - Mobile: Secure storage (Keychain/Keystore)
   - Web: HTTP-only, Secure cookies or secure localStorage
   - Never store in plain text or localStorage

2. **Transmission**
   - Always use HTTPS in production
   - Include tokens in Authorization header
   - Never pass tokens in URL parameters

3. **Rotation**
   - Access tokens expire in 1 hour
   - Refresh tokens expire in 30 days
   - Implement automatic token refresh
   - Revoke tokens on logout

### Password Security

1. **Hashing**
   - Use bcrypt with cost factor 12 minimum
   - Salt is automatically included in bcrypt
   - Store only hashed passwords, never plaintext

2. **Validation**
   - Minimum 8 characters
   - Require mix of letters, numbers, symbols
   - Check against common password lists
   - Rate limit login attempts

### Rate Limiting

Authentication endpoints have specific rate limits:

- **Registration**: 5 attempts per hour per IP
- **Login**: 10 attempts per hour per IP
- **Token Refresh**: 60 attempts per hour per user
- **Password Reset**: 3 attempts per hour per email

### Session Management

1. **Token Blacklisting**
   - Maintain revoked token list (Redis/database)
   - Check blacklist on each request
   - Clean up expired tokens regularly

2. **Logout Implementation**
   ```javascript
   POST /auth/logout
   {
     "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
   }
   ```
   - Add refresh token to blacklist
   - Clear client-side tokens
   - Return success confirmation

3. **Device Management**
   - Track active refresh tokens per user
   - Allow users to revoke all sessions
   - Implement device identification

## Error Responses

### Authentication Errors

```json
{
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication is required to access this resource",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The provided token is invalid or expired",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

### Authorization Errors

```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You do not have permission to perform this action",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

## Implementation Best Practices

1. **JWT Configuration**
   - Use RS256 for production (asymmetric keys)
   - Implement proper key rotation
   - Set appropriate expiration times
   - Include necessary claims only

2. **Middleware Order**
   ```
   1. Rate Limiting
   2. Request Validation
   3. Authentication
   4. Authorization
   5. Business Logic
   ```

3. **Error Handling**
   - Never expose sensitive information
   - Log authentication failures
   - Use consistent error format
   - Implement proper HTTP status codes

4. **Monitoring & Logging**
   - Log authentication events
   - Monitor failed login attempts
   - Track token usage patterns
   - Set up security alerts

This authentication system provides secure, scalable user authentication while maintaining simplicity for client implementation.