import { BadRequestException, Controller, Delete, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { AccessService } from '../common/access.service';
import { CurrentUser, JwtAuthGuard } from '../auth/auth.guards';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const ALLOWED = /^(image\/(png|jpe?g|gif|webp|avif)|application\/pdf|text\/plain)$/;
type U = { id: string };

@ApiTags('management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class MediaController {
  constructor(private prisma: PrismaService, private access: AccessService, private storage: StorageService) {}

  @Get('projects/:pid/media')
  async list(@CurrentUser() u: U, @Param('pid') pid: string) {
    await this.access.project(u.id, pid);
    return this.prisma.mediaAsset.findMany({ where: { projectId: pid }, orderBy: { createdAt: 'desc' } });
  }

  @Post('projects/:pid/media')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(@CurrentUser() u: U, @Param('pid') pid: string, @UploadedFile() file?: Express.Multer.File) {
    await this.access.project(u.id, pid);
    if (!file) throw new BadRequestException('Ficheiro em falta (campo "file")');
    if (!ALLOWED.test(file.mimetype)) throw new BadRequestException(`Tipo não permitido: ${file.mimetype}`);
    const key = `${pid}/${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    await this.storage.put(key, file.buffer, file.mimetype);
    return this.prisma.mediaAsset.create({
      data: { projectId: pid, key, filename: file.originalname, mimeType: file.mimetype, size: file.size },
    });
  }

  @Delete('media/:id')
  async remove(@CurrentUser() u: U, @Param('id') id: string) {
    const m = await this.prisma.mediaAsset.findFirst({ where: { id, project: { workspace: { ownerId: u.id } } } });
    if (!m) throw new BadRequestException('Ficheiro não encontrado');
    await this.storage.remove(m.key).catch(() => undefined);
    await this.prisma.mediaAsset.delete({ where: { id } });
    return { ok: true };
  }
}
