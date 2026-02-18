# Data Flow Diagrams

## Overview

This document provides comprehensive data flow diagrams for the cab booking service API, illustrating the core user journeys and system interactions.

## Core User Journey Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Complete User Journey                              │
└─────────────────────────────────────────────────────────────────────────────┘

    User Registration/Login
           │
           ▼
    ┌─────────────────┐      POST /auth/register      ┌──────────────────┐
    │   Mobile App    │────────────────────────────────│   Auth Service   │
    │                 │                                │                  │
    │  User enters    │◄───────────────────────────────│  Returns JWT     │
    │  credentials    │     JWT + User Profile         │  tokens          │
    └─────────────────┘                                └──────────────────┘
           │
           ▼
    Book Ride Request
           │
           ▼
    ┌─────────────────┐      POST /rides              ┌──────────────────┐
    │   Passenger     │────────────────────────────────│   Ride Service   │
    │                 │                                │                  │
    │ • Pickup Loc    │◄───────────────────────────────│ • Create ride    │
    │ • Dropoff Loc   │    Ride ID + Estimate          │ • Find drivers   │
    │ • Ride Type     │                                │ • Send request   │
    └─────────────────┘                                └──────────────────┘
           │                                                   │
           ▼                                                   ▼
    Wait for Driver                                 ┌──────────────────┐
           │                                        │  Driver Matching │
           │                                        │                  │
           │                                        │ • Distance calc  │
           │                                        │ • Availability   │
           │                                        │ • Push notification
           │                                        └──────────────────┘
           │                                                   │
           ▼                                                   ▼
    ┌─────────────────┐    WebSocket /ws/rides/{id}   ┌──────────────────┐
    │  Real-time      │◄───────────────────────────────│   Driver App     │
    │  Updates        │                                │                  │
    │                 │────────────────────────────────│ POST /rides/{id}/
    │ • Driver found  │   Driver accepts ride          │ accept           │
    │ • ETA updates   │                                │                  │
    │ • Location      │                                │                  │
    └─────────────────┘                                └──────────────────┘
           │
           ▼
    Ride in Progress
           │
           ▼
    ┌─────────────────┐    GET /rides/{id}/track      ┌──────────────────┐
    │   Live          │────────────────────────────────│   Tracking       │
    │   Tracking      │                                │   Service        │
    │                 │◄───────────────────────────────│                  │
    │ • Driver loc    │   Real-time coordinates        │ • GPS updates    │
    │ • Route         │                                │ • Route calc     │
    │ • ETA           │                                │ • ETA updates    │
    └─────────────────┘                                └──────────────────┘
           │                                                   ▲
           ▼                                                   │
    Ride Completion                          PATCH /rides/{id}/location
           │                                         │
           ▼                                         │
    ┌─────────────────┐   PATCH /rides/{id}/        │
    │   Payment       │   complete                   │
    │   Processing    │──────────────────────┐       │
    │                 │                      ▼       │
    │ • Calculate     │              ┌──────────────────┐
    │   final fare    │              │   Driver App     │
    │ • Process       │              │                  │
    │   payment       │              │ • Mark complete  │
    │ • Send receipt  │              │ • Update location│
    └─────────────────┘              └──────────────────┘
           │
           ▼
    ┌─────────────────┐      POST /payments
    │   Payment       │────────────────────────────────┐
    │   Complete      │                                ▼
    │                 │                        ┌──────────────────┐
    │ • Receipt       │◄───────────────────────│  Payment Gateway │
    │ • Trip summary  │    Payment confirmation │                  │
    │ • Rating prompt │                        │ • Process card   │
    └─────────────────┘                        │ • Handle tip     │
                                               │ • Send receipt   │
                                               └──────────────────┘
