import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as net from 'net';
import * as path from 'path';
import * as fs from 'fs/promises';

const logger = new Logger('NestApplication');

// Portni band bo'lgan yoki yo'qligini tekshirish
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

// Bosh port topish (band bo'lsa, keyingisini sinash)
async function findAvailablePort(startPort: number = 3000): Promise<number> {
  let port = startPort;
  const maxAttempts = 5;

  for (let i = 0; i < maxAttempts; i++) {
    const inUse = await isPortInUse(port);
    if (!inUse) {
      return port;
    }
    logger.warn(`Port ${port} band, ${port + 1000} sinashyapman...`);
    port = port + 1000; // Keyingi port
  }

  throw new Error(
    `${startPort} dan ${port} gacha barcha portlar band. Manual ochish kerak.`,
  );
}

async function bootstrap() {
  // Create uploads directories if they don't exist
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'categories');
    await fs.mkdir(uploadsDir, { recursive: true });
    logger.debug(`✓ Uploads directory ready: ${uploadsDir}`);
  } catch (error) {
    logger.error('Uploads directory creation failed:', error);
  }

  // Environment orqali port (default 3000)
  const defaultPort = parseInt(process.env.PORT ?? '3000', 10);

  // Portni topish
  const port = await findAvailablePort(defaultPort);

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:3000',
      'http://localhost:4000',
      'http://localhost:5000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve static files from uploads directory
  const express = await import('express');
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const messages: Record<string, string> = {};

        errors.forEach((error) => {
          if (error.property) {
            // Property xatolari (ruxsat berilmagan fieldlar)
            if (error.constraints && error.constraints['isUuid']) {
              messages[error.property] =
                `${error.property} togri UUID formatda bo'lishi kerak`;
            } else if (error.constraints && error.constraints['isString']) {
              messages[error.property] =
                `${error.property} matn bo'lishi kerak`;
            } else if (error.constraints && error.constraints['minLength']) {
              messages[error.property] =
                `${error.property} "${error.constraints['minLength']}" ta belgidan kam bo'lmasligi kerak`;
            } else if (error.constraints && error.constraints['maxLength']) {
              messages[error.property] =
                `${error.property} "${error.constraints['maxLength']}" ta belgidan ortiq bo'lmasligi kerak`;
            } else if (error.constraints && error.constraints['isEmail']) {
              messages[error.property] =
                `${error.property} tog'ri email bo'lishi kerak`;
            } else if (error.constraints && error.constraints['isNotEmpty']) {
              messages[error.property] =
                `${error.property} bo'sh bo'lmasligi kerak`;
            } else if (
              (error.constraints && error.constraints['whitelistValidation']) ||
              error.property.includes('should_not_exist')
            ) {
              // DTO'da yo'q bo'lgan fieldlar
              messages[error.property] =
                `${error.property} kiritilmasligi kerak`;
            } else if (error.constraints) {
              // Boshqa xatolar
              messages[error.property] = Object.values(
                error.constraints,
              )[0] as string;
            }
          }
        });

        return new BadRequestException({
          statusCode: 400,
          message: 'Validatsiya xatosi',
          errors: messages,
        });
      },
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Balance API')
    .setDescription("Bo'lib to'lash boshqaruv tizimi API")
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`✅ Server ishlamoqda 🚀 http://localhost:${port}/api`);
  logger.log(`📚 Swagger API: http://localhost:${port}/api/docs`);
}

bootstrap().catch((error: unknown) => {
  console.error('Bootstrap error:', error);
  process.exit(1);
});
