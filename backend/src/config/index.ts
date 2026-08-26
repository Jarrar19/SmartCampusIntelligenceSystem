import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecretFromEnv = process.env.JWT_SECRET;

if (isProduction && (!jwtSecretFromEnv || jwtSecretFromEnv === 'smart-campus-jwt-super-secret-key-production-ready-2026-safe')) {
  throw new Error('FATAL SECURITY ERROR: process.env.JWT_SECRET must be explicitly configured with a strong secret in production environment!');
}

export const config = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  JWT_SECRET: jwtSecretFromEnv || 'smart-campus-jwt-super-secret-key-production-ready-2026-safe',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Campus Branding & Domain Configuration
  COLLEGE_NAME: process.env.COLLEGE_NAME || 'St. Bernard Institute of Technology',
  COLLEGE_SHORT_NAME: process.env.COLLEGE_SHORT_NAME || 'SBIT',
  COLLEGE_EMAIL_DOMAIN: (process.env.COLLEGE_EMAIL_DOMAIN || 'sbjit.edu.in').toLowerCase().trim(),
  COLLEGE_DEPARTMENTS: (process.env.COLLEGE_DEPARTMENTS || 'Computer Science & Engineering,Electronics & Communication Engineering,Electrical Engineering,Mechanical Engineering,Civil Engineering,Information Technology,Applied Sciences & Humanities').split(','),
  COLLEGE_SEMESTERS: (process.env.COLLEGE_SEMESTERS || '1,2,3,4,5,6,7,8').split(',').map(s => parseInt(s.trim(), 10)),

  // Storage
  STORAGE_DIR: path.resolve(__dirname, '../../storage'),
  MAX_UPLOAD_SIZE_MB: 25,
  ALLOWED_RESOURCE_EXTENSIONS: ['pdf', 'docx', 'pptx', 'xlsx', 'txt', 'zip', 'png', 'jpg', 'jpeg'],
  ALLOWED_IMAGE_EXTENSIONS: ['png', 'jpg', 'jpeg', 'webp'],

  // Dev Mode
  DEV_MODE: process.env.DEV_MODE === 'true' || !isProduction,
  AUTO_VERIFY_EMAILS_IN_DEV: process.env.AUTO_VERIFY_EMAILS_IN_DEV === 'true',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173'
};

