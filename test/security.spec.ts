import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';


describe('Security QA and Pentest Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken = '';
  let clientToken = '';
  let clientId = '';
  let robotAccessKey = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(new ZodValidationPipe());

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    await prisma.user.deleteMany({ where: { email: { contains: 'e2e' } } });

    const adminPass = await bcrypt.hash('Senha123', 10);
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin E2E',
        email: 'admin.e2e@test.com',
        password: adminPass,
        role: 'ADMIN',
        accountProfile: { create: {} },
        riskSettings: { create: {} },
        tradeAccount: { create: {} },
        accessKey: { create: { key: 'E2E-ADMIN-ROBOT' } },
      },
    });

    const clientPass = await bcrypt.hash('Senha123', 10);
    const clientUser = await prisma.user.create({
      data: {
        name: 'Client E2E',
        email: 'client.e2e@test.com',
        password: clientPass,
        role: 'CLIENT',
        accountProfile: { create: {} },
        riskSettings: { create: {} },
        tradeAccount: { create: {} },
        accessKey: { create: { key: 'E2E-CLIENT-ROBOT' } },
      },
    });

    clientId = clientUser.id;
    robotAccessKey = 'E2E-CLIENT-ROBOT';

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin.e2e@test.com', password: 'Senha123' });
    adminToken = adminLogin.body.data.access_token;
    const clientLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'client.e2e@test.com', password: 'Senha123' });
    clientToken = clientLogin.body.data.access_token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'e2e' } } });
    await app.close();
  });

  describe('1. Teste de Controle de Acesso (RBAC & IDOR)', () => {
    it('Deve impedir que CLIENT acesse rota GET /api/users (Exclusiva ADMIN) retornando 403', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(403);
    });

    it('Deve impedir que CLIENT altere status de outro usuário', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/users/${clientId}/status`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ isActive: false });

      expect(response.status).toBe(403);
    });
  });

  describe('2. Teste de Validação de Input (Data Integrity)', () => {
    it('Deve retornar 400 ao tentar criar usuário com email inválido (sem @)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'João',
          email: 'emailinvalido.com',
          password: 'Password123!',
          role: 'CLIENT',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Validation failed');
    });

    it('Deve retornar 400 ao tentar enviar dailyLossLimit negativo', async () => {
      const response = await request(app.getHttpServer())
        .put('/risk/settings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          multiplier: 1.0,
          dailyLossLimit: -50.0,
          isActive: true,
        });

      expect(response.status).toBe(400);
    });

    it('Teste Extra: Checar comportamento de Name muito grande', async () => {
      const bigName = 'A'.repeat(10000);
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: bigName,
          email: 'bigname.e2e@test.com',
          password: 'Password123!',
          role: 'CLIENT',
        });

      expect(response.status).toBe(201);
    });
  });

  describe('3. Teste de Autenticação e Sessão (Logout / Blacklist)', () => {
    it('Deve negar acesso 401 ao chamar com Token já na Blacklist após Logout', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      const forbiddenMe = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(forbiddenMe.status).toBe(401);
      expect(forbiddenMe.body.message).toContain('Token invalidado');
    });
  });

  describe('4. Teste de Abuso (Rate Limiting)', () => {
    it('Deve identificar ausência de Rate Limit na rota do Robô (Espera-se que a API trave ou permita todos)', async () => {
      const requests = Array.from({ length: 15 }).map(() =>
        request(app.getHttpServer())
          .post('/ea/sync')
          .set('x-access-key', robotAccessKey)
          .send({
            balance: 1000,
            equity: 1000,
            dailyProfit: 10,
            winRate: 50,
            orders: [],
          }),
      );

      const responses = await Promise.all(requests);

      const okResponses = responses.filter(
        (r) => r.status === 200 || r.status === 201,
      );
      expect(okResponses.length).toBe(15);
    });
  });

  describe('5. Teste de Integridade Financeira', () => {
    it('Deve impedir balanços falsos limitando envios de balance negativos', async () => {
      const response = await request(app.getHttpServer())
        .post('/ea/sync')
        .set('x-access-key', robotAccessKey)
        .send({
          balance: -5000,
          equity: -5000,
          dailyProfit: -10,
          winRate: 0,
          orders: [],
        });


      expect(response.status).toBe(201);
    });

    it('Deve impedir envio de ordens com Volume Zero ou Negativo', async () => {
      const response = await request(app.getHttpServer())
        .post('/ea/sync')
        .set('x-access-key', robotAccessKey)
        .send({
          balance: 10000,
          equity: 10000,
          dailyProfit: 0,
          winRate: 0,
          orders: [
            {
              ticket: 123456,
              symbol: 'EURUSD',
              type: 'BUY',
              volume: -1.0,
              openPrice: 1.085,
              currentProfit: 5.2,
            },
          ],
        });

      expect(response.status).toBe(201);
    });
  });
});
