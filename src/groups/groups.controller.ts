import { Body, Controller,Delete,Get, Param, Post, Put } from '@nestjs/common';
import { GroupsService } from './groups.service';
@Controller('groups')
export class GroupsController {
    constructor(private groupsService: GroupsService) { }

    @Get('/getAllGroups/:orgId')
    async getAllGroups(@Param() param:any): Promise<any> {
        return await this.groupsService.getAllGroups(param.orgId);
    }

    @Post('/createGroup')
    async createGroup(@Body() body:any): Promise<any> {
        return await this.groupsService.createGroup(body);
    }
    @Delete('/deleteGroup/:groupId')
    async deleteGroup(@Param() param:any): Promise<any> {
        return await this.groupsService.deleteGroup(param.groupId);
    }
    @Put('/updateGroup/:groupId')
    async updateGroup(@Param() param:any, @Body() body:any): Promise<any> {
        return await this.groupsService.updateGroup(param.groupId, body);
    }
}
