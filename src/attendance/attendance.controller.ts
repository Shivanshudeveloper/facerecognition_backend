import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
@Controller('attendance')
export class AttendanceController {
    constructor(private attendanceService: AttendanceService) { }

    @Get('/getAllAttendance/:orgId')
    async getAllAttendance(@Param() param: any): Promise<any> {
        try {
            return await this.attendanceService.getAllAttendance(param.orgId);
        } catch (error) {
            return {
                success: false,
                error
            }
        }
    }

    @Get('/getTodaysPresentMembers')
    async getTodaysPresentMembers(): Promise<any> {
        try {
            return await this.attendanceService.getTodaysPresentMembers();
        } catch (error) {
            return {
                success: false,
                error
            }
        }
    }

    @Post('/getAttendanceReport/:orgId')
    async getAttendanceWeeklyReport(@Param() param: any, @Body() body: any): Promise<any> {
        try {
            return await this.attendanceService.getAttendanceWeeklyReport(param.orgId, body);
        } catch (error) {
            return {
                success: false,
                error
            }
        }
    }

    @Post('/getAttendanceMonthlyReport/:orgId')
    async getAttendanceMonthlyReport(@Param() param: any, @Body() body: any): Promise<any> {
        try {
            return await this.attendanceService.getAttendanceMonthlyReport(param.orgId, body);
        } catch (error) {
            return {
                success: false,
                error
            }
        }
    }

    @Post('/getOvertimeDailyReport/:orgId')
    async getOvertimeDailyReport(@Param() param: any, @Body() body: any): Promise<any> {
        try {
            return await this.attendanceService.getOvertimeDailyReport(param.orgId, body);
        } catch (error) {
            return {
                success: false,
                error
            }
        }
    }

    @Post('/getOvertimeReport/:orgId')
    async getOvertimeReport(@Param() param: any, @Body() body: any): Promise<any> {
        try {
            return await this.attendanceService.getOvertimeReport(param.orgId, body);
        } catch (error) {
            return {
                success: false,
                error
            }
        }
    }

}
