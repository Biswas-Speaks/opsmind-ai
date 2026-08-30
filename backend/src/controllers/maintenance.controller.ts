import { Request, Response, NextFunction } from 'express';
import { Maintenance } from '../models/Maintenance';
import { Asset } from '../models/Asset';
import { AppError } from '../utils/errors';

export const getMaintenances = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const maintenances = await Maintenance.find({})
      .populate('asset assignedEngineer vendor')
      .sort({ scheduledDate: 1 });

    res.status(200).json({
      success: true,
      data: maintenances,
    });
  } catch (error) {
    next(error);
  }
};

export const createMaintenance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { assetId, maintenanceType, scheduledDate, assignedEngineerId, vendorId, notes, cost } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return next(new AppError('Asset not found.', 404, 'ASSET_NOT_FOUND'));
    }

    const maintenance = await Maintenance.create({
      asset: assetId,
      maintenanceType,
      scheduledDate: new Date(scheduledDate),
      assignedEngineer: assignedEngineerId || undefined,
      vendor: vendorId || undefined,
      status: 'Scheduled',
      notes,
      cost,
    });

    const populated = await Maintenance.findById(maintenance._id).populate('asset assignedEngineer vendor');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};
