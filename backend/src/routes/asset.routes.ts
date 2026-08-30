import { Router } from 'express';
import {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  assignAsset,
  returnAsset,
  getAssetHistory,
} from '../controllers/asset.controller';
import { protect, requirePermission, restrictToRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  createAssetSchema,
  updateAssetSchema,
  assignAssetSchema,
  returnAssetSchema,
} from '../validators/asset';

const router = Router();

router.get('/', getAssets);
router.post('/', protect, requirePermission('assets:create'), validateRequest(createAssetSchema), createAsset);

router.get('/:id', getAsset);
router.put('/:id', protect, requirePermission('assets:update'), validateRequest(updateAssetSchema), updateAsset);
router.delete('/:id', protect, restrictToRole('Super Admin'), deleteAsset);

router.post('/:id/assign', protect, requirePermission('assets:update'), validateRequest(assignAssetSchema), assignAsset);
router.post('/:id/return', protect, requirePermission('assets:update'), validateRequest(returnAssetSchema), returnAsset);
router.get('/:id/history', getAssetHistory);

export default router;
