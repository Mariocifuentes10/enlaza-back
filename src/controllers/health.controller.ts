import type { RequestHandler } from 'express';
import { healthService } from '../services/health.service.js';

export const healthController: RequestHandler = (_req, res) => {
  res.json(healthService());
};