import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { protect, restrictToRole } from '../middleware/auth';

const router = Router();

router.get('/', protect, restrictToRole('Super Admin', 'Auditor'), getAuditLogs);

export default router;
