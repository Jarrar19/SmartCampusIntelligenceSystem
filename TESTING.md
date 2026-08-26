# 🧪 Testing & Verification Strategy

**Test Framework**: Vitest (v1.6.1) + Supertest (v6.3.4)  
**Execution Environment**: In-Memory SQLite Test Suite  

---

## 1. Test Suite Summary

All **27/27 automated unit, integration, and security tests** pass cleanly with zero failures.

| Suite | File | Tests | Focus Areas |
| :--- | :--- | :---: | :--- |
| **Authentication & Domain** | `tests/auth.test.ts` | **8** | `@sbjit.edu.in` domain enforcement, rejection of personal emails (`@gmail.com`, `@yahoo.com`), password hashing, JWT generation, invalid token handling. |
| **Security & IDOR Guards** | `tests/security_idor.test.ts` | **6** | Student cannot edit/delete another student's marketplace product, student cannot access faculty moderation queue, student cannot grade assignments, cross-student private chat isolation. |
| **Academic Hub & LMS** | `tests/academic.test.ts` | **6** | Course creation, student enrollment, faculty auto-approved resources vs student uploads entering `PENDING_REVIEW` moderation queue, assignment submissions, late submission check, faculty grading and marks calculation. |
| **Campus Marketplace** | `tests/marketplace.test.ts` | **7** | Product listings with search & category filters, purchase request creation, self-buy prevention, seller accept $\rightarrow$ status `RESERVED`, buyer-seller private chat, seller mark $\rightarrow$ `SOLD`. |

---

## 2. Running Automated Tests

To execute the test suite:
```bash
cd backend
npm test
```

### Full Test Output
```
 RUN  v1.6.1 C:/Users/DELL/OneDrive/Desktop/cc/backend

 ✓ tests/security_idor.test.ts  (6 tests) 1132ms
 ✓ tests/auth.test.ts          (8 tests) 1165ms
 ✓ tests/marketplace.test.ts   (7 tests) 1198ms
 ✓ tests/academic.test.ts      (6 tests) 1306ms

 Test Files  4 passed (4)
      Tests  27 passed (27)
   Duration  9.65s
```

---

## 3. IDOR & Security Guard Verification

The following security properties are verified by automated tests:

1. **Horizontal Privilege Escalation (IDOR) on Marketplace**:
   - `PATCH /api/v1/marketplace/products/:id` with User B attempting to edit User A's product returns **`403 Forbidden`**.
   - `DELETE /api/v1/marketplace/products/:id` with User B attempting to delete User A's product returns **`403 Forbidden`**.
2. **Vertical Privilege Escalation on Moderation**:
   - `GET /api/v1/resources/moderation-queue` by `STUDENT` returns **`403 Forbidden`**.
   - `PATCH /api/v1/resources/:id/moderate` by `STUDENT` returns **`403 Forbidden`**.
3. **Vertical Privilege Escalation on Grading**:
   - `PATCH /api/v1/assignments/submissions/:id/grade` by `STUDENT` returns **`403 Forbidden`**.
4. **Chat Isolation**:
   - `GET /api/v1/chat/conversations/:id` by an uninvited third student returns **`403 Forbidden`**.
