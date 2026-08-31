import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { connect } from 'node:net';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';

type Check = { status: 'up' | 'down'; latencyMs: number; error?: string };

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();
  private readonly storageRoot = resolve(process.env.FILE_STORAGE_PATH || '/data/files');

  constructor(private readonly prisma: PrismaService) {}

  live() {
    return {
      status: 'up',
      service: 'plan-self-api',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  async ready() {
    const [database, redis, storage] = await Promise.all([
      this.check('database', () => this.prisma.$queryRaw`SELECT 1`),
      this.check('redis', () => this.pingRedis()),
      this.check('storage', () => this.checkStorage()),
    ]);
    const checks = { database, redis, storage };
    return {
      status: Object.values(checks).every((check) => check.status === 'up') ? 'up' : 'down',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  private async check(_name: string, operation: () => Promise<unknown>): Promise<Check> {
    const started = Date.now();
    try {
      await operation();
      return { status: 'up', latencyMs: Date.now() - started };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - started,
        error: error instanceof Error ? error.message : 'unknown error',
      };
    }
  }

  private async checkStorage() {
    await mkdir(this.storageRoot, { recursive: true });
    const probe = resolve(this.storageRoot, `.health-${randomUUID()}`);
    await writeFile(probe, 'ok', { flag: 'wx' });
    await unlink(probe);
  }

  private pingRedis(): Promise<void> {
    const url = new URL(process.env.REDIS_URL || 'redis://redis:6379');
    return new Promise((resolvePromise, reject) => {
      const socket = connect({ host: url.hostname, port: Number(url.port || 6379) });
      const timeout = setTimeout(() => socket.destroy(new Error('Redis timeout')), 2000);
      socket.setEncoding('utf8');
      socket.once('connect', () => socket.write('*1\r\n$4\r\nPING\r\n'));
      socket.once('data', (data) => {
        clearTimeout(timeout);
        socket.end();
        String(data).startsWith('+PONG') ? resolvePromise() : reject(new Error('Redis invalid response'));
      });
      socket.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }
}
