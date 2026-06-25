import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
export function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || "digital-life-lessons",
      resource_type: options.resource_type || "image",
      transformation: options.transformation || [
        { width: 1200, height: 630, crop: "fill", quality: "auto:good" },
      ],
      ...options,
    };

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      })
      .end(buffer);
  });
}

/**
 * Delete an asset from Cloudinary by public_id
 * @param {string} publicId
 */
export async function deleteAsset(publicId) {
  return cloudinary.uploader.destroy(publicId);
}
