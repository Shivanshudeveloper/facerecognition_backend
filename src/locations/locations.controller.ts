import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { LocationsService } from './locations.service';
@Controller('locations')
export class LocationsController {
    constructor(private locationsService: LocationsService) { }

    @Get('/getAllLocations/:orgId')
    async getAllLocations(@Param('orgId') orgId: string): Promise<any> {
        try {
            return await this.locationsService.getAllLocations(orgId);
        } catch (error) {
            return { success: false, error };
        }
    }

    @Post('/addLocation')
    async addLocation(@Body() body: any): Promise<any> {
        try {
            return await this.locationsService.addLocation(body);
        } catch (error) {
            return { success: false, error };
        }
    }

    @Delete('/deleteLocation/:locationId')
    async deleteLocation(@Param('locationId') locationId: string): Promise<any> {
        try {
            return await this.locationsService.deleteLocation(locationId);
        } catch (error) {
            return { success: false, error };
        }
    }

    @Put('/updateLocation/:locationId')
    async updateLocation(@Param('locationId') locationId: string, @Body() body: any): Promise<any> {
        try {
            return await this.locationsService.updateLocation(locationId, body);
        } catch (error) {
            return { success: false, error };
        }
    }
}
