import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// ── Supabase Storage client ──────────────────────────────────────────────────
const supabaseUrl  = process.env.SUPABASE_URL!;
const supabaseKey  = process.env.SUPABASE_SERVICE_KEY!;
const BUCKET       = 'wedonate-uploads';

// Use memory storage — we stream directly to Supabase, no local disk needed
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

    // If Supabase credentials are configured, upload to Supabase Storage
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const ext      = path.extname(req.file.originalname).toLowerCase();
      const filename = `${uuidv4()}${ext}`;
      const filePath = `images/${filename}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error.message);
        return next(new Error('File upload to storage failed: ' + error.message));
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

      res.json({ success: true, data: { imageUrl: publicUrlData.publicUrl, filename } });
      return;
    }

    // Fallback: local disk (dev only — not suitable for production)
    res.status(500).json({ success: false, message: 'Storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.' });
  } catch (error) {
    next(error);
  }
});

export default router;
