import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AccessLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AccessLog');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const startTime = Date.now();

    res.on('finish', () => {
      const statusCode = res.statusCode;
      const duration = Date.now() - startTime;
      const ip = req.ip ?? req.socket.remoteAddress ?? '-';
      this.logger.log(`${method} ${originalUrl} ${statusCode} ${duration}ms - ${ip}`);
    });

    next();
  }
}