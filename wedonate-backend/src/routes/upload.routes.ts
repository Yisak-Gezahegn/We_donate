import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// ── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Memory storage — buffer streamed to Cloudinary, no local disk needed
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image and PDF files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const router = Router();

router.post('/', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    // Upload buffer to Cloudinary via stream
    const uploadToCloudinary = (): Promise<string> =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'wedonate', resource_type: 'auto' },
          (error, result) => {
            if (error || !result) return reject(error || new Error('Upload failed'));
            resolve(result.secure_url);
          }
        );
        Readable.from(req.file!.buffer).pipe(stream);
      });

    const imageUrl = await uploadToCloudinary();
    res.json({ success: true, data: { imageUrl, filename: path.basename(imageUrl) } });

  } catch (error: any) {
    console.error('Cloudinary upload error:', error.message);
    next(new Error('File upload failed: ' + error.message));
  }
});

export default router;
