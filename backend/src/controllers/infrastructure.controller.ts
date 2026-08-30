import { Request, Response, NextFunction } from 'express';
import { InfrastructureDevice } from '../models/InfrastructureDevice';
import { startInfrastructureSimulator, stopInfrastructureSimulator } from '../services/simulator.service';
import { AppError } from '../utils/errors';

let simulatorActive = false;

export const getDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const devices = await InfrastructureDevice.find({}).populate('location').sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: {
        devices,
        simulatorActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, category, ipAddress, macAddress, locationId } = req.body;

    const dup = await InfrastructureDevice.findOne({ ipAddress });
    if (dup) {
      return next(new AppError('A device with this IP address already exists.', 400, 'BAD_REQUEST'));
    }

    const device = await InfrastructureDevice.create({
      name,
      category,
      ipAddress,
      macAddress,
      location: locationId,
      status: 'Online',
    });

    const populated = await InfrastructureDevice.findById(device._id).populate('location');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleSimulator = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { active } = req.body;
    
    if (active) {
      startInfrastructureSimulator();
      simulatorActive = true;
    } else {
      stopInfrastructureSimulator();
      simulatorActive = false;
    }

    res.status(200).json({
      success: true,
      data: { simulatorActive },
    });
  } catch (error) {
    next(error);
  }
};
