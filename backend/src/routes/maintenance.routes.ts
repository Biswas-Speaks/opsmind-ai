import { Router } from 'express';
import { getMaintenances, createMaintenance } from '../controllers/maintenance.controller';
import { protect, restrictToRole } from '../middleware/auth';

const router = Router();

router.get('/', protect, getMaintenances);
router.post('/', protect, restrictToRole('Super Admin', 'IT Manager'), createMaintenance);

export default router;
