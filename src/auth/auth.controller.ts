import { Controller, Get, Res, Req, Header,UseGuards, Post } from '@nestjs/common';
// import AuthGaurd
import { AuthService } from './auth.service';
import {Request,Response} from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {

    }

    @Get('/signInWithGoogle')
    @Header('Content-Type', 'application/json')
    async signInWithGoogle(@Req() req: any, @Res() res: any): Promise<any> {
        const response = await this.authService.signInWithGoogle();
        console.log(response);
        return res.json(response)
    }

    @Get('/google/callback')
    async googleCallback(@Req() req: Request, @Res() res: Response): Promise<any> {
        return await this.authService.googleCallback(req,res);
    }
}
