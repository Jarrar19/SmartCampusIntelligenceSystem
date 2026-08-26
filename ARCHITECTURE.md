# 🏛️ Architecture & System Design Document

**Project**: Smart Campus Intelligence System  
**Phase**: Phase 1 MVP (Authentication, Academic Hub & Learning Management, Campus Marketplace)  
**Author**: Lead Systems Architect  

---

## 1. Architectural Philosophy & Strategy

The Smart Campus Intelligence System is engineered around three guiding principles:

1. **Strict Institutional Data Sovereignty**: All data, identities, study documents, and communications remain strictly inside the institutional boundary.
2. **Zero Recurring Infrastructure & Vendor Costs (₹0 Cost)**: The architecture avoids all fee-based cloud services (e.g. Auth0, Clerk, SendGrid, Amazon S3, Pusher, Stripe) in favor of resilient open-source foundations (Prisma + SQLite, local storage with SHA-256 deduplication, self-hosted Socket.io).
3. **Defense-in-Depth Security**: Role-based access control (RBAC), parameter validation via Zod, path-traversal prevention, SHA-256 integrity verification, IDOR security guards, and immutable audit logs.

---

## 2. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Client Layer
        SPA["React 18 + TypeScript + Vite SPA"]
        Tailwind["Tailwind CSS + Glassmorphism UI"]
        AxiosClient["Axios HTTP Interceptor (Bearer JWT)"]
        SocketClient["Socket.io Client (Real-time Chat)"]
    end

    subgraph API Gateway & Server Layer
        ExpressServer["Express.js 4 Application"]
        RateLimiter["Rate Limiting Middleware"]
        AuthMiddleware["JWT Authentication & RBAC Guards"]
        AuditService["Security Audit Event Logger"]
        SocketServer["Socket.io WebSocket Server"]
    end

    subgraph Business Logic & Controllers
        AuthCtrl["Auth Controller (@sbjit.edu.in Guard)"]
        CourseCtrl["Course & Announcement Controller"]
        ResourceCtrl["Resource & Moderation Queue Controller"]
        AssignmentCtrl["Assignment & Grading Controller"]
        MarketCtrl["Marketplace & Request State Machine"]
        ChatCtrl["In-App Messaging & Privacy Controller"]
    end

    subgraph Data & Storage Layer
        Prisma["Prisma ORM (Strict Foreign Keys & Cascades)"]
        SQLite[("SQLite Embedded Database (dev.db)")]
        FileStorage["Local File Storage (/storage) with SHA-256 Hash"]
    end

    SPA --> AxiosClient
    SPA --> SocketClient

    AxiosClient --> ExpressServer
    SocketClient --> SocketServer

    ExpressServer --> RateLimiter
    RateLimiter --> AuthMiddleware
    AuthMiddleware --> AuditService
    AuthMiddleware --> AuthCtrl & CourseCtrl & ResourceCtrl & AssignmentCtrl & MarketCtrl & ChatCtrl

    AuthCtrl & CourseCtrl & ResourceCtrl & AssignmentCtrl & MarketCtrl & ChatCtrl --> Prisma
    ResourceCtrl & AssignmentCtrl & MarketCtrl --> FileStorage
    Prisma --> SQLite
```

---

## 3. Core Subsystems & Workflows

### 3.1. Authentication & Institutional Domain Validation

```mermaid
sequenceDiagram
    autonumber
    actor User as Student / Faculty
    participant Client as React SPA
    participant API as Express Auth Controller
    participant DB as Prisma / SQLite
    participant Audit as Audit Log Service

    User->>Client: Enters Email & Password
    Client->>API: POST /api/v1/auth/register (or /login)
    API->>API: Verify Email matches COLLEGE_EMAIL_DOMAIN (@sbjit.edu.in)
    alt Non-institutional email (@gmail.com)
        API-->>Client: 400 Bad Request ("Only institutional emails permitted")
    else Valid institutional email
        API->>DB: Check if email exists / Query User
        API->>API: Compare bcrypt password hash (salt rounds 12)
        API->>API: Generate JWT Access & Refresh Tokens
        API->>Audit: Log AUTH_LOGIN_SUCCESS event
        API-->>Client: 200 OK + JWT Token + User Profile
        Client->>Client: Store token in memory/localStorage & redirect
    end
```

---

### 3.2. Academic Hub: Quality-Controlled Moderation Pipeline

```mermaid
stateDiagram-v2
    [*] --> UploadInitiated
    
    state UploadInitiated {
        [*] --> CheckRole
        CheckRole --> FacultyUpload: Role == FACULTY
        CheckRole --> StudentUpload: Role == STUDENT
    }
    
    FacultyUpload --> APPROVED: Auto-Approved
    StudentUpload --> PENDING_REVIEW: Enters Moderation Queue
    
    state ModerationQueue {
        PENDING_REVIEW --> APPROVED: Faculty Approves
        PENDING_REVIEW --> REJECTED: Faculty Rejects (with Reason)
    }
    
    APPROVED --> PublicResourceLibrary: Published & Downloadable
    REJECTED --> StudentNotification: Constructive Feedback Returned
```

---

### 3.3. Campus Marketplace: Zero-Cost Handover State Machine

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE: Student Lists Product (Free or ₹)
    
    AVAILABLE --> PENDING: Buyer Sends Purchase Request
    
    state PENDING {
        BuyerRequest: Buyer Note Attached
    }
    
    PENDING --> AVAILABLE: Buyer Cancels or Seller Declines
    PENDING --> RESERVED: Seller Accepts Request
    
    state RESERVED {
        InAppChat: Buyer & Seller coordinate handover location via Socket.io
    }
    
    RESERVED --> SOLD: Physical Exchange Completed
    SOLD --> [*]
```

---

## 4. Security & Isolation Architecture

1. **In-App Privacy Shield**:
   - Marketplace listings and chat threads only expose the student's name, department, and semester.
   - Raw personal contact details (personal phone number, private email) are never leaked in public API responses.
2. **IDOR (Insecure Direct Object Reference) Prevention**:
   - Verified through automated tests: Students cannot modify or delete listings created by other students.
   - Students cannot approve moderation items or grade assignments.
3. **Local File Storage Security**:
   - File uploads are verified by MIME type and extension whitelisting.
   - Filenames are sanitized and prepended with cryptographically random identifiers to prevent directory traversal (`../`) attacks.
   - Files are stored in dedicated category subdirectories (`storage/resources/`, `storage/assignments/`, `storage/marketplace/`).

---

## 5. Technology Stack Specifications

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend Runtime** | Node.js (v20+) | High concurrency, native async/await, low resource footprint |
| **Framework** | Express.js 4 + TypeScript | Standardized routing, robust middleware ecosystem |
| **Database ORM** | Prisma 5 | Type-safe schema, automated migrations, relational querying |
| **Database Engine** | SQLite (Embedded) | Zero configuration, zero external daemon, high performance |
| **Realtime WebSockets** | Socket.io 4 | JWT-authenticated room-based pub/sub for chat & notifications |
| **Validation** | Zod | Runtime schema validation with typed error formatting |
| **Frontend Framework** | React 18 + Vite 5 + TypeScript | Lightning-fast HMR, SPA architecture, zero bundle bloat |
| **Styling** | Tailwind CSS v4 + Vanilla CSS | Modern dark slate palette, glassmorphism card elevation |
| **Icons** | Lucide React | Clean, modern feather icon set |
| **Test Runner** | Vitest + Supertest | Blazing fast in-memory execution, native ESM/TS support |
