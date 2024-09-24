import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { OrganizationService } from './organization.service';
@Controller('organization')
export class OrganizationController {
    constructor(private readonly organizationService: OrganizationService) {}
    @Get('/getOrganization/:email')
    async getOrganization(@Param('email') email: string){
        return await this.organizationService.getOrganization(email);
    }
    @Post('/createOrganization')
    async createOrganization(@Body() body: any){
        await this.organizationService.createOrganization(body);
    }
    @Get('/getOrganizationProfile/:org_id')
    async getOrganizationProfile(@Param('org_id') org_id: string){
        return await this.organizationService.getOrganizationProfile(org_id);
    }
    @Put('/updateOrganization/:org_id')
    async updateOrganization(@Param('org_id') org_id: string, @Body() body: any){
        return await this.organizationService.updateOrganization(org_id, body);
    }

}
