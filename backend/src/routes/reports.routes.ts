import { Router } from 'express';
import { getReports } from '../controllers/reports.controller';
import { protect, restrictToRole } from '../middleware/auth';

const router = Router();

router.get('/', protect, restrictToRole('Super Admin', 'IT Manager', 'Auditor'), getReports);

export default router;
