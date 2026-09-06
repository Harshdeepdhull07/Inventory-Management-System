import { Request, Response, NextFunction } from 'express';
import { Role } from '../types/enums.js';

export const requireManager = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  if (req.user.role !== Role.MANAGER) {
    res.status(403).json({
      success: false,
      message: 'Forbidden: This action requires Manager privileges.',
    });
    return;
  }

  next();
};

export const requireLocationAccess = (locationIdExtractor: (req: Request) => string | string[] | undefined) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    if (req.user.role === Role.MANAGER) {
      return next();
    }

    const locationIdsToCheck = locationIdExtractor(req);
    if (!locationIdsToCheck) {
      return next();
    }

    const ids = Array.isArray(locationIdsToCheck) ? locationIdsToCheck : [locationIdsToCheck];
    
    const hasAccess = ids.every((id) => req.user!.assignedLocationIds.includes(id));

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission for the specified location(s).',
      });
      return;
    }

    next();
  };
};
