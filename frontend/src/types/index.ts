export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string | null;
  semester?: number | null;
  avatarUrl?: string | null;
  prn?: string | null;
  tenthPercentage?: number | null;
  twelfthPercentage?: number | null;
  sem1Cgpa?: number | null;
  sem2Cgpa?: number | null;
  sem3Cgpa?: number | null;
  sem4Cgpa?: number | null;
  sem5Cgpa?: number | null;
  sem6Cgpa?: number | null;
  backlogs?: string | null;
  internships?: string | null;
  tgMentorName?: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface PublicConfig {
  collegeName: string;
  collegeShortName: string;
  collegeEmailDomain: string;
  departments: string[];
  semesters: number[];
  maxUploadSizeMb: number;
  allowedResourceExtensions: string[];
  allowedImageExtensions: string[];
}

export interface Course {
  id: number;
  courseCode: string;
  title: string;
  description?: string | null;
  department: string;
  semester: number;
  academicYear: string;
  courseType?: 'THEORY' | 'LAB' | 'PROJECT';
  credits?: number;
  facultyId: number;
  faculty?: {
    id: number;
    fullName: string;
    email: string;
    department?: string;
  };
  isArchived: boolean;
  isEnrolled?: boolean;
  isOwner?: boolean;
  enrolledCount?: number;
  resourcesCount?: number;
  assignmentsCount?: number;
  announcements?: Announcement[];
  resources?: Resource[];
  assignments?: Assignment[];
  enrollments?: Array<{
    student: {
      id: number;
      fullName: string;
      email: string;
      semester?: number;
      department?: string;
    };
  }>;
  createdAt: string;
}

export interface Announcement {
  id: number;
  courseId: number;
  authorId: number;
  author?: {
    id: number;
    fullName: string;
    role: string;
  };
  title: string;
  content: string;
  attachmentUrl?: string | null;
  createdAt: string;
}

export type ResourceCategory = 'NOTES' | 'PYQ' | 'ASSIGNMENT_REF' | 'REFERENCE_MATERIAL' | 'STUDENT_GUIDE' | 'OTHER';
export type ApprovalStatus = 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED';

export interface Resource {
  id: number;
  courseId?: number | null;
  title: string;
  description?: string | null;
  category: ResourceCategory;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploaderId: number;
  uploaderRole: string;
  uploader?: {
    id: number;
    fullName: string;
    role: string;
    department?: string;
  };
  approvalStatus: ApprovalStatus;
  reviewerId?: number | null;
  reviewer?: {
    id: number;
    fullName: string;
    role: string;
  } | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  downloadsCount: number;
  viewsCount: number;
  subjectCode?: string | null;
  department?: string | null;
  semester?: number | null;
  tags?: string | null;
  helpfulCount?: number;
  isBookmarked?: boolean;
  userRating?: boolean;
  course?: {
    id: number;
    courseCode: string;
    title: string;
  };
  createdAt: string;
}

export interface Assignment {
  id: number;
  courseId: number;
  facultyId: number;
  title: string;
  description: string;
  attachmentUrl?: string | null;
  maxMarks: number;
  dueDate: string;
  allowLate: boolean;
  course?: {
    id: number;
    courseCode: string;
    title: string;
    facultyId: number;
  };
  submissionsCount?: number;
  mySubmission?: Submission | null;
  submissions?: Submission[];
  createdAt: string;
}

export type SubmissionStatus = 'SUBMITTED' | 'GRADED' | 'RETURNED';

export interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
  student?: {
    id: number;
    fullName: string;
    email: string;
    semester?: number;
    department?: string;
  };
  filePath?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  submissionText?: string | null;
  submittedAt: string;
  isLate: boolean;
  marksAwarded?: number | null;
  facultyFeedback?: string | null;
  gradedAt?: string | null;
  status: SubmissionStatus;
  similarityScore?: number;
  matchedWithStudentName?: string;
}

export type ProductCategory = 'TEXTBOOK' | 'CALCULATOR' | 'LAB_COAT' | 'STATIONERY' | 'ELECTRONICS' | 'HOSTEL_ITEM' | 'SPORTS' | 'ACADEMIC_MATERIAL' | 'OTHER';
export type ProductCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'USED' | 'HEAVILY_USED';
export type ProductStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'REMOVED';

export interface ProductImage {
  id: number;
  productId: number;
  imagePath: string;
  isPrimary: boolean;
}

export interface MarketplaceProduct {
  id: number;
  sellerId: number;
  seller?: {
    id: number;
    fullName: string;
    department?: string;
    semester?: number;
    avatarUrl?: string;
  };
  title: string;
  description: string;
  category: ProductCategory;
  price: number;
  condition: ProductCondition;
  campusInfo?: string | null;
  status: ProductStatus;
  moderationStatus: string;
  viewsCount: number;
  images: ProductImage[];
  isFavorited?: boolean;
  isMine?: boolean;
  activeRequest?: PurchaseRequest | null;
  existingConversationId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface PurchaseRequest {
  id: number;
  productId: number;
  product?: MarketplaceProduct;
  buyerId: number;
  buyer?: {
    id: number;
    fullName: string;
    department?: string;
    semester?: number;
  };
  sellerId: number;
  seller?: {
    id: number;
    fullName: string;
    department?: string;
    semester?: number;
  };
  status: PurchaseRequestStatus;
  message?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  sender?: {
    id: number;
    fullName: string;
    avatarUrl?: string;
  };
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: number;
  productId: number;
  product?: MarketplaceProduct;
  buyerId: number;
  buyer?: User;
  sellerId: number;
  seller?: User;
  otherUser?: {
    id: number;
    fullName: string;
    department?: string;
    semester?: number;
    avatarUrl?: string;
  };
  lastMessage?: Message | null;
  unreadCount?: number;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId?: number | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  details?: string | null;
  createdAt: string;
}
