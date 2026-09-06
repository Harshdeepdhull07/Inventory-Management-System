import { Request, Response } from 'express';
import { AlertService } from '../services/alertService.js';

export const getAlerts = async (req: Request, res: Response): Promise<void> => {
  const includeDismissed = req.query.includeDismissed === 'true';
  const alerts = await AlertService.getAlerts(includeDismissed);

  res.status(200).json({
    success: true,
    data: alerts,
  });
};

export const dismissAlert = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  await AlertService.dismissAlert(id, req.user!.email);

  res.status(200).json({
    success: true,
    message: 'Low stock alert dismissed successfully.',
  });
};
