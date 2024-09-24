import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  // private supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  constructor(private configService: ConfigService) { }
  private supabase = createClient(this.configService.get<string>('SUPABASE_URL'), this.configService.get<string>('SUPABASE_KEY'));

  async signInWithGoogle(): Promise<any> {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) {
      throw error;
    }
    return data;

  }

  async googleCallback(req: Request, res: Response): Promise<any> {
    console.log(req);
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`; 
    const { searchParams, origin } = new URL(fullUrl)
    console.log(searchParams);
    console.log(origin);
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'
    console.log(next);
    console.log(code);

    if (code) {
      // const supabase = createClient()
      const { error } = await this.supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        const forwardedHost = req.headers['x-forwarded-host'] // original origin before load balancer
        const isLocalEnv = process.env.NODE_ENV === 'development'
        if (isLocalEnv) {
          // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
          return res.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          return res.redirect(`https://${forwardedHost}${next}`)
        } else {
          return res.redirect(`${origin}${next}`)
        }
      }
    }

    // return the user to an error page with instructions
    return res.redirect(`${origin}/auth/auth-code-error`)
  };
}
