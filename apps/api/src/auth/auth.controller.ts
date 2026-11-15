import { Body, Controller, Delete, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
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
class UpdateProfileDto {
  @IsString() @MinLength(2) @MaxLength(80) name: string;
}
class ChangeEmailDto {
  @IsEmail() newEmail: string;
  /** Password atual (ou, em contas só-Google, o email atual). */
  @IsString() confirm: string;
}
class DeleteAccountDto {
  @IsString() confirm: string;
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@CurrentUser() u: { id: string }, @Body() d: UpdateProfileDto) {
    return this.auth.updateProfile(u.id, d.name);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('change-email')
  changeEmail(@CurrentUser() u: { id: string }, @Body() d: ChangeEmailDto) {
    return this.auth.changeEmail(u.id, d.newEmail, d.confirm);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout-others')
  logoutOthers(@CurrentUser() u: { id: string }) {
    return this.auth.logoutOthers(u.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Delete('account')
  deleteAccount(@CurrentUser() u: { id: string }, @Body() d: DeleteAccountDto) {
    return this.auth.deleteAccount(u.id, d.confirm);
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
