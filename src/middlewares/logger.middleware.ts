import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger: winston.Logger;
  constructor(private loggerService: LoggerService) {
    this.logger = loggerService.getChildLogger('LoggerMiddleware');
  }
  use(req: Request, res: Response, next: NextFunction): void {
    const ipAddress = req.ip;
    const url = req.originalUrl;
    if (url !== '/healthz') this.logger.info(`Received request from IP ${ipAddress} to URL ${url}`);
    next();
  }
}
