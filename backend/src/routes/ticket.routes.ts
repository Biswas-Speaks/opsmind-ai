import { Router } from 'express';
import {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  resolveTicket,
  addComment,
  addWorklog,
  getTroubleshootingSteps,
} from '../controllers/ticket.controller';
import { protect } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createTicketSchema, updateTicketSchema, commentSchema, worklogSchema } from '../validators/ticket';

const router = Router();

router.get('/', protect, getTickets);
router.post('/', protect, validateRequest(createTicketSchema), createTicket);

router.get('/:id', protect, getTicket);
router.put('/:id', protect, validateRequest(updateTicketSchema), updateTicket);
router.post('/:id/resolve', protect, resolveTicket);

router.post('/:id/comments', protect, validateRequest(commentSchema), addComment);
router.post('/:id/worklogs', protect, validateRequest(worklogSchema), addWorklog);
router.get('/:id/troubleshoot', protect, getTroubleshootingSteps);

export default router;
