import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { GatewayServer } from './socket.gateway';

@Module({ providers: [GatewayServer] })
class GatewayModule {}

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  app.enableCors({ origin: true, credentials: true });
  await app.listen(3010);
}

bootstrap();
