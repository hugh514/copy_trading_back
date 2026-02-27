import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS logic required for the frontend at Vercel
  app.enableCors({
    origin: ['https://copy-trading-xi.vercel.app', 'http://localhost:3000'],
    credentials: true,
  });

  // Global Zod Validation Pipe
  app.useGlobalPipes(new ZodValidationPipe());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Copy Trading API MVP')
    .setDescription('API backend mínima viável para o sistema de Copy Trading')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);


  app.use(
    '/reference',
    apiReference({
      content: document,
      theme: 'purple',
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
