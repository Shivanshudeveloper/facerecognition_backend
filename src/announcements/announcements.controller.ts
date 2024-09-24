import { Body, Controller, Delete, Get, Param, Post, Put, UploadedFile,UseInterceptors } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('announcements')
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) {}

    @Get('/getAllAnnouncements/:orgId')
    async getAllAnnouncements(@Param() param:any) {
        return await this.announcementsService.getAllAnnouncements(param.orgId);
    }

    @Post('/createAnnouncement')
    @UseInterceptors(FileInterceptor('attachment'))
    async createAnnouncement(
        @UploadedFile() file:Express.Multer.File,
        @Body() body: any){
        await this.announcementsService.createAnnouncement(body,file);
    }

    @Delete('/removeAnnouncement/:id')
    async removeAnnouncement(@Param() param:any){
        await this.announcementsService.removeAnnouncement(param.id);
    }

    @Put('/updateAnnouncement/:id')
    @UseInterceptors(FileInterceptor('attachment'))
    async updateAnnouncement(
        @Param() param:any,
        @UploadedFile() file:Express.Multer.File,
        @Body() body: any){
        await this.announcementsService.updateAnnouncement(param.id,body,file);
    }
}
