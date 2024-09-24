import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AttendanceService {
    constructor(private configService: ConfigService) { }
    private supabase = createClient(this.configService.get<string>('SUPABASE_URL'), this.configService.get<string>('SUPABASE_KEY'));

    async getAllAttendance(orgId: any): Promise<any> {
        // Fetch data from the first table
        const { data: table1Data, error: table1Error } = await this.supabase
            .from('time')
            .select('*').order('id', { ascending: false }).eq('org_id', orgId);
        if (table1Error) {
            throw table1Error;
        }
        console.log(table1Data);

        // Fetch data from the second table
        const { data: table2Data, error: table2Error } = await this.supabase
            .from('add_member')
            .select('*').order('id', { ascending: false });

        if (table2Error) {
            throw table2Error;
        }

        // Join the data based on the common ID
        const joinedData = [];
        table1Data.forEach((item1) => {
            const obj = table2Data.find(item2 => item2.user_id === item1.user_Id);
            if (obj) {
                joinedData.push({
                    ...obj,
                    ...item1,
                });
            }
        }
        );
        // console.log(joinedData);
        return joinedData;
    }

    async getTodaysPresentMembers(): Promise<any> {
        const { data, error } = await this.supabase.from('time').select('*').eq('created_at', new Date().toISOString().split('T')[0]);
        if (error) {
            console.log(error);
            throw error;
        }
        return data;
    }

    async getAttendanceWeeklyReport(orgId: any, body: any): Promise<any> {
        const endDate = new Date(body.date);
        const startDate = new Date(endDate);
        console.log(orgId)
        if(body.range === 'week'){
            startDate.setDate(startDate.getDate() - 6);
        }else if(body.range === 'month'){
            startDate.setMonth(startDate.getMonth() - 1);
        }
        const datesArray = []
        const tempDate = new Date(startDate);
        while (tempDate <= endDate) {
            datesArray.push(tempDate.toISOString().split('T')[0])
            tempDate.setDate(tempDate.getDate() + 1);
        }
        // datesArray.push(tempDate.toISOString().split('T')[0]);
        // console.log(datesArray);
        // console.log(startDate);
        // console.log(endDate);
        const { data, error } = await this.supabase.from('time')
            .select('*')
            .eq('org_id', orgId)
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0])
            .order('date', { ascending: false })
        if (error) {
            console.log(error);
            throw error;
        }
        const groupedData = {};
        for (let i = 0; i < data.length; i++) {

            if (!groupedData[data[i].user_Id]) {
                const { data: profileData } = await this.supabase.from('profile').select('*').eq('userId', data[i].user_Id)
                // console.log(profileData);
                const userData = {
                    ...data[i], ...profileData[0]
                }
                groupedData[data[i].user_Id] = {
                    user: userData
                };

                datesArray.forEach((date: any) => {
                    groupedData[data[i].user_Id][date] = null;
                })
            }
            groupedData[data[i].user_Id][data[i].date] = data[i]

        }
        // console.log("week data : ",groupedData);
        return groupedData
    }

    async getAttendanceMonthlyReport(orgId: any, body: any): Promise<any> {
        const endDate = new Date(body.date);
        const startDate = new Date(endDate);
        console.log(orgId)
        startDate.setMonth(startDate.getMonth() - 1);
        const datesArray = []
        const tempDate = new Date(startDate);
        while (tempDate <= endDate) {
            datesArray.push(tempDate.toISOString().split('T')[0])
            tempDate.setDate(tempDate.getDate() + 1);
        }
        // console.log(datesArray);
        // console.log(startDate);
        // console.log(endDate);
        const { data, error } = await this.supabase.from('time')
            .select('*')
            .eq('org_id', orgId)
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0])
            .order('date', { ascending: false })
        if (error) {
            console.log(error);
            throw error;
        }
        const groupedData = {};
        for (let i = 0; i < data.length; i++) {

            if (!groupedData[data[i].user_Id]) {
                const { data: profileData } = await this.supabase.from('profile').select('*').eq('userId', data[i].user_Id)
                console.log(profileData);
                const userData = {
                    ...data[i], ...profileData[0]
                }
                groupedData[data[i].user_Id] = {
                    user: userData
                };

                datesArray.forEach((date: any) => {
                    groupedData[data[i].user_Id][date] = null;
                })
            }
            groupedData[data[i].user_Id][data[i].date] = data[i]

        }
        // console.log(groupedData);
        return groupedData
    }

    async getOvertimeDailyReport(orgId: any, body: any): Promise<any> {
        const { data, error } = await this.supabase.from('time').select('*').eq('org_id', orgId).eq('date', body.date);
        if (error) {
            console.log(error);
            throw error;
        }
        console.log("before", data)
        for(let i=0; i<data.length; i++){
            const { data: profileData } = await this.supabase.from('profile').select('*').eq('userId', data[i].user_Id)
            data[i] = {
                ...data[i], ...profileData[0]
            }
        }
        console.log("after",data)

        return data;
    }

    async getOvertimeReport(orgId: any, body: any): Promise<any> {
        const endDate = new Date(body.date);
        const startDate = new Date(endDate);
        console.log(orgId)
        if(body.range === 'week') startDate.setDate(startDate.getDate() - 6);
        else if(body.range === 'month') startDate.setMonth(startDate.getMonth() - 1);
        const datesArray = []
        const tempDate = new Date(startDate);
        while (tempDate <= endDate) {
            datesArray.push(tempDate.toISOString().split('T')[0])
            tempDate.setDate(tempDate.getDate() + 1);
        }
        // datesArray.push(tempDate.toISOString().split('T')[0]);
        console.log(datesArray);
        console.log(startDate);
        console.log(endDate);
        const { data, error } = await this.supabase.from('time')
            .select('*')
            .eq('org_id', orgId)
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0])
            .order('date', { ascending: false })
        if (error) {
            console.log(error);
            throw error;
        }
        const groupedData = {};
        for (let i = 0; i < data.length; i++) {

            if (!groupedData[data[i].user_Id]) {
                const { data: profileData } = await this.supabase.from('profile').select('*').eq('userId', data[i].user_Id)
                console.log(profileData);
                const userData = {
                    ...data[i], ...profileData[0]
                }
                groupedData[data[i].user_Id] = {
                    user: userData
                };

                datesArray.forEach((date: any) => {
                    groupedData[data[i].user_Id][date] = null;
                })
            }
            groupedData[data[i].user_Id][data[i].date] = data[i]

        }
        console.log(groupedData);
        return groupedData
    }
}

