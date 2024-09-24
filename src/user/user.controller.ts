import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/user.dto';
@Controller('user')
export class UserController {
    constructor(private userService: UserService) { }

    @Get('/getAllUsers')
    getAllUsers(): Promise<any> {
        return this.userService.getAllUsers();
    }

    @Get('/checkUserExistance/:email')
    async checkUserExistance(@Param('email') email: string): Promise<any> {
        return await this.userService.checkUserExistance(email);
    }
    
}   
