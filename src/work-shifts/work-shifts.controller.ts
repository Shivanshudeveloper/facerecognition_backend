import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { WorkShiftsService } from './work-shifts.service';

@Controller('work-shifts')
export class WorkShiftsController {
    constructor(private workShiftsService: WorkShiftsService) { }

    @Get('/getAllWorkShifts/:orgId')
    async getAllWorkShifts(@Param() param:any): Promise<any> {
        try {
            return await this.workShiftsService.getAllWorkShifts(param.orgId);
        } catch (error) {
            return {
                success: false,
                error
            }
        }
    }

    @Post('/addNewWorkShift')
    async addNewWorkShift(@Body() body: any): Promise<any> {
        try {
            return await this.workShiftsService.addNewWorkShift(body);
        } catch (error) {
            return {
                success: false,
                error
            }
        }
    }

    @Delete('/deleteWorkShift/:workShiftId')
    async deleteWorkShift(@Param() param: any): Promise<any> {
        try {
            return await this.workShiftsService.deleteWorkShift(param.workShiftId);
        } catch (error) {
            return {
                success: false,
                error
            }
        }
    }

    @Put('/updateWorkShift/:workShiftId')
    async updateWorkShift(@Param() param: any, @Body() body: any): Promise<any> {
        try {
            return await this.workShiftsService.updateWorkShift(param.workShiftId, body);
        } catch (error) {
            return {
                success: false,
                error
            }
        }
    }

    @Put('/assignGroupsToWorkShift/:workShiftId')
    async assignGroupsToWorkShift(@Param() param: any, @Body() body: any): Promise<any> {
        try {
            return await this.workShiftsService.assignGroupsToWorkShift(param.workShiftId, body);
        } catch (error) {
            return {
                success: false,
                error
            }
        }
    }



}
