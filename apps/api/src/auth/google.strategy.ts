import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(cfg: ConfigService) {
    super({
      clientID: cfg.get('GOOGLE_CLIENT_ID') || 'disabled',
      clientSecret: cfg.get('GOOGLE_CLIENT_SECRET') || 'disabled',
      callbackURL: `${cfg.get('API_PUBLIC_URL', 'http://localhost:3001')}/api/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }
  validate(_a: string, _r: string, profile: any) {
    return { googleId: profile.id, email: profile.emails?.[0]?.value, name: profile.displayName };
  }
}
