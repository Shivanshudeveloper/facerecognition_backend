import { Body, Controller,Delete,Get, Param, Post, Put } from '@nestjs/common';
import { DevicesService } from './devices.service';
@Controller('devices')
export class DevicesController {
    constructor(private devicesService: DevicesService) { }

    @Get('/getAllDevices/:orgId')
    getAllDevices(@Param() param:any): Promise<any> {
        return this.devicesService.getAllDevices(param.orgId);
    }

    @Post('/addDevice')
    async addDevice(@Body() body:any): Promise<any> {
        await this.devicesService.addDevice(body);
    }
    @Delete('/deleteDevice/:deviceId')
    async deleteDevice(@Param() param:any): Promise<any> {
        await this.devicesService.deleteDevice(param.deviceId);
    }
    @Put('/updateDevice/:deviceId')
    async updateDevice(@Param() param:any,@Body() body:any): Promise<any> {
        await this.devicesService.updateDevice(param.deviceId,body);
    }
}
