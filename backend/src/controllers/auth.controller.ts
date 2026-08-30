import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { AppError } from '../utils/errors';

const signAccessToken = (userId: string): string => {
  return jwt.sign(
    { id: userId, jti: Math.random().toString(36).substring(2, 15) },
    process.env.JWT_SECRET || 'super_secret_jwt_access_token_key_12345',
    { expiresIn: '15m' }
  );
};

const signRefreshToken = (userId: string): string => {
  return jwt.sign(
    { id: userId, jti: Math.random().toString(36).substring(2, 15) },
    process.env.JWT_REFRESH_SECRET || 'super_secret_jwt_refresh_token_key_67890',
    { expiresIn: '7d' }
  );
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, password, roleName, departmentId, locationId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return next(new AppError('Username or email already exists.', 400, 'REGISTRATION_FAILED'));
    }

    // Find the corresponding role
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return next(new AppError(`Role '${roleName}' does not exist.`, 400, 'REGISTRATION_FAILED'));
    }

    // Create user
    const newUser = await User.create({
      username,
      email,
      passwordHash: password, // Will be hashed by pre-save middleware
      role: role._id,
      department: departmentId || undefined,
      location: locationId || undefined,
    });

    const populatedUser = await User.findById(newUser._id).populate('role department location');

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: populatedUser?._id,
          username: populatedUser?.username,
          email: populatedUser?.email,
          role: populatedUser?.role,
          department: populatedUser?.department,
          location: populatedUser?.location,
          status: populatedUser?.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).populate('role department location');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    if (user.status !== 'Active') {
      return next(new AppError(`Your account is currently ${user.status.toLowerCase()}.`, 403, 'FORBIDDEN'));
    }

    // Generate tokens
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    // Save refresh token to user
    user.refreshTokens.push(refreshToken);
    // Limit to max 5 active refresh tokens to prevent bloat
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          department: user.department,
          location: user.location,
          status: user.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required.', 400, 'BAD_REQUEST'));
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'super_secret_jwt_refresh_token_key_67890');
    } catch (err) {
      return next(new AppError('Invalid or expired refresh token.', 401, 'UNAUTHORIZED'));
    }

    // Find user and check if token is registered
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return next(new AppError('Invalid refresh token or user session expired.', 401, 'UNAUTHORIZED'));
    }

    // Filter out old refresh token (token rotation)
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);

    // Generate new tokens
    const newAccessToken = signAccessToken(user.id);
    const newRefreshToken = signRefreshToken(user.id);

    // Add new refresh token
    user.refreshTokens.push(newRefreshToken);
    user.markModified('refreshTokens');
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Find user and remove the refresh token
      const decoded: any = jwt.decode(refreshToken);
      if (decoded && decoded.id) {
        await User.findByIdAndUpdate(decoded.id, {
          $pull: { refreshTokens: refreshToken },
        });
      }
    }

    res.status(200).json({
      success: true,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401, 'UNAUTHORIZED'));
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          username: req.user.username,
          email: req.user.email,
          role: req.user.role,
          department: req.user.department,
          location: req.user.location,
          status: req.user.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = req.user;

    if (!user) {
      return next(new AppError('Not authenticated.', 401, 'UNAUTHORIZED'));
    }

    // Double check password
    const dbUser = await User.findById(user._id);
    if (!dbUser || !(await dbUser.comparePassword(oldPassword))) {
      return next(new AppError('Incorrect old password.', 400, 'PASSWORD_CHANGE_FAILED'));
    }

    // Set new password
    dbUser.passwordHash = newPassword; // Pre-save hooks will hash it
    // Clear all refresh tokens to force re-login on all devices
    dbUser.refreshTokens = [];
    await dbUser.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. Please log in again on all devices.',
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find({}).populate('role').sort({ username: 1 });
    res.status(200).json({
      success: true,
      data: users.map(u => ({
        id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
      })),
    });
  } catch (error) {
    next(error);
  }
};
