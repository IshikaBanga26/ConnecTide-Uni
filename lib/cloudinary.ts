import { v2 as cloudinary } from "cloudinary"

// Configure once — Cloudinary SDK reads these env vars automatically
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

// Upload a file buffer to Cloudinary and return the secure URL
// We use a Promise wrapper because Cloudinary's upload_stream is callback-based
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string
    resourceType?: "raw" | "image" | "video" | "auto"
    filename?: string
  } = {}
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? "connectide/resources",
        resource_type: options.resourceType ?? "raw", // "raw" for PDFs/PPTs
        use_filename: true,
        unique_filename: true,
        public_id: options.filename,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"))
        } else {
          resolve({ url: result.secure_url, publicId: result.public_id })
        }
      }
    )
    uploadStream.end(buffer)
  })
}
