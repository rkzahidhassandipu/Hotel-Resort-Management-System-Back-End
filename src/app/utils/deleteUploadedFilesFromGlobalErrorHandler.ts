import { Request } from 'express';
import { deleteFromCloudinary } from './cloudinary';
import { logger } from './logger';

export const deleteUploadedFiles = async (req: Request): Promise<void> => {
  const files = req.files as Express.Multer.File[] | undefined;
  const file = req.file as Express.Multer.File | undefined;

  const allFiles = [...(files || []), ...(file ? [file] : [])];

  for (const f of allFiles) {
    if ((f as any).publicId) {
      try {
        await deleteFromCloudinary((f as any).publicId);
      } catch (err) {
        logger.error('Failed to delete uploaded file on error:', err);
      }
    }
  }
};
