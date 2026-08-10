import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { AccessLogMiddleware } from './middleware/access-log.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('在线视频 API')
    .setDescription('在线视频 backend API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors();

  const accessLog = new AccessLogMiddleware();
  app.use((req: Request, res: Response, next: NextFunction) =>
    accessLog.use(req, res, next),
  );

  await app.listen(3000);
  console.log('Server running on http://localhost:3000');
}

bootstrap();
