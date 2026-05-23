import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { GatewayServer } from './socket.gateway';
import { loadGatewayConfig, loadRootEnv } from '@plan-self/config';

loadRootEnv();
const gatewayConfig = loadGatewayConfig();

@Module({ providers: [GatewayServer] })
class GatewayModule {}

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  app.enableCors({ origin: true, credentials: true });
  await app.listen(gatewayConfig.port);
}

bootstrap();
