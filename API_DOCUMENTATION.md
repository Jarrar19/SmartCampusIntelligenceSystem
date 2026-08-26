# 📖 REST API Specification & Endpoint Documentation

**Base API URL**: `http://localhost:5000/api/v1`  
**Authentication**: Bearer JWT (`Authorization: Bearer <token>`)  
**Standard Response Format**:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

---

## 1. System & Configuration

### `GET /config`
*Public endpoint providing institutional settings, allowed domain, and branding.*
- **Auth**: None
- **Response**:
```json
{
  "success": true,
  "data": {
    "collegeName": "St. Bernard Institute of Technology",
    "collegeShortName": "SBIT",
    "collegeEmailDomain": "sbjit.edu.in",
    "departments": ["Computer Science & Engineering", "..."],
    "semesters": [1, 2, 3, 4, 5, 6, 7, 8],
    "maxUploadSizeMb": 25
  }
}
```

---

## 2. Authentication (`/auth`)

### `POST /auth/register`
*Register new student or faculty account with institutional domain verification.*
- **Auth**: None
- **Request Body**:
```json
{
  "email": "alex@sbjit.edu.in",
  "password": "Password@123",
  "fullName": "Alex Rivera",
  "role": "STUDENT",
  "department": "Computer Science & Engineering",
  "semester": 6
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration successful!",
  "data": {
    "user": { "id": 2, "email": "alex@sbjit.edu.in", "role": "STUDENT" },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

### `POST /auth/login`
*Login with email & password.*
- **Auth**: None
- **Request Body**:
```json
{
  "email": "faculty1@sbjit.edu.in",
  "password": "Password@123"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": 1, "fullName": "Prof. Sarah Jenkins", "role": "FACULTY" },
    "accessToken": "eyJhbGciOi..."
  }
}
```

### `GET /auth/me`
*Get authenticated user profile.*
- **Auth**: Bearer Token
- **Response (200 OK)**: Current user profile object.

---

## 3. Courses & LMS (`/courses`)

### `GET /courses`
*List all academic courses with search, department, and semester filters.*
- **Query Params**: `search`, `department`, `semester`, `myOnly=true`
- **Auth**: Bearer Token

### `POST /courses`
*Create new academic course.*
- **Auth**: Bearer Token (`FACULTY` or `ADMIN` only)
- **Request Body**:
```json
{
  "courseCode": "CS301",
  "title": "Data Structures & Algorithms",
  "description": "Core computer science fundamentals",
  "department": "Computer Science & Engineering",
  "semester": 5,
  "academicYear": "2025-2026"
}
```

### `GET /courses/:id`
*Get detailed course workspace with announcements, resources, assignments, and enrollments.*
- **Auth**: Bearer Token

### `POST /courses/:id/enroll`
*Enroll student in course.*
- **Auth**: Bearer Token (`STUDENT` only)

### `DELETE /courses/:id/unenroll`
*Unenroll student from course.*
- **Auth**: Bearer Token (`STUDENT` only)

### `POST /courses/:id/announcements`
*Post announcement to course members.*
- **Auth**: Bearer Token (`FACULTY` instructor only)
- **Request Body**: `{ "title": "...", "content": "..." }`

---

## 4. Academic Resources & Moderation (`/resources`)

### `GET /resources`
*Search and filter verified academic materials and PYQs.*
- **Query Params**: `search`, `category`, `department`, `semester`, `sort`, `bookmarkedOnly`, `myUploads`
- **Auth**: Bearer Token

### `POST /resources`
*Upload lecture notes, PYQs, or study guides (Multipart Form Data).*
- **Auth**: Bearer Token
- **Form Fields**: `title`, `description`, `category` (`NOTES`, `PYQ`, `STUDENT_GUIDE`, `REFERENCE_MATERIAL`), `subjectCode`, `department`, `semester`, `file`
- **Behavior**:
  - Uploaded by `FACULTY` $\rightarrow$ Status: `APPROVED`
  - Uploaded by `STUDENT` $\rightarrow$ Status: `PENDING_REVIEW`

### `GET /resources/moderation-queue`
*Get pending, approved, or rejected uploads for faculty review.*
- **Auth**: Bearer Token (`FACULTY` or `ADMIN` only)
- **Query Params**: `status` (`PENDING_REVIEW` | `APPROVED` | `REJECTED`)

### `PATCH /resources/:id/moderate`
*Approve or reject a student upload.*
- **Auth**: Bearer Token (`FACULTY` or `ADMIN` only)
- **Request Body**:
```json
{
  "status": "APPROVED",
  "rejectionReason": null
}
```

### `GET /resources/:id/download`
*Secure file download (increments download counter).*
- **Auth**: Bearer Token

### `POST /resources/:id/rating`
*Toggle helpfulness rating.*
- **Auth**: Bearer Token

### `POST /resources/:id/bookmark`
*Toggle bookmarking.*
- **Auth**: Bearer Token

---

## 5. Course Assignments & Submissions (`/assignments`)

### `POST /assignments`
*Create course assignment.*
- **Auth**: Bearer Token (`FACULTY` instructor only)
- **Request Body**:
```json
{
  "courseId": 1,
  "title": "Lab 4: Red-Black Tree Implementation",
  "description": "Implement node rotation and balancing in C++",
  "maxMarks": 100,
  "dueDate": "2026-09-01T23:59:59.000Z",
  "allowLate": true
}
```

### `POST /assignments/:id/submit`
*Turn in assignment deliverable (Multipart Form Data).*
- **Auth**: Bearer Token (`STUDENT` only)
- **Form Fields**: `submissionText` (notes / repo link), `file` (optional attachment)

### `PATCH /assignments/submissions/:id/grade`
*Evaluate student submission.*
- **Auth**: Bearer Token (`FACULTY` instructor only)
- **Request Body**:
```json
{
  "marksAwarded": 95,
  "facultyFeedback": "Excellent memory efficiency and clean time complexity.",
  "status": "GRADED"
}
```

---

## 6. Campus Marketplace (`/marketplace`)

### `GET /marketplace/products`
*Browse active campus products.*
- **Query Params**: `search`, `category`, `condition`, `sellerId`, `sort`
- **Auth**: Bearer Token

### `POST /marketplace/products`
*List item for sale or giveaway (Multipart Form Data).*
- **Auth**: Bearer Token
- **Form Fields**: `title`, `description`, `category`, `price` (0 for Free), `condition`, `campusInfo`, `images` (Up to 4)

### `POST /marketplace/products/:id/request`
*Buyer submits purchase / physical handover request.*
- **Auth**: Bearer Token (`STUDENT` only, cannot request own item)
- **Request Body**: `{ "message": "Can we meet at library lawn?" }`

### `PATCH /marketplace/requests/:id`
*Update handover request status.*
- **Auth**: Bearer Token
- **Allowed Transitions**:
  - `ACCEPTED` $\rightarrow$ Item automatically transitions to `RESERVED`
  - `COMPLETED` $\rightarrow$ Item automatically transitions to `SOLD`
  - `REJECTED` | `CANCELLED`

---

## 7. Real-Time Chat & Messaging (`/chat`)

### `GET /chat/conversations`
*List user's active direct conversations.*
- **Auth**: Bearer Token

### `POST /chat/conversations`
*Initialize conversation or attach to marketplace listing.*
- **Auth**: Bearer Token
- **Request Body**: `{ "recipientId": 2, "productId": 1 }`

### `POST /chat/conversations/:id/messages`
*Send message inside conversation.*
- **Auth**: Bearer Token
- **Request Body**: `{ "content": "Hi! Is the textbook available?" }`
- **WebSocket Broadcast**: Emits `message:new` event to recipient in real-time.

---

## 8. Security Audit Logs (`/users/audit-logs`)

### `GET /users/audit-logs`
*Query immutable security event stream.*
- **Auth**: Bearer Token
- **Response**: Array of audit log events (`AUTH_LOGIN_SUCCESS`, `COURSE_CREATED`, `RESOURCE_APPROVED`, `MARKETPLACE_SOLD`).
