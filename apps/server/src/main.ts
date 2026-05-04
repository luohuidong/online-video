import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AccessLogMiddleware } from './middleware/access-log.middleware';
import type { Request, Response, NextFunction } from 'express';

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
  app.use((req: Request, res: Response, next: NextFunction) => accessLog.use(req, res, next));

  await app.listen(3000);
  console.log('Server running on http://localhost:3000');
}

bootstrap();