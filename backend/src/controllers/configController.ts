import { Request, Response } from 'express';
import { config } from '../config';

export function getPublicConfig(req: Request, res: Response) {
  return res.json({
    success: true,
    data: {
      collegeName: config.COLLEGE_NAME,
      collegeShortName: config.COLLEGE_SHORT_NAME,
      collegeEmailDomain: config.COLLEGE_EMAIL_DOMAIN,
      departments: config.COLLEGE_DEPARTMENTS,
      semesters: config.COLLEGE_SEMESTERS,
      maxUploadSizeMb: config.MAX_UPLOAD_SIZE_MB,
      allowedResourceExtensions: config.ALLOWED_RESOURCE_EXTENSIONS,
      allowedImageExtensions: config.ALLOWED_IMAGE_EXTENSIONS,
    },
  });
}
