import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CurrentUser, GoogleGuard, JwtAuthGuard } from './auth.guards';

class RegisterDto {
  @IsString() @MinLength(2) name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
}
class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(8) newPassword: string;
}
class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private cfg: ConfigService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  register(@Body() d: RegisterDto) {
    return this.auth.register(d.name, d.email, d.password);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  login(@Body() d: LoginDto) {
    return this.auth.login(d.email, d.password);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('change-password')
  changePassword(@CurrentUser() u: { id: string }, @Body() d: ChangePasswordDto) {
    return this.auth.changePassword(u.id, d.currentPassword, d.newPassword);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() u: { id: string }) {
    return this.auth.me(u.id);
  }

  @Get('google')
  @UseGuards(GoogleGuard)
  googleStart() {
    /* redirecionado pelo passport */
  }

  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleCallback(@Req() req: any, @Res() res: any) {
    const token = await this.auth.googleLogin(req.user);
    res.redirect(`${this.cfg.get('WEB_URL', 'http://localhost:5173')}/auth/callback?token=${token}`);
  }
}
