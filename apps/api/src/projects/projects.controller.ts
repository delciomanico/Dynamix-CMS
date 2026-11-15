import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsIn, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { AccessService } from '../common/access.service';
import { BLOG_COMPONENT, BLOG_FIELDS, normalizeTheme } from '../common/blog';
import { slugify } from '../common/slug';
import { CurrentUser, JwtAuthGuard } from '../auth/auth.guards';
import { PrismaService } from '../prisma/prisma.service';

class CreateProjectDto {
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() frontendUrl?: string;
  @IsOptional() @IsIn(['SITE', 'BLOG']) kind?: 'SITE' | 'BLOG';
}
class UpdateProjectDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() frontendUrl?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) allowedOrigins?: string[];
  @IsOptional() @IsObject() theme?: Record<string, unknown>;
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
    const blog = d.kind === 'BLOG';
    const base = slugify(d.name) || (blog ? 'blog' : 'project');
    let slug = base;
    for (let i = 2; await this.prisma.project.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
    return this.prisma.project.create({
      data: {
        workspaceId: wid, name: d.name, slug, description: d.description, frontendUrl: d.frontendUrl, kind: blog ? 'BLOG' : 'SITE',
        // Um blog nasce com o componente de artigos já pronto a usar.
        ...(blog ? { components: { create: { name: 'Artigos', slug: BLOG_COMPONENT, description: 'Artigos do blog', fields: { create: BLOG_FIELDS.map((x, position) => ({ ...x, position })) } } } } : {}),
      },
    });
  }

  @Get('projects/:id')
  get(@CurrentUser() u: U, @Param('id') id: string) {
    return this.access.project(u.id, id);
  }

  @Patch('projects/:id')
  async update(@CurrentUser() u: U, @Param('id') id: string, @Body() d: UpdateProjectDto) {
    await this.access.project(u.id, id);
    const { theme, ...rest } = d;
    return this.prisma.project.update({ where: { id }, data: { ...rest, ...(theme ? { theme: normalizeTheme(theme) as object } : {}) } });
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
