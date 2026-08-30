import { Request, Response, NextFunction } from 'express';
import { Department } from '../models/Department';
import { Location } from '../models/Location';
import { Vendor } from '../models/Vendor';
import { AppError } from '../utils/errors';

// Departments
export const getDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const departments = await Department.find({}).sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, code, description } = req.body;
    
    const dup = await Department.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
    if (dup) {
      return next(new AppError('Department name or code already exists.', 400, 'METADATA_CREATE_FAILED'));
    }

    const newDept = await Department.create({ name, code, description });
    res.status(201).json({
      success: true,
      data: newDept,
    });
  } catch (error) {
    next(error);
  }
};

// Locations
export const getLocations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locations = await Location.find({}).sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};

export const createLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, code, address, type } = req.body;

    const dup = await Location.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
    if (dup) {
      return next(new AppError('Location name or code already exists.', 400, 'METADATA_CREATE_FAILED'));
    }

    const newLoc = await Location.create({ name, code, address, type });
    res.status(201).json({
      success: true,
      data: newLoc,
    });
  } catch (error) {
    next(error);
  }
};

// Vendors
export const getVendors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendors = await Vendor.find({}).sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    next(error);
  }
};

export const createVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, contactPerson, email, phone, address, services, rating, notes } = req.body;

    const dup = await Vendor.findOne({ name });
    if (dup) {
      return next(new AppError('Vendor name already exists.', 400, 'METADATA_CREATE_FAILED'));
    }

    const newVendor = await Vendor.create({
      name,
      contactPerson,
      email,
      phone,
      address,
      services,
      rating,
      notes,
    });

    res.status(201).json({
      success: true,
      data: newVendor,
    });
  } catch (error) {
    next(error);
  }
};
