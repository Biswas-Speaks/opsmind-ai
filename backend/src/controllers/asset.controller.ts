import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Asset, AssetStatuses } from '../models/Asset';
import { AssetHistory } from '../models/AssetHistory';
import { AssetAssignment } from '../models/AssetAssignment';
import { User } from '../models/User';
import { AppError } from '../utils/errors';

// Helper to check if string is a valid MongoDB ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Sequential Asset Tag Generation helper
const generateAssetTag = async (): Promise<string> => {
  let nextTagNum = 1;
  const lastAsset = await Asset.findOne({ assetTag: /^OPS-ASSET-/ }).sort({ assetTag: -1 });
  if (lastAsset) {
    const match = lastAsset.assetTag.match(/OPS-ASSET-(\d+)/);
    if (match && match[1]) {
      nextTagNum = parseInt(match[1], 10) + 1;
    }
  }
  return `OPS-ASSET-${String(nextTagNum).padStart(6, '0')}`;
};

export const getAssets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Apply filters
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.locationId && isValidObjectId(req.query.locationId as string)) {
      filter.location = req.query.locationId;
    }
    if (req.query.departmentId && isValidObjectId(req.query.departmentId as string)) {
      filter.department = req.query.departmentId;
    }

    // Apply search
    if (req.query.search) {
      const searchStr = req.query.search as string;
      filter.$or = [
        { assetTag: { $regex: searchStr, $options: 'i' } },
        { serialNumber: { $regex: searchStr, $options: 'i' } },
        { model: { $regex: searchStr, $options: 'i' } },
        { manufacturer: { $regex: searchStr, $options: 'i' } },
      ];
    }

    const total = await Asset.countDocuments(filter);
    const assets = await Asset.find(filter)
      .populate('location department assignedUser vendor')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        assets,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    let asset;

    if (isValidObjectId(id)) {
      asset = await Asset.findById(id).populate('location department assignedUser vendor parentAsset');
    } else {
      // Allow fetching by assetTag (e.g. from QR scanners)
      asset = await Asset.findOne({ assetTag: id.toUpperCase() }).populate('location department assignedUser vendor parentAsset');
    }

    if (!asset) {
      return next(new AppError('Asset not found.', 404, 'ASSET_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

export const createAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      serialNumber,
      category,
      manufacturer,
      model,
      description,
      purchaseDate,
      purchaseCost,
      vendorId,
      warrantyStart,
      warrantyEnd,
      amcStart,
      amcEnd,
      locationId,
      departmentId,
      ipAddress,
      macAddress,
      hostname,
      notes,
      parentAssetId,
    } = req.body;

    // Check duplicate serial number
    const dupSerial = await Asset.findOne({ serialNumber });
    if (dupSerial) {
      return next(new AppError('An asset with this serial number already exists.', 400, 'ASSET_CREATE_FAILED'));
    }

    // Auto generate tag if not supplied
    const tag = req.body.assetTag || (await generateAssetTag());

    const newAsset = await Asset.create({
      assetTag: tag,
      serialNumber,
      category,
      manufacturer,
      model,
      description,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      purchaseCost,
      vendor: vendorId || undefined,
      warrantyStart: warrantyStart ? new Date(warrantyStart) : undefined,
      warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : undefined,
      amcStart: amcStart ? new Date(amcStart) : undefined,
      amcEnd: amcEnd ? new Date(amcEnd) : undefined,
      location: locationId || undefined,
      department: departmentId || undefined,
      ipAddress: ipAddress || undefined,
      macAddress: macAddress || undefined,
      hostname: hostname || undefined,
      notes,
      parentAsset: parentAssetId || undefined,
    });

    // Log History
    await AssetHistory.create({
      asset: newAsset._id,
      action: 'Asset Registered',
      oldValue: '',
      newValue: 'Available',
      operator: req.user?._id,
    });

    const populated = await Asset.findById(newAsset._id).populate('location department vendor');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const asset = await Asset.findById(id);
    if (!asset) {
      return next(new AppError('Asset not found.', 404, 'ASSET_NOT_FOUND'));
    }

    // Mapping changes to history
    const historyLogs = [];
    const fieldsToTrack = ['status', 'condition', 'location', 'department', 'assignedUser'];

    for (const field of fieldsToTrack) {
      if (updates[field] !== undefined && updates[field] !== null && String(updates[field]) !== String((asset as any)[field])) {
        let oldVal = String((asset as any)[field] || 'None');
        let newVal = String(updates[field]);

        historyLogs.push({
          asset: asset._id,
          action: `Update ${field.charAt(0).toUpperCase() + field.slice(1)}`,
          oldValue: oldVal,
          newValue: newVal,
          operator: req.user?._id,
        });
      }
    }

    // Handle reference renaming keys
    if (updates.vendorId !== undefined) updates.vendor = updates.vendorId || undefined;
    if (updates.locationId !== undefined) updates.location = updates.locationId || undefined;
    if (updates.departmentId !== undefined) updates.department = updates.departmentId || undefined;
    if (updates.parentAssetId !== undefined) updates.parentAsset = updates.parentAssetId || undefined;

    // Apply updates
    Object.assign(asset, updates);
    await asset.save();

    // Insert history logs
    if (historyLogs.length > 0) {
      await AssetHistory.insertMany(historyLogs);
    }

    const populated = await Asset.findById(asset._id).populate('location department assignedUser vendor');

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const asset = await Asset.findByIdAndDelete(id);

    if (!asset) {
      return next(new AppError('Asset not found.', 404, 'ASSET_NOT_FOUND'));
    }

    // Clean historical associations
    await AssetHistory.deleteMany({ asset: id });
    await AssetAssignment.deleteMany({ asset: id });

    res.status(200).json({
      success: true,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const assignAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { assigneeId, conditionOnAssignment, notes } = req.body;

    const asset = await Asset.findById(id);
    if (!asset) {
      return next(new AppError('Asset not found.', 404, 'ASSET_NOT_FOUND'));
    }

    if (asset.status === 'Assigned' || asset.status === 'In Use') {
      return next(new AppError('Asset is already checked out/assigned.', 400, 'ASSET_ASSIGNMENT_FAILED'));
    }

    const assignee = await User.findById(assigneeId);
    if (!assignee) {
      return next(new AppError('Assignee user not found.', 404, 'USER_NOT_FOUND'));
    }

    const oldStatus = asset.status;
    asset.status = 'Assigned';
    asset.assignedUser = assignee._id as any;
    if (conditionOnAssignment) asset.condition = conditionOnAssignment;
    await asset.save();

    // Close any previous active assignments just in case
    await AssetAssignment.updateMany({ asset: asset._id, status: 'Active' }, { status: 'Returned', returnedAt: new Date() });

    // Create checkout record
    const assignment = await AssetAssignment.create({
      asset: asset._id,
      assignee: assignee._id,
      assignedBy: req.user?._id,
      conditionOnAssignment: conditionOnAssignment || asset.condition,
      status: 'Active',
    });

    // Log History
    await AssetHistory.create({
      asset: asset._id,
      action: 'Asset Assigned',
      oldValue: oldStatus,
      newValue: `Assigned to ${assignee.username}${notes ? ' - ' + notes : ''}`,
      operator: req.user?._id,
    });

    res.status(200).json({
      success: true,
      data: {
        asset,
        assignment,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const returnAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { conditionOnReturn, notes } = req.body;

    const asset = await Asset.findById(id).populate('assignedUser');
    if (!asset) {
      return next(new AppError('Asset not found.', 404, 'ASSET_NOT_FOUND'));
    }

    if (asset.status !== 'Assigned' && asset.status !== 'In Use') {
      return next(new AppError('Asset is not currently assigned.', 400, 'ASSET_RETURN_FAILED'));
    }

    const oldStatus = asset.status;
    const assigneeUser = asset.assignedUser as any;
    const assigneeName = assigneeUser ? assigneeUser.username : 'Unknown';

    asset.status = 'Available';
    asset.assignedUser = undefined;
    if (conditionOnReturn) asset.condition = conditionOnReturn;
    await asset.save();

    // Update active assignment
    const activeAssignment = await AssetAssignment.findOneAndUpdate(
      { asset: asset._id, status: 'Active' },
      {
        status: 'Returned',
        returnedAt: new Date(),
        conditionOnReturn: conditionOnReturn || asset.condition,
      },
      { new: true }
    );

    // Log History
    await AssetHistory.create({
      asset: asset._id,
      action: 'Asset Returned',
      oldValue: oldStatus,
      newValue: `Returned by ${assigneeName}${notes ? ' - ' + notes : ''}`,
      operator: req.user?._id,
    });

    res.status(200).json({
      success: true,
      data: {
        asset,
        assignment: activeAssignment,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAssetHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    let assetId = id;

    if (!isValidObjectId(id)) {
      // Lookup asset by tag
      const asset = await Asset.findOne({ assetTag: id.toUpperCase() });
      if (!asset) {
        return next(new AppError('Asset not found.', 404, 'ASSET_NOT_FOUND'));
      }
      assetId = asset.id;
    }

    const history = await AssetHistory.find({ asset: assetId })
      .populate('operator', 'username email')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};
