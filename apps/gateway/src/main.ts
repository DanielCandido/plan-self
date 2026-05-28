import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { GatewayServer } from './socket.gateway';
import { InternalEventsController } from './internal-events.controller';
import { loadGatewayConfig, loadRootEnv } from '@plan-self/config';

loadRootEnv();
const gatewayConfig = loadGatewayConfig();

@Module({ providers: [GatewayServer], controllers: [InternalEventsController] })
class GatewayModule {}

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  app.enableCors({ origin: true, credentials: true });
  await app.listen(gatewayConfig.port);
}

bootstrap();
