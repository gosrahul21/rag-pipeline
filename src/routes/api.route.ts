import { Router } from 'express';
import { getHealthStatus, retrieveChunksHandler } from '../controllers/api.controller';
import { uploadDocument } from '../controllers/document.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

// Health check endpoint
router.get('/health', getHealthStatus);

// Chunk retrieval endpoint
router.post('/retrieve', retrieveChunksHandler);

// Document upload endpoint
router.post('/upload', uploadMiddleware.single('document'), uploadDocument);

export default router;
