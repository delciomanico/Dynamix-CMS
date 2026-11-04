import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, Matches, MinLength, ValidateNested } from 'class-validator';
import { AccessService } from '../common/access.service';
import { FIELD_TYPES } from '../common/field-types';
import { slugify } from '../common/slug';
import { CurrentUser, JwtAuthGuard } from '../auth/auth.guards';
import { PrismaService } from '../prisma/prisma.service';

class FieldDto {
  @IsString() @Matches(/^[a-z][a-z0-9_]*$/, { message: 'key deve ser snake_case (ex: button_text)' }) key: string;
  @IsString() @MinLength(1) label: string;
  @IsIn(FIELD_TYPES as unknown as string[]) type: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) options?: string[];
}
class CreateComponentDto {
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() description?: string;
  @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => FieldDto) fields: FieldDto[];
}
class UpdateComponentDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => FieldDto) fields?: FieldDto[];
}

type U = { id: string };

function fieldRows(fields: FieldDto[]) {
  const keys = new Set<string>();
  return fields.map((f, position) => {
    if (keys.has(f.key)) throw new BadRequestException(`Chave de campo duplicada: ${f.key}`);
    keys.add(f.key);
    if ((f.type === 'select' || f.type === 'multiselect') && !f.options?.length) {
      throw new BadRequestException(`O campo "${f.label}" precisa de opções`);
    }
    return { key: f.key, label: f.label, type: f.type, required: !!f.required, options: f.options ?? [], position };
  });
}

@ApiTags('management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ComponentsController {
  constructor(private prisma: PrismaService, private access: AccessService) {}

  @Get('projects/:pid/components')
  async list(@CurrentUser() u: U, @Param('pid') pid: string) {
    await this.access.project(u.id, pid);
    return this.prisma.component.findMany({
      where: { projectId: pid },
      include: { fields: { orderBy: { position: 'asc' } }, _count: { select: { entries: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post('projects/:pid/components')
  async create(@CurrentUser() u: U, @Param('pid') pid: string, @Body() d: CreateComponentDto) {
    await this.access.project(u.id, pid);
    const slug = slugify(d.name);
    if (!slug) throw new BadRequestException('Nome inválido');
    if (await this.prisma.component.findUnique({ where: { projectId_slug: { projectId: pid, slug } } })) {
      throw new BadRequestException(`Já existe um componente "${slug}" neste projeto`);
    }
    return this.prisma.component.create({
      data: { projectId: pid, name: d.name, slug, description: d.description, fields: { create: fieldRows(d.fields) } },
      include: { fields: { orderBy: { position: 'asc' } } },
    });
  }

  @Get('components/:id')
  get(@CurrentUser() u: U, @Param('id') id: string) {
    return this.access.component(u.id, id);
  }

  @Patch('components/:id')
  async update(@CurrentUser() u: U, @Param('id') id: string, @Body() d: UpdateComponentDto) {
    await this.access.component(u.id, id);
    const rows = d.fields ? fieldRows(d.fields) : null;
    return this.prisma.$transaction(async (tx) => {
      if (rows) {
        await tx.componentField.deleteMany({ where: { componentId: id } });
        await tx.componentField.createMany({ data: rows.map((r) => ({ ...r, componentId: id })) });
      }
      return tx.component.update({
        where: { id },
        data: { name: d.name, description: d.description },
        include: { fields: { orderBy: { position: 'asc' } } },
      });
    });
  }

  @Delete('components/:id')
  async remove(@CurrentUser() u: U, @Param('id') id: string) {
    await this.access.component(u.id, id);
    await this.prisma.component.delete({ where: { id } });
    return { ok: true };
  }
}
