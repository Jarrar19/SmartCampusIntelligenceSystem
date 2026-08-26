import { User, UserRole } from '../types';

export function isFacultyOrAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'FACULTY' || user.role === 'ADMIN';
}

export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'ADMIN';
}

export function isStudent(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'STUDENT';
}

export function canCreateCourse(user: User | null | undefined): boolean {
  return isFacultyOrAdmin(user);
}

export function canManageCourse(user: User | null | undefined, courseFacultyId?: number): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'FACULTY') {
    return courseFacultyId ? user.id === courseFacultyId : true;
  }
  return false;
}

export function canModerateResources(user: User | null | undefined): boolean {
  return isFacultyOrAdmin(user);
}

export function canGradeAssignment(user: User | null | undefined, assignmentFacultyId?: number): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'FACULTY') {
    return assignmentFacultyId ? user.id === assignmentFacultyId : true;
  }
  return false;
}

export function canSubmitAssignment(user: User | null | undefined): boolean {
  return isStudent(user);
}

export function canUploadResource(user: User | null | undefined): boolean {
  return !!user;
}

export function canListMarketplaceProduct(user: User | null | undefined): boolean {
  return !!user;
}

export function canEditMarketplaceProduct(user: User | null | undefined, sellerId: number): boolean {
  if (!user) return false;
  return user.id === sellerId || user.role === 'ADMIN';
}
