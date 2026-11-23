import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('Limite de tentativas em /auth', () => {
  let app: INestApplication;
  const authService = {
    login: jest.fn().mockResolvedValue({ accessToken: 'token' }),
    register: jest.fn().mockResolvedValue({ id: 'user-1' }),
    me: jest.fn(),
  };
  const credentials = { email: 'user@test.com', password: 'senha-123' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('permite 5 tentativas de login por minuto', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credentials);
      expect(res.status).not.toBe(429);
    }
    expect(authService.login).toHaveBeenCalledTimes(5);
  });

  it('responde 429 na 6ª tentativa de login e não chama o serviço', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer()).post('/auth/login').send(credentials);
    }

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials);

    expect(res.status).toBe(429);
    expect(authService.login).toHaveBeenCalledTimes(5);
  });
});
