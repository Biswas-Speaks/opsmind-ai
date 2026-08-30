import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { IRole } from '../models/Role';
import { AppError } from '../utils/errors';

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401, 'UNAUTHORIZED'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_access_token_key_12345') as DecodedToken;

    // Check if user still exists
    const currentUser = await User.findById(decoded.id).populate('role department location');
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401, 'UNAUTHORIZED'));
    }

    // Check user status
    if (currentUser.status !== 'Active') {
      return next(new AppError(`Your account is currently ${currentUser.status.toLowerCase()}.`, 403, 'FORBIDDEN'));
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid token. Please log in again.', 401, 'UNAUTHORIZED'));
  }
};

export const restrictToRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    const userRole = req.user.role as IRole;
    if (!allowedRoles.includes(userRole.name)) {
      return next(new AppError('You do not have permission to perform this action.', 403, 'FORBIDDEN'));
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    const userRole = req.user.role as IRole;
    
    // Super Admin has bypass for all permissions
    if (userRole.name === 'Super Admin') {
      return next();
    }

    if (!userRole.permissions.includes(permission)) {
      return next(new AppError('You do not have permission to perform this action.', 403, 'FORBIDDEN'));
    }

    next();
  };
};
