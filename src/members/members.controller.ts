import { Controller, Get, Post, UseInterceptors, UploadedFile, Body, Param, Delete, Put } from '@nestjs/common';
import { MembersService } from './members.service';
import { FileInterceptor } from '@nestjs/platform-express';
@Controller('members')
export class MembersController {
    constructor(private membersService: MembersService) { }

    @Get('/getAllMembers/:orgId')
    getAllMembers(@Param() param: any): Promise<any> {
        return this.membersService.getAllMembers(param.orgId);
    }

    @Post('/addMember')
    @UseInterceptors(FileInterceptor('member_image'))
    async addMember(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: any) {
        await this.membersService.addMember(body, file);
    }

    @Delete('/deleteMember/:id')
    async deleteMember(@Param() param: any) {
        await this.membersService.deleteMember(param.id);
    }

    @Post('/sendMail')
    async sendMail(@Body() body: any) {
        console.log(body);
        await this.membersService.sendMail(body);
    }
    @Post('/sendSMS')
    async sendSMS(@Body() body: any) {
        console.log(body);
        await this.membersService.sendSMS(body);
    }

    @Put('/updateMember/:id')
    @UseInterceptors(FileInterceptor('member_image'))
    async updateMember(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: any,
        @Param() param: any) {
        await this.membersService.updateMember(param.id, body, file);
    }

    @Get('/getShiftFromGroup/:group')
    async getShiftFromGroup(@Param() param: any): Promise<any> {
        return this.membersService.getShiftFromGroup(param.group);
    }
}
