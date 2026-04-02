import cloudinary from '../config/cloudinary.config';
import { AppError } from '../errorHelpers/AppError';

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
}

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  options?: { width?: number; height?: number; crop?: string },
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `hotel-management/${folder}`,
        resource_type: 'image',
        transformation: options
          ? [{ width: options.width, height: options.height, crop: options.crop || 'fill', quality: 'auto', fetch_format: 'auto' }]
          : [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError('Image upload failed', 500));
          return;
        }
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
        });
      },
    );
    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};
