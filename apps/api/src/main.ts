import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const prisma = app.get(PrismaService);
  const webUrl = process.env.WEB_URL ?? 'http://localhost:5173';

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS: API de gestão só aceita o dashboard; API pública usa os domínios autorizados de cada projeto.
  app.enableCors((req: any, cb: (err: Error | null, opts?: object) => void) => {
    const origin = req.headers.origin as string | undefined;
    const base = { methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] };
    const m = /^\/api\/v1\/public\/([^/?]+)/.exec(req.originalUrl ?? req.url ?? '');
    if (!m) return cb(null, { ...base, origin: origin === webUrl });
    prisma.project
      .findUnique({ where: { slug: m[1] }, select: { allowedOrigins: true } })
      .then((p) => cb(null, { ...base, methods: ['GET', 'OPTIONS'], origin: !p?.allowedOrigins.length || (!!origin && p.allowedOrigins.includes(origin)) ? true : false }))
      .catch(() => cb(null, { ...base, origin: false }));
  });

  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('Dynamix-CMS API').setVersion('0.1').addBearerAuth().build(),
  );
  SwaggerModule.setup('docs', app, doc);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`API:  http://localhost:${port}/api/v1\nDocs: http://localhost:${port}/docs`);
}
bootstrap();
