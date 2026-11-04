import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';
import { AccessService } from '../common/access.service';
import { slugify } from '../common/slug';
import { CurrentUser, JwtAuthGuard } from '../auth/auth.guards';
import { PrismaService } from '../prisma/prisma.service';

class CreateProjectDto {
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() frontendUrl?: string;
}
class UpdateProjectDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() frontendUrl?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) allowedOrigins?: string[];
}
class CreateWorkspaceDto {
  @IsString() @MinLength(2) name: string;
}

type U = { id: string };

@ApiTags('management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ProjectsController {
  constructor(private prisma: PrismaService, private access: AccessService) {}

  @Get('workspaces')
  workspaces(@CurrentUser() u: U) {
    return this.prisma.workspace.findMany({ where: { ownerId: u.id }, orderBy: { createdAt: 'asc' } });
  }

  @Post('workspaces')
  createWorkspace(@CurrentUser() u: U, @Body() d: CreateWorkspaceDto) {
    return this.prisma.workspace.create({ data: { name: d.name, ownerId: u.id } });
  }

  @Get('workspaces/:wid/projects')
  async list(@CurrentUser() u: U, @Param('wid') wid: string) {
    await this.access.workspace(u.id, wid);
    return this.prisma.project.findMany({ where: { workspaceId: wid }, orderBy: { createdAt: 'desc' } });
  }

  @Post('workspaces/:wid/projects')
  async create(@CurrentUser() u: U, @Param('wid') wid: string, @Body() d: CreateProjectDto) {
    await this.access.workspace(u.id, wid);
    const base = slugify(d.name) || 'project';
    let slug = base;
    for (let i = 2; await this.prisma.project.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
    return this.prisma.project.create({
      data: { workspaceId: wid, name: d.name, slug, description: d.description, frontendUrl: d.frontendUrl },
    });
  }

  @Get('projects/:id')
  get(@CurrentUser() u: U, @Param('id') id: string) {
    return this.access.project(u.id, id);
  }

  @Patch('projects/:id')
  async update(@CurrentUser() u: U, @Param('id') id: string, @Body() d: UpdateProjectDto) {
    await this.access.project(u.id, id);
    return this.prisma.project.update({ where: { id }, data: d });
  }

  @Delete('projects/:id')
  async remove(@CurrentUser() u: U, @Param('id') id: string) {
    await this.access.project(u.id, id);
    await this.prisma.project.delete({ where: { id } });
    return { ok: true };
  }

  @Get('projects/:id/stats')
  async stats(@CurrentUser() u: U, @Param('id') id: string) {
    await this.access.project(u.id, id);
    const [components, draft, published, archived, media] = await Promise.all([
      this.prisma.component.count({ where: { projectId: id } }),
      this.prisma.contentEntry.count({ where: { component: { projectId: id }, status: 'DRAFT' } }),
      this.prisma.contentEntry.count({ where: { component: { projectId: id }, status: 'PUBLISHED' } }),
      this.prisma.contentEntry.count({ where: { component: { projectId: id }, status: 'ARCHIVED' } }),
      this.prisma.mediaAsset.count({ where: { projectId: id } }),
    ]);
    return { components, entries: draft + published + archived, draft, published, archived, media };
  }
}
