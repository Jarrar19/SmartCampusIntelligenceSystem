import { Router } from 'express';
import { getPublicConfig } from '../controllers/configController';
import * as authController from '../controllers/authController';
import * as userController from '../controllers/userController';
import * as courseController from '../controllers/courseController';
import * as resourceController from '../controllers/resourceController';
import * as assignmentController from '../controllers/assignmentController';
import * as marketplaceController from '../controllers/marketplaceController';
import * as chatController from '../controllers/chatController';
import * as resultController from '../controllers/resultController';
import { authenticate, requireRole } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { memoryUpload } from '../services/fileStorage';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Public Config
router.get('/config', getPublicConfig);

// Auth Routes (Rate limited)
router.post('/auth/register', authLimiter, asyncHandler(authController.register));
router.post('/auth/login', authLimiter, asyncHandler(authController.login));
router.post('/auth/verify-email', asyncHandler(authController.verifyEmail));
router.post('/auth/forgot-password', authLimiter, asyncHandler(authController.forgotPassword));
router.post('/auth/reset-password', authLimiter, asyncHandler(authController.resetPassword));
router.get('/auth/me', authenticate, asyncHandler(authController.getMe));
router.post('/auth/change-password', authenticate, asyncHandler(authController.changePassword));
router.post('/auth/logout', authenticate, asyncHandler(authController.logout));
router.post('/auth/promote-role', authenticate, requireRole(['ADMIN']), asyncHandler(authController.promoteUserRole));

// User & Notification Routes
router.patch('/users/profile', authenticate, asyncHandler(userController.updateProfile));
router.get('/users/notifications', authenticate, asyncHandler(userController.getNotifications));
router.patch('/users/notifications/:id/read', authenticate, asyncHandler(userController.markNotificationRead));
router.get('/users/audit-logs', authenticate, asyncHandler(userController.getAuditLogs));
router.get('/users/dashboard-stats', authenticate, asyncHandler(userController.getDashboardStats));

// Course Routes
router.get('/courses', authenticate, asyncHandler(courseController.getCourses));
router.get('/courses/:id', authenticate, asyncHandler(courseController.getCourseById));
router.post('/courses', authenticate, requireRole(['FACULTY', 'ADMIN']), asyncHandler(courseController.createCourse));
router.patch('/courses/:id', authenticate, requireRole(['FACULTY', 'ADMIN']), asyncHandler(courseController.updateCourse));
router.delete('/courses/:id', authenticate, requireRole(['FACULTY', 'ADMIN']), asyncHandler(courseController.deleteCourse));
router.post('/courses/:id/enroll', authenticate, asyncHandler(courseController.enrollInCourse));
router.delete('/courses/:id/unenroll', authenticate, asyncHandler(courseController.unenrollFromCourse));
router.post('/courses/:id/announcements', authenticate, requireRole(['FACULTY', 'ADMIN']), asyncHandler(courseController.createAnnouncement));
router.get('/courses/:id/roster', authenticate, asyncHandler(courseController.getCourseRoster));
router.patch('/courses/:id/students/:studentId/grade', authenticate, requireRole(['FACULTY', 'ADMIN']), asyncHandler(courseController.updateStudentGrade));

// Exam Result & Marksheet Routes
router.post('/results/publish', authenticate, requireRole(['HOD', 'ADMIN']), asyncHandler(resultController.publishResultNotification));
router.get('/results/publication/latest', authenticate, asyncHandler(resultController.getLatestResultPublication));
router.get('/results/my-result', authenticate, asyncHandler(resultController.getMyExamResult));

// Resource & Moderation Routes
router.get('/resources', authenticate, asyncHandler(resourceController.getResources));
router.get('/resources/moderation-queue', authenticate, requireRole(['FACULTY', 'ADMIN']), asyncHandler(resourceController.getModerationQueue));
router.get('/resources/:id', authenticate, asyncHandler(resourceController.getResourceById));
router.get('/resources/:id/download', authenticate, asyncHandler(resourceController.downloadResource));
router.post('/resources', authenticate, memoryUpload.single('file'), asyncHandler(resourceController.uploadResource));
router.patch('/resources/:id/moderate', authenticate, requireRole(['FACULTY', 'ADMIN']), asyncHandler(resourceController.moderateResource));
router.post('/resources/:id/rating', authenticate, asyncHandler(resourceController.toggleRating));
router.post('/resources/:id/bookmark', authenticate, asyncHandler(resourceController.toggleBookmark));
router.delete('/resources/:id', authenticate, asyncHandler(resourceController.deleteResource));

// Assignment & Submission Routes
router.get('/assignments/faculty/submissions', authenticate, requireRole(['FACULTY', 'ADMIN']), asyncHandler(assignmentController.getFacultySubmissions));
router.post('/assignments', authenticate, requireRole(['FACULTY', 'ADMIN']), asyncHandler(assignmentController.createAssignment));
router.get('/assignments/:id', authenticate, asyncHandler(assignmentController.getAssignmentById));
router.patch('/assignments/:id', authenticate, requireRole(['FACULTY', 'ADMIN']), asyncHandler(assignmentController.updateAssignment));
router.delete('/assignments/:id', authenticate, requireRole(['FACULTY', 'ADMIN']), asyncHandler(assignmentController.deleteAssignment));
router.post('/assignments/:id/submit', authenticate, requireRole(['STUDENT']), memoryUpload.single('file'), asyncHandler(assignmentController.submitAssignment));
router.patch('/assignments/submissions/:submissionId/grade', authenticate, requireRole(['FACULTY', 'ADMIN']), asyncHandler(assignmentController.gradeSubmission));
router.get('/assignments/submissions/:submissionId/download', authenticate, asyncHandler(assignmentController.downloadSubmissionFile));


// Marketplace & Purchase Routes
router.get('/marketplace/products', authenticate, asyncHandler(marketplaceController.getProducts));
router.get('/marketplace/products/:id', authenticate, asyncHandler(marketplaceController.getProductById));
router.post('/marketplace/products', authenticate, memoryUpload.array('images', 5), asyncHandler(marketplaceController.createProduct));
router.patch('/marketplace/products/:id', authenticate, asyncHandler(marketplaceController.updateProduct));
router.delete('/marketplace/products/:id', authenticate, asyncHandler(marketplaceController.deleteProduct));
router.post('/marketplace/products/:id/favorite', authenticate, asyncHandler(marketplaceController.toggleFavorite));
router.post('/marketplace/products/:id/request', authenticate, asyncHandler(marketplaceController.createPurchaseRequest));
router.patch('/marketplace/requests/:requestId', authenticate, asyncHandler(marketplaceController.updatePurchaseRequestStatus));
router.get('/marketplace/requests', authenticate, asyncHandler(marketplaceController.getMyPurchaseRequests));
router.post('/marketplace/reports', authenticate, asyncHandler(marketplaceController.createReport));

// In-App Chat Routes
router.get('/chat/conversations', authenticate, asyncHandler(chatController.getConversations));
router.post('/chat/conversations', authenticate, asyncHandler(chatController.startConversation));
router.get('/chat/conversations/:id', authenticate, asyncHandler(chatController.getConversationMessages));
router.post('/chat/conversations/:id/messages', authenticate, asyncHandler(chatController.sendMessage));
router.post('/chat/block-user', authenticate, asyncHandler(chatController.blockUser));

// AI Academic Advisor Routes
import aiRoutes from './ai';
router.use('/ai', aiRoutes);

export default router;
