import { Global, Injectable, Module, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Isolamento: todo o acesso de gestão passa por aqui; devolve 404 se o recurso não pertence ao utilizador. */
@Injectable()
export class AccessService {
  constructor(private prisma: PrismaService) {}

  async project(userId: string, projectId: string) {
    const p = await this.prisma.project.findFirst({
      where: { id: projectId, workspace: { ownerId: userId } },
    });
    if (!p) throw new NotFoundException('Projeto não encontrado');
    return p;
  }

  async component(userId: string, componentId: string) {
    const c = await this.prisma.component.findFirst({
      where: { id: componentId, project: { workspace: { ownerId: userId } } },
      include: { fields: { orderBy: { position: 'asc' } } },
    });
    if (!c) throw new NotFoundException('Componente não encontrado');
    return c;
  }

  async entry(userId: string, entryId: string) {
    const e = await this.prisma.contentEntry.findFirst({
      where: { id: entryId, component: { project: { workspace: { ownerId: userId } } } },
      include: { component: { include: { fields: { orderBy: { position: 'asc' } } } } },
    });
    if (!e) throw new NotFoundException('Conteúdo não encontrado');
    return e;
  }

  async workspace(userId: string, workspaceId: string) {
    const w = await this.prisma.workspace.findFirst({ where: { id: workspaceId, ownerId: userId } });
    if (!w) throw new NotFoundException('Workspace não encontrado');
    return w;
  }
}

@Global()
@Module({ providers: [AccessService], exports: [AccessService] })
export class AccessModule {}
