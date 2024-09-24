import { Controller, Get } from '@nestjs/common';
import { LocationsService } from './locations.service';
@Controller('locations')
export class LocationsController {
    constructor(private locationsService: LocationsService) { }

    @Get('/getAllLocations')
    async getAllLocations(): Promise<any> {
        try {
            return await this.locationsService.getAllLocations();
        } catch (error) {
            return {
                success: false,
                error
            }
        }
    }
}
