import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_APP_REDIRECT,
      scope: 'email',
      profileFields: ['emails', 'name', 'photos'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { displayName, emails, id, name } = profile;

    const user = {
      id,
      email: emails?.[0]?.value,
      image: profile?.photos?.[0]?.value,
      name: displayName || name?.givenName + ' ' + name?.familyName,
    };

    const payload = {
      ...user,
      accessToken,
    };

    done(null, payload);
  }
}
