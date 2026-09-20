import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { config } from '../config';
import { Request } from 'express';

// Ensure storage subdirectories exist
export function ensureStorageDirs() {
  const dirs = ['resources', 'assignments', 'marketplace', 'general', 'student_docs'];
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

/**
 * Deep inspection of file buffer header magic numbers to prevent MIME spoofing
 */
export function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  if (!buffer || buffer.length < 4) return false;

  const hexHeader = buffer.slice(0, 12).toString('hex').toUpperCase();

  switch (ext) {
    case 'pdf':
      // %PDF- => 25 50 44 46
      return hexHeader.startsWith('25504446');
    case 'png':
      // 89 50 4E 47
      return hexHeader.startsWith('89504E47');
    case 'jpg':
    case 'jpeg':
      // FF D8 FF
      return hexHeader.startsWith('FFD8FF');
    case 'webp':
      // RIFF....WEBP => 52 49 46 46 .... 57 45 42 50
      return buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
    case 'docx':
    case 'pptx':
    case 'xlsx':
    case 'zip':
      // PK.. => 50 4B 03 04 or 50 4B 05 06
      return hexHeader.startsWith('504B0304') || hexHeader.startsWith('504B0506');
    case 'txt':
    case 'csv':
    case 'py':
    case 'cpp':
    case 'c':
    case 'java':
    case 'js':
    case 'ts':
    case 'json':
      // Text files should contain valid UTF-8/ASCII characters without binary null bytes
      for (let i = 0; i < Math.min(buffer.length, 512); i++) {
        if (buffer[i] === 0x00) return false; // Null byte indicates binary executable
      }
      return true;
    default:
      return true;
  }
}

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

  // Deep Magic Byte Signature Inspection
  if (!validateMagicBytes(buffer, ext)) {
    throw new Error(`File integrity verification failed: Content signature does not match claimed .${ext} extension.`);
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
