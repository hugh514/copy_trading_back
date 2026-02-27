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

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Copy Trading API MVP')
    .setDescription('API backend mínima viável para o sistema de Copy Trading')
    .setVersion('1.0')
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
