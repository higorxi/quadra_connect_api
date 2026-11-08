import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cabeçalhos HTTP de segurança (X-Content-Type-Options, HSTS, etc.)
  app.use(helmet());
  
  app.enableCors({
    origin: ['http://localhost:5173', ], // 'quadra-connect-admin.vercel.app'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.BACKEND_PORT ?? 3000);
  console.log(`Server is running on port ${process.env.BACKEND_PORT ?? 3000}`);
}
void bootstrap();
