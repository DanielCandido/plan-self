import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { catchError, concatMap, from, Observable, of, throwError } from 'rxjs';
import { PrismaService } from '../../modules/prisma/prisma.service';

type AuthenticatedRequest = {
  method: string;
  originalUrl?: string;
  url: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  user?: { sub?: string; userId?: string; organizationId?: string };
};

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = request.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return next.handle();

    const rawKey = request.headers['idempotency-key'];
    const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
    if (!key) return next.handle();
    if (key.length > 128) throw new ConflictException('Chave de idempotencia invalida.');

    const path = request.originalUrl ?? request.url;
    const requestHash = createHash('sha256')
      .update(JSON.stringify({ method, path, body: request.body ?? null }))
      .digest('hex');

    const existing = await this.prisma.idempotencyRecord.findUnique({ where: { key } });
    if (existing) return this.resolveExisting(existing, method, path, requestHash, context);

    try {
      await this.prisma.idempotencyRecord.create({
        data: {
          key,
          method,
          path,
          requestHash,
          userId: request.user?.sub ?? request.user?.userId,
          organizationId: request.user?.organizationId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await this.prisma.idempotencyRecord.findUniqueOrThrow({ where: { key } });
        return this.resolveExisting(raced, method, path, requestHash, context);
      }
      throw error;
    }

    return next.handle().pipe(
      concatMap((response) =>
        from(
          this.prisma.idempotencyRecord.update({
            where: { key },
            data: {
              status: 'COMPLETED',
              statusCode: context.switchToHttp().getResponse<{ statusCode: number }>().statusCode,
              response: response === undefined ? Prisma.JsonNull : (response as Prisma.InputJsonValue),
            },
          }),
        ).pipe(concatMap(() => of(response))),
      ),
      catchError((error) =>
        from(this.prisma.idempotencyRecord.deleteMany({ where: { key, status: 'PENDING' } })).pipe(
          concatMap(() => throwError(() => error)),
        ),
      ),
    );
  }

  private resolveExisting(
    record: { method: string; path: string; requestHash: string; status: string; statusCode: number | null; response: unknown },
    method: string,
    path: string,
    requestHash: string,
    context: ExecutionContext,
  ): Observable<unknown> {
    if (record.method !== method || record.path !== path || record.requestHash !== requestHash) {
      throw new ConflictException('A chave de idempotencia ja foi usada por outra operacao.');
    }
    if (record.status !== 'COMPLETED') {
      throw new ConflictException('A operacao com esta chave ainda esta em processamento.');
    }
    if (record.statusCode) context.switchToHttp().getResponse<{ status: (code: number) => void }>().status(record.statusCode);
    return of(record.response);
  }
}
