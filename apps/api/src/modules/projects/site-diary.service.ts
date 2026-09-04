import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import type { SaveSiteDiaryDto } from './dto/site-diary.dto';

type Upload = { buffer: Buffer; originalname: string; mimetype: string; size: number };

@Injectable()
export class SiteDiaryService {
  private readonly root = resolve(process.env.FILE_STORAGE_PATH || '/data/files');
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId: string, organizationId: string) {
    await this.assertProject(projectId, organizationId);
    return this.prisma.siteDiary.findMany({ where: { projectId }, include: { photos: { orderBy: { createdAt: 'asc' } } }, orderBy: { reportDate: 'desc' } });
  }

  async save(projectId: string, organizationId: string, userId: string, dto: SaveSiteDiaryDto) {
    await this.assertProject(projectId, organizationId);
    const reportDate = new Date(dto.reportDate);
    const data = {
      weather: dto.weather,
      temperature: dto.temperature,
      workforce: dto.workforce as Prisma.InputJsonValue,
      equipment: dto.equipment as Prisma.InputJsonValue,
      services: dto.services as Prisma.InputJsonValue,
      occurrences: dto.occurrences as Prisma.InputJsonValue,
      notes: dto.notes,
      status: dto.status ?? 'DRAFT',
    };
    return this.prisma.siteDiary.upsert({
      where: { projectId_reportDate: { projectId, reportDate } },
      create: { projectId, reportDate, createdById: userId, ...data },
      update: data,
      include: { photos: true },
    });
  }

  async addPhoto(projectId: string, diaryId: string, organizationId: string, file: Upload | undefined, caption?: string) {
    await this.assertDiary(projectId, diaryId, organizationId);
    if (!file) throw new BadRequestException('Foto obrigatoria');
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('O arquivo deve ser uma imagem');
    const directory = resolve(this.root, projectId, 'diary');
    await mkdir(directory, { recursive: true });
    const storageKey = `${projectId}/diary/${randomUUID()}`;
    const path = this.pathFor(storageKey);
    await writeFile(path, file.buffer, { flag: 'wx' });
    try {
      return await this.prisma.siteDiaryPhoto.create({ data: { siteDiaryId: diaryId, storageKey, originalName: file.originalname, mimeType: file.mimetype, size: file.size, sha256: createHash('sha256').update(file.buffer).digest('hex'), caption } });
    } catch (error) { await unlink(path).catch(() => undefined); throw error; }
  }

  async photo(projectId: string, diaryId: string, photoId: string, organizationId: string) {
    await this.assertDiary(projectId, diaryId, organizationId);
    const photo = await this.prisma.siteDiaryPhoto.findFirst({ where: { id: photoId, siteDiaryId: diaryId } });
    if (!photo) throw new NotFoundException('Foto nao encontrada');
    return { photo, stream: createReadStream(this.pathFor(photo.storageKey)) };
  }

  private async assertProject(projectId: string, organizationId: string) {
    if (!(await this.prisma.project.findFirst({ where: { id: projectId, organizationId, profile: 'CONSTRUCTION_SITE' }, select: { id: true } }))) throw new NotFoundException('Obra nao encontrada');
  }
  private async assertDiary(projectId: string, diaryId: string, organizationId: string) {
    await this.assertProject(projectId, organizationId);
    if (!(await this.prisma.siteDiary.findFirst({ where: { id: diaryId, projectId }, select: { id: true } }))) throw new NotFoundException('Diario nao encontrado');
  }
  private pathFor(key: string) {
    const path = resolve(this.root, key);
    if (!path.startsWith(`${this.root}/`) && !path.startsWith(`${this.root}\\`)) throw new BadRequestException('Chave de armazenamento invalida');
    return path;
  }
}
