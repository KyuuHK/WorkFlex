import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect((res.body as { status: string }).status).toBe('ok');
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@workflex.app',
        name: 'Test User',
        password: 'SuperSecret123',
      })
      .expect((res) => {
        if (res.status !== 201 && res.status !== 409) {
          throw new Error(`Unexpected status ${res.status}`);
        }
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
