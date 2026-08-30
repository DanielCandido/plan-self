import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';

type Upload = { buffer: Buffer; originalname: string; mimetype: string; size: number };

@Injectable()
export class ProjectFilesService {
  private readonly root = resolve(process.env.FILE_STORAGE_PATH || '/data/files');

  constructor(private readonly prisma: PrismaService) {}

  async list(projectId: string, organizationId: string) {
    await this.assertProject(projectId, organizationId);
    const files = await this.prisma.projectFile.findMany({
      where: { projectId, deletedAt: null },
      include: { revisions: { include: { uploadedBy: { select: { id: true, name: true } } }, orderBy: { revision: 'desc' } } },
      orderBy: { name: 'asc' },
    });
    return files.map((file) => ({ ...file, latestRevision: file.revisions[0] ?? null }));
  }

  async create(projectId: string, organizationId: string, userId: string, file: Upload | undefined, body: { name?: string; description?: string; note?: string }) {
    await this.assertProject(projectId, organizationId);
    if (!file) throw new BadRequestException('Arquivo obrigatorio');
    const name = (body.name || file.originalname).trim();
    if (!name) throw new BadRequestException('Nome do arquivo obrigatorio');
    const stored = await this.persist(projectId, file);
    try {
      return await this.prisma.projectFile.create({
        data: { projectId, name, description: body.description, revisions: { create: { revision: 1, storageKey: stored.key, originalName: file.originalname, mimeType: file.mimetype || 'application/octet-stream', size: file.size, sha256: stored.sha256, note: body.note, uploadedById: userId } } },
        include: { revisions: true },
      });
    } catch (error) { await unlink(stored.path).catch(() => undefined); throw error; }
  }

  async addRevision(projectId: string, fileId: string, organizationId: string, userId: string, file: Upload | undefined, note?: string) {
    if (!file) throw new BadRequestException('Arquivo obrigatorio');
    const record = await this.findFile(projectId, fileId, organizationId);
    const latest = await this.prisma.fileRevision.aggregate({ where: { projectFileId: record.id }, _max: { revision: true } });
    const stored = await this.persist(projectId, file);
    try {
      return await this.prisma.fileRevision.create({ data: { projectFileId: record.id, revision: (latest._max.revision ?? 0) + 1, storageKey: stored.key, originalName: file.originalname, mimeType: file.mimetype || 'application/octet-stream', size: file.size, sha256: stored.sha256, note, uploadedById: userId } });
    } catch (error) { await unlink(stored.path).catch(() => undefined); throw error; }
  }

  async download(projectId: string, fileId: string, revisionId: string, organizationId: string) {
    await this.findFile(projectId, fileId, organizationId);
    const revision = await this.prisma.fileRevision.findFirst({ where: { id: revisionId, projectFileId: fileId } });
    if (!revision) throw new NotFoundException('Revisao nao encontrada');
    return { revision, stream: createReadStream(this.pathFor(revision.storageKey)) };
  }

  async remove(projectId: string, fileId: string, organizationId: string) {
    await this.findFile(projectId, fileId, organizationId);
    await this.prisma.projectFile.update({ where: { id: fileId }, data: { deletedAt: new Date() } });
    return { deleted: true };
  }

  private async persist(projectId: string, file: Upload) {
    const directory = resolve(this.root, projectId);
    await mkdir(directory, { recursive: true });
    const key = `${projectId}/${randomUUID()}`;
    const path = this.pathFor(key);
    await writeFile(path, file.buffer, { flag: 'wx' });
    return { key, path, sha256: createHash('sha256').update(file.buffer).digest('hex') };
  }

  private pathFor(key: string) {
    const path = resolve(this.root, key);
    if (path !== this.root && !path.startsWith(`${this.root}\\`) && !path.startsWith(`${this.root}/`)) throw new BadRequestException('Chave de armazenamento invalida');
    return path;
  }

  private async assertProject(projectId: string, organizationId: string) {
    if (!(await this.prisma.project.findFirst({ where: { id: projectId, organizationId }, select: { id: true } }))) throw new NotFoundException('Projeto nao encontrado');
  }

  private async findFile(projectId: string, fileId: string, organizationId: string) {
    const record = await this.prisma.projectFile.findFirst({ where: { id: fileId, projectId, deletedAt: null, project: { organizationId } } });
    if (!record) throw new NotFoundException('Arquivo nao encontrado');
    return record;
  }
}