```

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Authentication Flow                              │
└─────────────────────────────────────────────────────────────────────────────┘

    Client Application                        API Server
           │                                      │
           │    POST /auth/register               │
           │  {email, password, profile}          │
           │─────────────────────────────────────▶│
           │                                      │ ┌─────────────────┐
           │                                      │ │ Validate input  │
           │                                      │ │ Hash password   │
           │                                      │ │ Create user     │
           │                                      │ │ Generate tokens │
           │                                      │ └─────────────────┘
           │                                      │
           │  201 Created                         │
           │  {user, accessToken, refreshToken}   │
           │◄─────────────────────────────────────│
           │                                      │
    ┌──────────────────┐                         │
    │ Store tokens in  │                         │
    │ secure storage   │                         │
    └──────────────────┘                         │
           │                                      │
           │    Subsequent API calls              │
           │    Authorization: Bearer {token}     │
           │─────────────────────────────────────▶│
           │                                      │ ┌─────────────────┐
           │                                      │ │ Validate JWT    │
           │                                      │ │ Check expiry    │
           │                                      │ │ Extract user ID │
           │                                      │ └─────────────────┘
           │                                      │
           │  401 Unauthorized                    │
           │  {error: "Token expired"}            │
           │◄─────────────────────────────────────│
           │                                      │
           │    POST /auth/refresh                │
           │    {refreshToken}                    │
           │─────────────────────────────────────▶│
           │                                      │ ┌─────────────────┐
           │                                      │ │ Validate refresh│
           │                                      │ │ Generate new    │
           │                                      │ │ access token    │
           │                                      │ └─────────────────┘
           │                                      │
           │  200 OK                              │
           │  {accessToken, expiresIn}            │
           │◄─────────────────────────────────────│
           │                                      │
```

## Ride Booking Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Ride Booking Flow                              │
└─────────────────────────────────────────────────────────────────────────────┘

Passenger App                Ride Service              Driver Matching           Driver App
      │                           │                           │                      │
      │ POST /rides               │                           │                      │
      │ {pickup, dropoff}         │                           │                      │
      │─────────────────────────→ │                           │                      │
      │                           │                           │                      │
      │                           │ ┌─────────────────────┐   │                      │
      │                           │ │ Create ride record  │   │                      │
      │                           │ │ Calculate estimate  │   │                      │
      │                           │ │ Set status: requested│  │                      │
      │                           │ └─────────────────────┘   │                      │
      │                           │                           │                      │
      │ 201 Created               │   Find available drivers │                      │
      │ {ride_id, estimate}       │ ─────────────────────────▶│                      │
      │◄───────────────────────── │                           │                      │
      │                           │                           │ ┌─────────────────┐  │
      │                           │                           │ │ Query nearby    │  │
      │                           │                           │ │ available       │  │
      │                           │                           │ │ drivers         │  │
      │                           │                           │ └─────────────────┘  │
      │                           │                           │                      │
      │                           │                           │ Push notification     │
      │                           │                           │ "New ride request"   │
      │                           │                           │ ────────────────────▶│
      │                           │                           │                      │
      │                           │                           │                      │ ┌───────────────┐
      │                           │                           │                      │ │ Driver sees   │
      │                           │                           │                      │ │ ride details  │
      │                           │                           │                      │ │ and decides   │
      │                           │                           │                      │ └───────────────┘
      │                           │                           │                      │
      │                           │   POST /rides/{id}/accept│                      │
      │                           │ ◄─────────────────────────┼──────────────────────│
      │                           │                           │                      │
      │                           │ ┌─────────────────────┐   │                      │
      │                           │ │ Update ride status: │   │                      │
      │                           │ │ driver_assigned     │   │                      │
      │                           │ │ Set driver_id       │   │                      │
      │                           │ │ Calculate ETA       │   │                      │
      │                           │ └─────────────────────┘   │                      │
      │                           │                           │                      │
      │ WebSocket notification    │                           │                      │
      │ "Driver assigned"         │                           │                      │
      │◄───────────────────────── │                           │                      │
      │                           │                           │                      │
      │ GET /rides/{id}           │                           │                      │
      │─────────────────────────→ │                           │                      │
      │                           │                           │                      │
      │ 200 OK                    │                           │                      │
      │ {driver_info, eta}        │                           │                      │
      │◄───────────────────────── │                           │                      │
      │                           │                           │                      │
