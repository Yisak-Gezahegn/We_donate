import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import authRoutes           from './routes/auth.routes';
import userRoutes           from './routes/user.routes';
import donationRoutes       from './routes/donation.routes';
import supportRequestRoutes from './routes/supportRequest.routes';
import campaignRoutes       from './routes/campaign.routes';
import adminRoutes          from './routes/admin.routes';
import paymentRoutes        from './routes/payment.routes';
import notificationRoutes   from './routes/notification.routes';
import galleryRoutes        from './routes/gallery.routes';
import uploadRoutes         from './routes/upload.routes';
import testimonialRoutes    from './routes/testimonial.routes';
import heroImageRoutes      from './routes/heroImage.routes';
import campaignUpdateRoutes from './routes/campaignUpdate.routes';
import newsRoutes           from './routes/news.routes';
import faqRoutes            from './routes/faq.routes';
import eventRoutes          from './routes/event.routes';
import settingRoutes        from './routes/setting.routes';
import messageRoutes        from './routes/message.routes';
import { errorHandler }     from './middleware/errorHandler';

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300,
  message: { error: 'Too many requests, please try again later.' } }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/images', express.static(path.join(__dirname, '../uploads/images')));

app.use('/api/auth',            authRoutes);
app.use('/api/users',           userRoutes);
app.use('/api/donations',       donationRoutes);
app.use('/api/support-requests',supportRequestRoutes);
app.use('/api/campaigns',       campaignRoutes);
app.use('/api/admin',           adminRoutes);
app.use('/api/payments',        paymentRoutes);
app.use('/api/notifications',   notificationRoutes);
app.use('/api/gallery',         galleryRoutes);
app.use('/api/upload',          uploadRoutes);
app.use('/api/testimonials',    testimonialRoutes);
app.use('/api/hero-images',     heroImageRoutes);
app.use('/api/campaign-updates', campaignUpdateRoutes);
app.use('/api/news',            newsRoutes);
app.use('/api/faqs',            faqRoutes);
app.use('/api/events',          eventRoutes);
app.use('/api/settings',        settingRoutes);
app.use('/api/messages',        messageRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', message: 'We Donate API running', timestamp: new Date().toISOString() }));

app.use(errorHandler);

app.listen(PORT, () => console.log(`🚀 WeDonate API → http://localhost:${PORT}`));

export default app;
