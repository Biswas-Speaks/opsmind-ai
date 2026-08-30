import { z } from 'zod';
import { AssetCategories, AssetStatuses, AssetConditions } from '../models/Asset';

export const createAssetSchema = z.object({
  body: z.object({
    assetTag: z.string().optional(), // Auto-generated if omitted
    serialNumber: z.string().min(1, 'Serial number is required'),
    category: z.enum(AssetCategories, {
      required_error: 'Valid asset category is required',
    }),
    manufacturer: z.string().min(1, 'Manufacturer is required'),
    model: z.string().min(1, 'Model is required'),
    description: z.string().optional(),
    purchaseDate: z.string().datetime({ precision: 3 }).or(z.string().date()).optional().nullable(),
    purchaseCost: z.number().min(0).optional().nullable(),
    vendorId: z.string().optional().nullable(),
    warrantyStart: z.string().datetime({ precision: 3 }).or(z.string().date()).optional().nullable(),
    warrantyEnd: z.string().datetime({ precision: 3 }).or(z.string().date()).optional().nullable(),
    amcStart: z.string().datetime({ precision: 3 }).or(z.string().date()).optional().nullable(),
    amcEnd: z.string().datetime({ precision: 3 }).or(z.string().date()).optional().nullable(),
    locationId: z.string().optional().nullable(),
    departmentId: z.string().optional().nullable(),
    ipAddress: z.string().optional().nullable(),
    macAddress: z.string().optional().nullable(),
    hostname: z.string().optional().nullable(),
    notes: z.string().optional(),
    parentAssetId: z.string().optional().nullable(),
  }),
});

export const updateAssetSchema = z.object({
  body: z.object({
    serialNumber: z.string().optional(),
    category: z.enum(AssetCategories).optional(),
    manufacturer: z.string().optional(),
    model: z.string().optional(),
    description: z.string().optional(),
    purchaseDate: z.string().datetime({ precision: 3 }).or(z.string().date()).optional().nullable(),
    purchaseCost: z.number().min(0).optional().nullable(),
    vendorId: z.string().optional().nullable(),
    warrantyStart: z.string().datetime({ precision: 3 }).or(z.string().date()).optional().nullable(),
    warrantyEnd: z.string().datetime({ precision: 3 }).or(z.string().date()).optional().nullable(),
    amcStart: z.string().datetime({ precision: 3 }).or(z.string().date()).optional().nullable(),
    amcEnd: z.string().datetime({ precision: 3 }).or(z.string().date()).optional().nullable(),
    locationId: z.string().optional().nullable(),
    departmentId: z.string().optional().nullable(),
    status: z.enum(AssetStatuses).optional(),
    condition: z.enum(AssetConditions).optional(),
    ipAddress: z.string().optional().nullable(),
    macAddress: z.string().optional().nullable(),
    hostname: z.string().optional().nullable(),
    notes: z.string().optional(),
    parentAssetId: z.string().optional().nullable(),
  }),
});

export const assignAssetSchema = z.object({
  body: z.object({
    assigneeId: z.string().min(1, 'Assignee ID is required'),
    conditionOnAssignment: z.enum(AssetConditions).optional(),
    notes: z.string().optional(),
  }),
});

export const returnAssetSchema = z.object({
  body: z.object({
    conditionOnReturn: z.enum(AssetConditions).optional(),
    notes: z.string().optional(),
  }),
});
