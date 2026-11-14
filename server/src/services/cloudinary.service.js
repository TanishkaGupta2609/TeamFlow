import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary SDK
if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

// Local fallback uploads directory
const localUploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(localUploadsDir)) {
  try {
    fs.mkdirSync(localUploadsDir, { recursive: true });
  } catch (err) {
    // Ignore directory creation error in read-only setups
  }
}

export class CloudinaryService {
  /**
   * Check if real Cloudinary credentials are active.
   */
  static isConfigured() {
    return Boolean(
      config.cloudinary.cloudName &&
      config.cloudinary.apiKey &&
      config.cloudinary.apiSecret
    );
  }

  /**
   * Upload an in-memory buffer to Cloudinary with local fallback for offline/test environments.
   */
  static async uploadBuffer(buffer, {
    folder = 'teamflow',
    filename = 'upload',
    mimetype = 'application/octet-stream',
    resourceType = 'auto',
  } = {}) {
    const isImage = mimetype.startsWith('image/');
    const resolvedResourceType = resourceType !== 'auto' ? resourceType : (isImage ? 'image' : 'raw');

    // 1. Try Cloudinary if credentials configured
    if (CloudinaryService.isConfigured()) {
      try {
        return await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: resolvedResourceType,
              filename_override: filename,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve({
                url: result.secure_url || result.url,
                publicId: result.public_id,
                size: result.bytes || buffer.length,
                mimetype: result.format ? `${isImage ? 'image' : 'application'}/${result.format}` : mimetype,
                format: result.format,
                resourceType: result.resource_type,
              });
            }
          );
          uploadStream.end(buffer);
        });
      } catch (err) {
        console.warn(`[CloudinaryService] Cloudinary upload failed (${err.message}). Falling back to local storage.`);
      }
    }

    // 2. Graceful Fallback: Local Storage
    const timestamp = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const diskFileName = `${timestamp}_${safeName}`;
    const filePath = path.join(localUploadsDir, diskFileName);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${diskFileName}`;
    const publicId = `local_${diskFileName}`;

    return {
      url: publicUrl,
      publicId,
      size: buffer.length,
      mimetype,
      format: path.extname(filename).replace('.', '') || 'bin',
      resourceType: resolvedResourceType,
    };
  }

  /**
   * Remove a file from Cloudinary (or local storage).
   */
  static async deleteResource(publicId, resourceType = 'image') {
    if (!publicId) return { success: false };

    // 1. If local fallback
    if (publicId.startsWith('local_')) {
      const fileName = publicId.replace('local_', '');
      const filePath = path.join(localUploadsDir, fileName);
      if (fs.existsSync(filePath)) {
        try {
          await fs.promises.unlink(filePath);
        } catch (err) {
          console.warn(`[CloudinaryService] Failed to unlink local file: ${err.message}`);
        }
      }
      return { success: true };
    }

    // 2. Cloudinary deletion
    if (CloudinaryService.isConfigured()) {
      try {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
        });
        return { success: result.result === 'ok' || result.result === 'not found' };
      } catch (err) {
        console.warn(`[CloudinaryService] Cloudinary delete warning: ${err.message}`);
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  }
}

export default CloudinaryService;
