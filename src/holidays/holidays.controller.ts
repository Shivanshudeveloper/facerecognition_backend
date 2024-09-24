import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { HolidaysService } from './holidays.service';
@Controller('holidays')
export class HolidaysController {
    constructor(private readonly holidaysService: HolidaysService) {}

    @Get('/getAllHolidays/:orgId')
    async getAllHolidays(@Param() param: any) {
        return await this.holidaysService.getAllHolidays(param.orgId);
    }

    @Post('/createHoliday')
    async createHoliday(@Body() body: any) {
        await this.holidaysService.createHoliday(body);
    }
    @Delete('/deleteHoliday/:holidayId')
    async deleteHoliday(@Param() param: any) {
        await this.holidaysService.deleteHoliday(param.holidayId);
    }
    @Put('/updateHoliday/:holidayId')
    async updateHoliday(@Param() param: any, @Body() body: any) {
        await this.holidaysService.updateHoliday(param.holidayId, body);
    }
}
