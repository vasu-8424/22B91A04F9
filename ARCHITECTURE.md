# URL Shortener Architecture Diagram

## System Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   Client/User   │    │   Express.js     │    │   Controllers   │    │    MongoDB       │
│   (Postman/    │    │   Middleware     │    │   (Business     │    │   (Data Store)   │
│    Browser)     │    │   Stack          │    │    Logic)       │    │                  │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └──────────────────┘
         │                       │                       │                       │
         │  HTTP Request         │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │                       │ ┌─────────────────┐   │                       │
         │                       │ │  CORS Handler   │   │                       │
         │                       │ └─────────────────┘   │                       │
         │                       │ ┌─────────────────┐   │                       │
         │                       │ │  JSON Parser    │   │                       │
         │                       │ └─────────────────┘   │                       │
         │                       │ ┌─────────────────┐   │                       │
         │                       │ │ Logging Middle  │   │                       │
         │                       │ │     ware        │   │                       │
         │                       │ └─────────────────┘   │                       │
         │                       │                       │                       │
         │                       │   Route Processing    │                       │
         │                       ├──────────────────────►│                       │
         │                       │                       │                       │
         │                       │                       │  Validation &         │
         │                       │                       │  Business Logic       │
         │                       │                       │                       │
         │                       │                       │   Database Query      │
         │                       │                       ├──────────────────────►│
         │                       │                       │                       │
         │                       │                       │   Query Result        │
         │                       │                       │◄──────────────────────┤
         │                       │                       │                       │
         │                       │   Response Data       │                       │
         │                       │◄──────────────────────┤                       │
         │                       │                       │                       │
         │  HTTP Response        │                       │                       │
         │◄──────────────────────┤                       │                       │
         │                       │                       │                       │

                                          │
                                          ▼
                                ┌─────────────────┐
                                │  Logging File   │
                                │   events.log    │
                                │                 │
                                │ • Request logs  │
                                │ • Error logs    │
                                │ • Event logs    │
                                │ • Service logs  │
                                └─────────────────┘
```

## API Endpoint Flow

### POST /shorturls (Create Short URL)
```
Request → Validation → Check Duplicate → Generate/Use Shortcode → Save to DB → Response
    │         │              │                    │                  │           │
    │         │              │                    │                  │           │
   400       409            201                  201                201         201
  Error     Error         Success              Success            Success     Success
```

### GET /:shortcode (Redirect)
```
Request → Find in DB → Check Expiry → Update Clicks → Redirect (307)
    │          │            │             │              │
    │          │            │             │              │
   404        410          200           200            307
  Error      Error       Success       Success        Redirect
```

### GET /shorturls/:shortcode (Statistics)
```
Request → Find in DB → Return Stats (200)
    │          │            │
    │          │            │
   404        200          200
  Error     Success       Success
```

## Database Schema Structure

```
ShortUrl Collection
┌─────────────────────────────────────────────────────────────┐
│  _id: ObjectId (MongoDB auto-generated)                    │
│  shortcode: String (unique, required, indexed)             │
│  original: String (required, validated URL)                │
│  created: Date (default: Date.now)                         │
│  expiry: Date (required, TTL indexed)                      │
│  clicks: Number (default: 0)                               │
│  clickLogs: Array [                                        │
│    {                                                        │
│      time: Date,                                            │
│      referrer: String,                                      │
│      ip: String                                             │
│    }                                                        │
│  ]                                                          │
└─────────────────────────────────────────────────────────────┘

Indexes:
• {shortcode: 1} - Unique index for fast lookups
• {expiry: 1} - TTL index for automatic document expiration
```

## Logging Middleware Flow

```
Incoming Request
       │
       ▼
┌─────────────────┐
│ Log HTTP Request│
│ (Method, URL,   │
│  IP, Timestamp) │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│  Process Route  │
│   & Business    │
│     Logic       │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│  Response sent  │
│    (on finish   │
│     event)      │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Log Response    │
│ Status & Errors │
│ (if status >=   │
│     400)        │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│  Write to File  │
│   events.log    │
└─────────────────┘
```
