import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  getLocations,
  createLocation,
  getVendors,
  createVendor,
} from '../controllers/metadata.controller';
import { protect, restrictToRole } from '../middleware/auth';

const router = Router();

// Departments
router.get('/departments', getDepartments);
router.post('/departments', protect, restrictToRole('Super Admin'), createDepartment);

// Locations
router.get('/locations', getLocations);
router.post('/locations', protect, restrictToRole('Super Admin'), createLocation);

// Vendors
router.get('/vendors', getVendors);
router.post('/vendors', protect, restrictToRole('Super Admin', 'IT Manager'), createVendor);

export default router;
