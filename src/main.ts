import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS logic required for the frontend at Vercel
  app.enableCors({
    origin: ['https://copy-trading-xi.vercel.app', 'http://localhost:3000'],
    credentials: true,
  });

  // Global Zod Validation Pipe
  app.useGlobalPipes(new ZodValidationPipe());

  // Global Error Handling & Response Mapping
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const wsDocs = `
## WebSockets (Tempo Real)

O sistema utiliza **Socket.io** para comunicação bidirecional em tempo real.

### Autenticação e Conexão
Para conectar, utilize a biblioteca \`socket.io-client\`. A autenticação é obrigatória e segue as mesmas regras dos tokens JWT da API REST.

- **URL**: \`wss://copy-trading-back.onrender.com\`
- **Handshake**: Envie o token via query parameter (\`token\`) ou no cabeçalho \`Authorization: Bearer <token>\`.

### Eventos do Servidor (Emitidos para o Client)

| Evento | Descrição | Payload (Exemplo) |
| :--- | :--- | :--- |
| **\`authenticated\`** | Confirmado após o handshake bem sucedido. | \`{ message: "Conectado" }\` |
| **\`dashboard-update\`** | Atualização de saldo e posições do robô. | \`{ balance: 1000, equity: 1050, orders: [...] }\` |
| **\`notification\`** | Avisos do sistema (ex: Margem Baixa). | \`{ title: "Alerta", message: "...", type: "risk" }\` |
| **\`force-logout\`** | Desconexão forçada (ex: conta inativa). | \`{ message: "Sua conta foi desativada." }\` |

### Salas (Rooms)
Cada usuário entra automaticamente em uma sala privada identificada pelo seu \`userId\`. Isso garante que as atualizações do dashboard sejam entregues apenas ao dono da conta.
  `;

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Copy Trading API')
    .setDescription('API Backend para o sistema de Copy Trading.' + wsDocs)
    .setVersion('1.1')
    .addBearerAuth()
    .build();

  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));

  // Redirect root to documentation
  app.getHttpAdapter().get('/', (req, res) => {
    res.redirect('/docs');
  });

  app.use(
    '/docs',
    apiReference({
      content: document,
      theme: 'purple',
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
