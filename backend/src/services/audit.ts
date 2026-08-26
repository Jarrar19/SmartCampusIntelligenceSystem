import { prisma } from './prisma';

export async function logAuditEvent(params: {
  userId?: number | null;
  action: string;
  resourceType: string;
  resourceId?: string | number | null;
  ipAddress?: string | null;
  details?: Record<string, any> | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId ? String(params.resourceId) : null,
        ipAddress: params.ipAddress || null,
        details: params.details ? JSON.stringify(params.details) : null,
      },
    });
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR] Could not write audit log:', error);
  }
}