```

## Real-time Tracking Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Real-time Tracking Flow                           │
└─────────────────────────────────────────────────────────────────────────────┘

Driver App                Location Service           WebSocket Server         Passenger App
    │                           │                           │                      │
    │ PATCH /rides/{id}/        │                           │                      │
    │ location                  │                           │                      │
    │ {lat, lng, heading}       │                           │                      │
    │─────────────────────────→ │                           │                      │
    │                           │                           │                      │
    │                           │ ┌─────────────────────┐   │                      │
    │                           │ │ Validate location   │   │                      │
    │                           │ │ Update ride record  │   │                      │
    │                           │ │ Calculate ETA       │   │                      │
    │                           │ └─────────────────────┘   │                      │
    │                           │                           │                      │
    │ 200 OK                    │   Broadcast update        │                      │
    │ {location, eta}           │ ─────────────────────────▶│                      │
    │◄───────────────────────── │                           │                      │
    │                           │                           │ ┌─────────────────┐  │
    │                           │                           │ │ Format message  │  │
    │                           │                           │ │ for passenger   │  │
    │                           │                           │ └─────────────────┘  │
    │                           │                           │                      │
    │                           │                           │ WebSocket message    │
    │                           │                           │ {type: "location",   │
    │                           │                           │  data: {...}}        │
    │                           │                           │ ────────────────────▶│
    │                           │                           │                      │
    │                           │                           │                      │ ┌───────────────┐
    │                           │                           │                      │ │ Update map    │
    │                           │                           │                      │ │ Show progress │
    │                           │                           │                      │ │ Update ETA    │
    │                           │                           │                      │ └───────────────┘
    │                           │                           │                      │
    │                           │   Alternative: REST API   │                      │
    │                           │                           │ GET /rides/{id}/track│
    │                           │                           │ ◄────────────────────│
    │                           │                           │                      │
    │                           │                           │ 200 OK               │
    │                           │                           │ {location, eta}      │
    │                           │                           │ ────────────────────▶│
```

## Payment Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Payment Processing Flow                            │
└─────────────────────────────────────────────────────────────────────────────┘

Driver App              Ride Service           Payment Service         Payment Gateway
    │                        │                        │                        │
    │ PATCH /rides/{id}/     │                        │                        │
    │ complete               │                        │                        │
    │──────────────────────→ │                        │                        │
    │                        │                        │                        │
    │                        │ ┌─────────────────┐    │                        │
    │                        │ │ Calculate final │    │                        │
    │                        │ │ fare based on   │    │                        │
    │                        │ │ distance/time   │    │                        │
    │                        │ └─────────────────┘    │                        │
    │                        │                        │                        │
    │ 200 OK                 │                        │                        │
    │ {final_fare, duration} │                        │                        │
    │◄────────────────────── │                        │                        │
    │                        │                        │                        │
                              │                        │
Passenger App                 │                        │
    │                        │                        │                        │
    │ POST /payments         │                        │                        │
    │ {ride_id, amount,      │                        │                        │
    │  payment_method, tip}  │                        │                        │
    │──────────────────────→ │                        │                        │
    │                        │                        │                        │
    │                        │ ┌─────────────────┐    │                        │
    │                        │ │ Validate amount │    │                        │
    │                        │ │ Check ride      │    │                        │
    │                        │ │ status          │    │                        │
    │                        │ └─────────────────┘    │                        │
    │                        │                        │                        │
    │                        │  Process payment       │                        │
    │                        │──────────────────────→ │                        │
    │                        │                        │                        │
    │                        │                        │ ┌─────────────────┐    │
    │                        │                        │ │ Prepare payment │    │
    │                        │                        │ │ request         │    │
    │                        │                        │ └─────────────────┘    │
    │                        │                        │                        │
    │                        │                        │  Charge card           │
    │                        │                        │──────────────────────→ │
    │                        │                        │                        │
    │                        │                        │                        │ ┌───────────────┐
    │                        │                        │                        │ │ Process card  │
    │                        │                        │                        │ │ transaction   │
    │                        │                        │                        │ │ Handle 3DS    │
    │                        │                        │                        │ └───────────────┘
    │                        │                        │                        │
    │                        │                        │  Payment result        │
    │                        │                        │ ◄──────────────────────│
    │                        │                        │                        │
    │                        │                        │ ┌─────────────────┐    │
    │                        │                        │ │ Update payment  │    │
    │                        │                        │ │ status          │    │
    │                        │                        │ │ Generate receipt│    │
    │                        │                        │ └─────────────────┘    │
    │                        │                        │                        │
    │                        │  Payment complete      │                        │
    │                        │ ◄──────────────────────│                        │
    │                        │                        │                        │
    │                        │ ┌─────────────────┐    │                        │
    │                        │ │ Update ride     │    │                        │
    │                        │ │ payment status  │    │                        │
    │                        │ │ Send receipt    │    │                        │
    │                        │ └─────────────────┘    │                        │
    │                        │                        │                        │
    │ 200 OK                 │                        │                        │
    │ {payment_id, receipt}  │                        │                        │
    │◄────────────────────── │                        │                        │
    │                        │                        │                        │
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Error Handling Flow                              │
└─────────────────────────────────────────────────────────────────────────────┘

