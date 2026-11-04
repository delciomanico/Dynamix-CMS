import { BadGatewayException, BadRequestException, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard, JwtAuthGuard } from '../auth/auth.guards';

/** Proxy (só ADMIN) para o serviço interno de backups. O token do serviço nunca chega ao browser. */
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/backups')
export class BackupsController {
  private async call(method: string, path: string) {
    const base = process.env.BACKUP_URL;
    if (!base || !process.env.BACKUP_TOKEN) return null;
    try {
      const res = await fetch(`${base}${path}`, { method, headers: { Authorization: `Bearer ${process.env.BACKUP_TOKEN}` }, signal: AbortSignal.timeout(10_000) });
      const body: any = await res.json().catch(() => ({}));
      if (res.status === 409) throw new BadRequestException(body.message ?? 'Backup já em curso');
      if (!res.ok) throw new BadGatewayException(body.message ?? `Serviço de backup respondeu ${res.status}`);
      return body;
    } catch (e: any) {
      if (e.getStatus) throw e;
      throw new BadGatewayException('Serviço de backup inacessível');
    }
  }

  @Get()
  async status() {
    return (await this.call('GET', '/status')) ?? { enabled: false };
  }

  @Post('run')
  @HttpCode(202)
  async run() {
    return (await this.call('POST', '/run?trigger=manual')) ?? { enabled: false };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    if (!/^\d{8}T\d{6}Z$/.test(id)) throw new BadRequestException('id inválido');
    return (await this.call('DELETE', `/backups/${id}`)) ?? { enabled: false };
  }
}
