import { Router, Request, Response, NextFunction } from 'express';
import { KnowledgeDocument } from '../models/Knowledge';
import { RAGService } from '../services/rag.service';
import { protect, restrictToRole } from '../middleware/auth';
import { AppError } from '../utils/errors';

const router = Router();

// Search knowledge base semantically
router.get('/search', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return next(new AppError('Search query parameter q is required.', 400, 'BAD_REQUEST'));
    }

    const results = await RAGService.searchKnowledge(query, 5);
    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

// Retrieve all knowledge articles
router.get('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await KnowledgeDocument.find({}).populate('createdBy', 'username').sort({ title: 1 });
    res.status(200).json({
      success: true,
      data: docs,
    });
  } catch (error) {
    next(error);
  }
});

// Ingest new knowledge article
router.post('/', protect, restrictToRole('Super Admin', 'IT Manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, category, tags, content } = req.body;

    if (!title || !content) {
      return next(new AppError('Title and content are required.', 400, 'BAD_REQUEST'));
    }

    const doc = await KnowledgeDocument.create({
      title,
      category,
      tags: tags || [],
      createdBy: req.user?._id,
    });

    // Run background ingestion to chunk and embed
    await RAGService.ingestDocument(doc._id as string, title, content);

    res.status(201).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
