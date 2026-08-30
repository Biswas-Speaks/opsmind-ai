import { Router } from 'express';
import { getDevices, createDevice, toggleSimulator } from '../controllers/infrastructure.controller';
import { protect, restrictToRole } from '../middleware/auth';

const router = Router();

router.get('/', protect, getDevices);
router.post('/', protect, restrictToRole('Super Admin'), createDevice);
router.post('/toggle-simulator', protect, restrictToRole('Super Admin'), toggleSimulator);

export default router;
