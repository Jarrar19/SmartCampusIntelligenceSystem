import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { config } from '../config';
import { Request } from 'express';

// Ensure storage subdirectories exist
export function ensureStorageDirs() {
  const dirs = ['resources', 'assignments', 'marketplace', 'general'];
  for (const dir of dirs) {
    const fullPath = path.join(config.STORAGE_DIR, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

ensureStorageDirs();

export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function sanitizeFilename(filename: string): string {
  const base = path.basename(filename);
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Multer memory storage so we can validate file bytes, size, and hash before saving to disk
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  },
});

export function saveBufferToFile(
  buffer: Buffer,
  categoryFolder: string,
  originalFilename: string,
  allowedExtensions?: string[]
): {
  relativePath: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
} {
  const cleanName = sanitizeFilename(originalFilename);
  const ext = cleanName.split('.').pop()?.toLowerCase() || '';
  const allowed = allowedExtensions || config.ALLOWED_RESOURCE_EXTENSIONS;

  if (!ext || !allowed.includes(ext)) {
    throw new Error(`File extension .${ext} is not allowed. Allowed: ${allowed.join(', ')}`);
  }

  const fileHash = calculateFileHash(buffer);
  const uniqueFilename = `${crypto.randomUUID()}.${ext}`;
  const targetDir = path.join(config.STORAGE_DIR, categoryFolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = path.join(targetDir, uniqueFilename);
  
  // Guard against path traversal
  const realTargetPath = path.resolve(targetPath);
  const realStorageDir = path.resolve(config.STORAGE_DIR);
  if (!realTargetPath.startsWith(realStorageDir)) {
    throw new Error('Path traversal attack detected');
  }

  fs.writeFileSync(targetPath, buffer);

  const relativePath = path.join(categoryFolder, uniqueFilename).replace(/\\/g, '/');
  return {
    relativePath,
    fileName: cleanName,
    fileSize: buffer.length,
    fileHash,
  };
}

export function resolveFilePath(relativePath: string): string {
  const cleanRel = relativePath.replace(/^(\.\.[\/\\])+/, '').replace(/^[\/\\]+/, '');
  const fullPath = path.join(config.STORAGE_DIR, cleanRel);
  const realPath = path.resolve(fullPath);
  const realStorageDir = path.resolve(config.STORAGE_DIR);

  if (!realPath.startsWith(realStorageDir)) {
    throw new Error('Access denied');
  }

  if (!fs.existsSync(realPath)) {
    throw new Error('File not found');
  }

  return realPath;
}
