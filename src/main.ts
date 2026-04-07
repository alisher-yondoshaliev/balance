import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as net from 'net';

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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
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
