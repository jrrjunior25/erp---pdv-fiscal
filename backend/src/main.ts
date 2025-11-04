import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || 'https://seu-dominio.com'
        : ['http://localhost:5173', 'http://localhost:3000'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    },
  });

  // Add Global Exception Filter for secure error handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // Use a global pipe to validate incoming request data
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties that do not have any decorators
    forbidNonWhitelisted: false, // Allow extra fields (will be stripped by whitelist)
    transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
  }));

  // Add a global prefix to all routes except root
  app.setGlobalPrefix('api', {
    exclude: ['/', 'health'],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Backend is running on: http://localhost:${port}`);
}

bootstrap();