Client                        API Gateway              Service Layer
  │                               │                          │
  │ Request with invalid data     │                          │
  │─────────────────────────────→ │                          │
  │                               │                          │
  │                               │ ┌───────────────────┐    │
  │                               │ │ Rate limit check  │    │
  │                               │ │ Authentication    │    │
  │                               │ │ Input validation  │    │
  │                               │ └───────────────────┘    │
  │                               │                          │
  │ 429 Rate Limit Exceeded       │                          │
  │◄───────────────────────────── │                          │
  │ {error: {code: "RATE_LIMIT",  │                          │
  │  message: "Too many requests"}}│                         │
  │                               │                          │
  │                               │                          │
  │ Valid request                 │                          │
  │─────────────────────────────→ │                          │
  │                               │                          │
  │                               │  Forward request         │
  │                               │────────────────────────→ │
  │                               │                          │
  │                               │                          │ ┌──────────────┐
  │                               │                          │ │ Business     │
  │                               │                          │ │ logic error  │
  │                               │                          │ │ (e.g., no    │
  │                               │                          │ │ drivers)     │
  │                               │                          │ └──────────────┘
  │                               │                          │
  │                               │  Service error           │
  │                               │ ◄────────────────────────│
  │                               │                          │
  │                               │ ┌───────────────────┐    │
  │                               │ │ Map service error │    │
  │                               │ │ to HTTP status    │    │
  │                               │ │ Add request ID    │    │
  │                               │ │ Log error         │    │
  │                               │ └───────────────────┘    │
  │                               │                          │
  │ 422 Unprocessable Entity      │                          │
  │◄───────────────────────────── │                          │
  │ {error: {                     │                          │
  │   code: "NO_DRIVERS_AVAILABLE",│                         │
  │   message: "No drivers found",│                          │
  │   details: "Try again later", │                          │
  │   requestId: "req_12345"      │                          │
  │ }}                            │                          │
```

## System Architecture Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         System Architecture Overview                        │
└─────────────────────────────────────────────────────────────────────────────┘

Load Balancer          API Gateway           Microservices            Database
      │                     │                       │                      │
      │ HTTP Request        │                       │                      │
      │───────────────────→ │                       │                      │
      │                     │                       │                      │
      │                     │ ┌──────────────────┐  │                      │
      │                     │ │ Rate Limiting    │  │                      │
      │                     │ │ Authentication   │  │                      │
      │                     │ │ Request Routing  │  │                      │
      │                     │ └──────────────────┘  │                      │
      │                     │                       │                      │
      │                     │  Route to service     │                      │
      │                     │─────────────────────→ │                      │
      │                     │                       │                      │
      │                     │                       │ ┌──────────────────┐ │
      │                     │                       │ │ User Service     │ │
      │                     │                       │ │ Ride Service     │ │
      │                     │                       │ │ Payment Service  │ │
      │                     │                       │ │ Location Service │ │
      │                     │                       │ └──────────────────┘ │
      │                     │                       │                      │
      │                     │                       │  Database query      │
      │                     │                       │────────────────────→ │
      │                     │                       │                      │
      │                     │                       │                      │ ┌────────────────┐
      │                     │                       │                      │ │ User data      │
      │                     │                       │                      │ │ Ride data      │
      │                     │                       │                      │ │ Payment data   │
      │                     │                       │                      │ │ Location data  │
      │                     │                       │                      │ └────────────────┘
      │                     │                       │                      │
      │                     │                       │  Query result        │
      │                     │                       │ ◄────────────────────│
      │                     │                       │                      │
      │                     │  Service response     │                      │
      │                     │ ◄─────────────────────│                      │
      │                     │                       │                      │
      │                     │ ┌──────────────────┐  │                      │
      │                     │ │ Response         │  │                      │
      │                     │ │ formatting       │  │                      │
      │                     │ │ Error handling   │  │                      │
      │                     │ └──────────────────┘  │                      │
      │                     │                       │                      │
      │ HTTP Response       │                       │                      │
      │◄─────────────────── │                       │                      │
      │                     │                       │                      │

                           External Services
                                  │
        ┌─────────────────────────────────────────────────────────────┐
        │                                                             │
        ▼                        ▼                       ▼            ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│   Push       │    │   Payment    │    │   Maps/      │    │   SMS/Email │
│ Notification │    │   Gateway    │    │ Geocoding    │    │   Service   │
│   Service    │    │  (Stripe)    │    │  (Google)    │    │             │
└──────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

This comprehensive set of data flow diagrams illustrates how data moves through the cab booking service API for all major user journeys and system interactions.